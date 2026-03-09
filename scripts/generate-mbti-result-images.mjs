#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const MBTI_TYPES = [
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP"
];

const THEME_DESCRIPTORS = {
    "default": "MBTI personality test, everyday lifestyle mood",
    "generic": "MBTI personality test, neutral and clean visual mood",
    "running": "running, urban jogging, athletic and energetic",
    "surfing": "surfing, beach and ocean wave lifestyle",
    "camping": "camping, outdoor nature lifestyle",
    "motorbike": "motorbike riding, road trip and freedom",
    "love-style": "love and romance relationship mood",
    "consumption-style": "shopping and consumption behavior mood",
    "relationship-style": "social relationship and communication mood",
    "travel-style": "travel adventure and exploration mood",
    "office-character": "office work life and team collaboration mood",
    "stress-relief": "stress relief and healing, calm and recovery mood",
    "fandom-style": "fandom culture, fan activity and enthusiasm mood"
};

const THEME_STYLE_NOTES = {
    "default": "cozy daily-life vibe with playful details",
    "generic": "minimal but punchy composition with clear focal point",
    "running": "street run club energy, dynamic movement and sweat sparkle",
    "surfing": "sunny beach youth trip vibe with splash action",
    "camping": "weekend camp aesthetic, analog gear and warm campfire tone",
    "motorbike": "stylish city-night riding mood with speed and confidence",
    "love-style": "modern dating scene tone, light romantic comedy mood",
    "consumption-style": "trend-savvy shopper vibe, witty choice moments",
    "relationship-style": "friends-and-networking mood, social chemistry and balance",
    "travel-style": "budget airline and spontaneous trip mood, freedom-first",
    "office-character": "young office life with caffeine-fueled hustle mood",
    "stress-relief": "after-work healing moments, calm but still vivid",
    "fandom-style": "concert and merch culture excitement, fan-life humor"
};

const MBTI_PERSONA = {
    INTJ: "strategic, independent, long-term planner",
    INTP: "analytical, curious, conceptual thinker",
    ENTJ: "decisive, leader-like, goal driven",
    ENTP: "inventive, witty, idea explorer",
    INFJ: "insightful, empathetic, idealistic",
    INFP: "sensitive, authentic, value driven",
    ENFJ: "supportive, social leader, warm communicator",
    ENFP: "enthusiastic, imaginative, people-focused",
    ISTJ: "reliable, practical, methodical",
    ISFJ: "caring, detail-oriented, steady",
    ESTJ: "organized, direct, execution-focused",
    ESFJ: "friendly, cooperative, community-minded",
    ISTP: "hands-on, calm, problem solver",
    ISFP: "artistic, gentle, present-focused",
    ESTP: "bold, action-oriented, adaptable",
    ESFP: "expressive, lively, fun-loving"
};

async function loadDotEnvFile(filePath = ".env") {
    try {
        const text = await fs.readFile(filePath, "utf8");
        const lines = text.split(/\r?\n/);

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) {
                return;
            }

            const eqIndex = trimmed.indexOf("=");
            if (eqIndex <= 0) {
                return;
            }

            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();
            if (!key || process.env[key]) {
                return;
            }

            if (
                (value.startsWith("\"") && value.endsWith("\""))
                || (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            process.env[key] = value;
        });
    } catch (error) {
        if (error && error.code === "ENOENT") {
            return;
        }
        throw error;
    }
}

function parseArgs(argv) {
    const args = {
        theme: "all",
        mbti: "all",
        model: "gpt-image-1-mini",
        quality: "low",
        outputFormat: "png",
        force: true,
        dryRun: false,
        size: "1024x1024",
        delayMs: 1200,
        concurrency: 1,
        minIntervalMs: 13000,
        maxRetries: 5,
        outputRoot: path.resolve("resource/result-images")
    };

    argv.forEach((entry) => {
        if (entry === "--dry-run") args.dryRun = true;
        if (entry === "--no-force") args.force = false;
        if (entry.startsWith("--theme=")) args.theme = entry.split("=")[1] || "all";
        if (entry.startsWith("--model=")) args.model = entry.split("=")[1] || args.model;
        if (entry.startsWith("--quality=")) args.quality = entry.split("=")[1] || args.quality;
        if (entry.startsWith("--output-format=")) args.outputFormat = entry.split("=")[1] || args.outputFormat;
        if (entry.startsWith("--mbti=")) {
            const value = (entry.split("=")[1] || "all").trim();
            args.mbti = value.toLowerCase() === "all" ? "all" : value.toUpperCase();
        }
        if (entry.startsWith("--size=")) args.size = entry.split("=")[1] || args.size;
        if (entry.startsWith("--delay-ms=")) args.delayMs = Number(entry.split("=")[1]) || args.delayMs;
        if (entry.startsWith("--concurrency=")) args.concurrency = Math.max(1, Number(entry.split("=")[1]) || args.concurrency);
        if (entry.startsWith("--min-interval-ms=")) args.minIntervalMs = Math.max(0, Number(entry.split("=")[1]) || args.minIntervalMs);
        if (entry.startsWith("--max-retries=")) args.maxRetries = Math.max(0, Number(entry.split("=")[1]) || args.maxRetries);
        if (entry.startsWith("--output-root=")) args.outputRoot = path.resolve(entry.split("=")[1] || args.outputRoot);
    });

    return args;
}

async function listThemeDirs(outputRoot) {
    const entries = await fs.readdir(outputRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

function resolveTargets(allThemes, args) {
    const themes = args.theme === "all" ? allThemes : [args.theme];
    const mbtiList = args.mbti === "all" ? MBTI_TYPES : [args.mbti];

    themes.forEach((theme) => {
        if (!allThemes.includes(theme)) {
            throw new Error(`Unknown theme: ${theme}`);
        }
    });
    mbtiList.forEach((mbti) => {
        if (!MBTI_TYPES.includes(mbti)) {
            throw new Error(`Unknown MBTI: ${mbti}`);
        }
    });

    return { themes, mbtiList };
}

function buildPrompt(theme, mbti) {
    const themeDescriptor = THEME_DESCRIPTORS[theme] || THEME_DESCRIPTORS.generic;
    const styleNote = THEME_STYLE_NOTES[theme] || THEME_STYLE_NOTES.generic;
    const persona = MBTI_PERSONA[mbti] || "balanced personality traits";

    return [
        "Create one square, high-quality digital illustration for an MBTI result card.",
        `Theme: ${themeDescriptor}.`,
        `MBTI type: ${mbti}, personality cues: ${persona}.`,
        `Creative direction: witty and stylish for people in their 20s, ${styleNote}.`,
        "Style: modern editorial illustration, clean composition, bold readable silhouette, vivid but balanced colors.",
        "Include one main character and subtle background props that match the theme.",
        "Facial expression and pose should feel clever, funny, and meme-friendly without parodying real people.",
        "No text, no letters, no numbers, no logos, no watermark, no border, no split panels."
    ].join(" ");
}

async function generateOneImage({ apiKey, model, prompt, size, quality, outputFormat }) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            prompt,
            size,
            quality,
            output_format: outputFormat
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const payload = await response.json();
    const first = payload && Array.isArray(payload.data) ? payload.data[0] : null;

    if (!first) {
        throw new Error("OpenAI API returned empty image payload.");
    }

    if (first.b64_json) {
        return Buffer.from(first.b64_json, "base64");
    }

    if (first.url) {
        const imageRes = await fetch(first.url);
        if (!imageRes.ok) {
            throw new Error(`Failed to download generated image: ${imageRes.status}`);
        }
        const arr = await imageRes.arrayBuffer();
        return Buffer.from(arr);
    }

    throw new Error("Image payload does not contain b64_json or url.");
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRateLimitRetryMs(message) {
    const text = String(message || "");
    const match = text.match(/try again in\s+(\d+)s/i);
    if (!match) return null;
    const seconds = Number(match[1]);
    if (!Number.isFinite(seconds)) return null;
    return Math.max(0, seconds * 1000);
}

async function main() {
    await loadDotEnvFile(".env");
    const args = parseArgs(process.argv.slice(2));
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required.");
    }

    const allThemes = await listThemeDirs(args.outputRoot);
    const { themes, mbtiList } = resolveTargets(allThemes, args);

    const targets = [];
    themes.forEach((theme) => {
        mbtiList.forEach((mbti) => {
            targets.push({
                theme,
                mbti,
                outPath: path.join(args.outputRoot, theme, `${mbti}.png`)
            });
        });
    });

    console.log(`Target images: ${targets.length}`);
    let success = 0;
    let skipped = 0;
    let failed = 0;
    const failedTargets = [];
    let currentIndex = 0;
    let nextAllowedAt = 0;
    let rateGate = Promise.resolve();

    async function waitForRateSlot() {
        const ticket = rateGate.then(async () => {
            const now = Date.now();
            const waitMs = Math.max(0, nextAllowedAt - now);
            if (waitMs > 0) {
                await sleep(waitMs);
            }
            nextAllowedAt = Date.now() + args.minIntervalMs;
        });
        rateGate = ticket.catch(() => undefined);
        await ticket;
    }

    async function runWorker(workerId) {
        while (true) {
            const myIndex = currentIndex;
            currentIndex += 1;
            if (myIndex >= targets.length) {
                return;
            }

            const target = targets[myIndex];
            const label = `${target.theme}/${target.mbti}`;
            const exists = await fileExists(target.outPath);
            if (exists && !args.force) {
                skipped += 1;
                console.log(`[SKIP] ${label} (already exists)`);
                continue;
            }

            const prompt = buildPrompt(target.theme, target.mbti);
            if (args.dryRun) {
                console.log(`[DRY ] ${label}`);
                console.log(`       prompt: ${prompt}`);
                continue;
            }

            let done = false;
            for (let attempt = 1; attempt <= args.maxRetries + 1; attempt += 1) {
                await waitForRateSlot();

                console.log(`[GEN ${workerId}] ${label} (attempt ${attempt}/${args.maxRetries + 1})`);
                try {
                    const imageBuffer = await generateOneImage({
                        apiKey,
                        model: args.model,
                        prompt,
                        size: args.size,
                        quality: args.quality,
                        outputFormat: args.outputFormat
                    });
                    await fs.writeFile(target.outPath, imageBuffer);
                    success += 1;
                    console.log(`[OK  ${workerId}] ${label} -> ${target.outPath}`);
                    done = true;
                    break;
                } catch (error) {
                    const message = error && error.message ? error.message : String(error);
                    const retryMs = parseRateLimitRetryMs(message);
                    const isRateLimit = message.includes("429") || message.includes("rate_limit");
                    const canRetry = attempt <= args.maxRetries && (isRateLimit || retryMs !== null);
                    if (!canRetry) {
                        failed += 1;
                        failedTargets.push({ label, error: message });
                        console.error(`[FAIL ${workerId}] ${label}: ${message}`);
                        break;
                    }
                    const backoffMs = retryMs !== null ? retryMs + 1000 : 15000;
                    console.warn(`[RETRY ${workerId}] ${label}: waiting ${backoffMs}ms due to rate limit`);
                    await sleep(backoffMs);
                }
            }

            if (args.delayMs > 0) {
                await sleep(args.delayMs);
            }
        }
    }

    console.log(`Concurrency: ${args.concurrency}`);
    const workers = Array.from({ length: args.concurrency }, (_, idx) => runWorker(idx + 1));
    await Promise.all(workers);

    console.log(`Done. success=${success}, failed=${failed}, skipped=${skipped}, total=${targets.length}`);
    if (failedTargets.length) {
        console.log("Failed targets:");
        failedTargets.forEach((item) => {
            console.log(`- ${item.label}: ${item.error}`);
        });
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
