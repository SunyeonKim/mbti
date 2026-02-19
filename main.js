const MBTI_KEYS = ["E", "I", "S", "N", "T", "F", "J", "P"];

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const completionContainer = document.getElementById("completion-container");
const viewResultBtn = document.getElementById("view-result-btn");
const resultContainer = document.getElementById("result-container");
const resultEl = document.getElementById("result");
const resultDescriptionEl = document.getElementById("result-description");
const resultGuideTextEl = document.getElementById("result-guide-text");
const resultGuideImageEl = document.getElementById("result-guide-image");
const languageSelectEl = document.getElementById("language-select");
const themeToggleBtn = document.getElementById("theme-toggle");
const themeIconEl = document.getElementById("theme-icon");
const navToggleBtn = document.getElementById("nav-toggle");
const navCloseBtn = document.getElementById("nav-close");
const navOverlayEl = document.getElementById("nav-overlay");
const sideNavEl = document.getElementById("side-nav");
const progressFillEl = document.getElementById("progress-fill");
const progressTextEl = document.getElementById("progress-text");
const testContainer = document.getElementById("test-container");
const defaultShareSection = document.getElementById("default-share-section");
const resultShareSection = document.getElementById("result-share-section");
const testListViewEl = document.getElementById("test-list-view");
const testViewEl = document.getElementById("test-view");
const testCardGridEl = document.getElementById("test-card-grid");
const dynamicNavLinksEl = document.getElementById("dynamic-nav-links");
const noTestsMessageEl = document.getElementById("no-tests-message");
const activeTestTitleEl = document.getElementById("active-test-title");
const backToListBtn = document.getElementById("back-to-list-btn");

const isTestPage = Boolean(
    questionEl
    && answersEl
    && prevBtn
    && nextBtn
    && completionContainer
    && viewResultBtn
    && resultContainer
    && resultEl
    && resultDescriptionEl
    && testContainer
    && testListViewEl
    && testViewEl
);

let tests = [];
let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let selectedAnswerIndexes = [];
let currentLanguage = localStorage.getItem("language") || "ko";
let currentTheme = localStorage.getItem("theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function getLangPack() {
    if (typeof translations === "undefined") {
        return {
            title: "MBTI Test",
            prev: "Previous",
            next: "Next",
            viewResult: "View Result",
            shareTitle: "Share",
            resultShareTitle: "Share Result",
            resultPrefix: "Your MBTI type is:",
            mbtiDescriptions: {}
        };
    }
    return translations[currentLanguage] || translations.ko || translations.en;
}

function buildFallbackTest() {
    const langPack = getLangPack();
    const questions = (langPack.questions || []).map((question) => ({
        question: question.question,
        answers: (question.answers || []).slice(0, 4).map((answer) => ({
            text: answer.text,
            scores: answer.scores || {}
        }))
    }));

    return {
        id: "default-mbti",
        title: langPack.title || "MBTI 성격 검사",
        cardTitle: langPack.title || "MBTI 성격 검사",
        navTitle: langPack.title || "MBTI 성격 검사",
        thumbnail: "",
        resultGuideText: "",
        resultImage: "",
        mbtiDescriptions: langPack.mbtiDescriptions || {},
        questions,
        isFallback: true
    };
}

function sanitizeScores(rawScores) {
    const scores = {};
    if (!rawScores || typeof rawScores !== "object") {
        return scores;
    }
    MBTI_KEYS.forEach((key) => {
        const value = Number(rawScores[key]);
        if (!Number.isNaN(value) && value > 0) {
            scores[key] = value;
        }
    });
    return scores;
}

function sanitizeRemoteTest(doc) {
    const data = doc.data() || {};
    const questions = Array.isArray(data.questions) ? data.questions : [];

    const normalizedQuestions = questions
        .map((question) => {
            const answers = Array.isArray(question.answers) ? question.answers : [];
            const normalizedAnswers = answers.slice(0, 4).map((answer) => ({
                text: String(answer.text || "").trim(),
                scores: sanitizeScores(answer.scores)
            }));

            if (!String(question.question || "").trim() || normalizedAnswers.length !== 4) {
                return null;
            }

            if (normalizedAnswers.some((answer) => !answer.text || Object.keys(answer.scores).length === 0)) {
                return null;
            }

            return {
                question: String(question.question).trim(),
                answers: normalizedAnswers
            };
        })
        .filter(Boolean);

    if (!normalizedQuestions.length) {
        return null;
    }

    return {
        id: doc.id,
        title: String(data.title || "테스트"),
        cardTitle: String(data.cardTitle || data.title || "테스트"),
        navTitle: String(data.navTitle || data.cardTitle || data.title || "테스트"),
        thumbnail: String(data.thumbnail || ""),
        resultGuideText: String(data.resultGuideText || ""),
        resultImage: String(data.resultImage || ""),
        mbtiDescriptions: (data.mbtiDescriptions && typeof data.mbtiDescriptions === "object") ? data.mbtiDescriptions : {},
        questions: normalizedQuestions,
        isFallback: false,
        createdAtMs: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0
    };
}

async function loadTests() {
    const services = window.firebaseServices || {};
    const db = services.db;

    if (!services.isConfigured || !db) {
        tests = [buildFallbackTest()];
        return;
    }

    try {
        const snapshot = await db.collection("tests").where("isPublished", "==", true).get();
        const remoteTests = snapshot.docs
            .map((doc) => sanitizeRemoteTest(doc))
            .filter(Boolean)
            .sort((a, b) => b.createdAtMs - a.createdAtMs);

        tests = remoteTests.length ? remoteTests : [buildFallbackTest()];
    } catch (error) {
        console.warn("Failed to load tests from Firestore:", error);
        tests = [buildFallbackTest()];
    }
}

function getAnsweredCount() {
    return userAnswers.filter(Boolean).length;
}

function getSharePayload(scope) {
    const params = new URLSearchParams(window.location.search);
    if (currentTest && currentTest.id) {
        params.set("test", currentTest.id);
    }

    const sharePath = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    const shareUrl = `${window.location.origin}${sharePath}`;
    const mbtiType = calculateResult();
    const isResult = scope === "result";
    const text = currentLanguage === "ko"
        ? (isResult ? `내 MBTI 결과는 ${mbtiType}! ${currentTest ? currentTest.cardTitle : "테스트"} 해보기` : `${currentTest ? currentTest.cardTitle : "테스트"}를 공유해요`)
        : (isResult ? `My MBTI result is ${mbtiType}. Try this test!` : `Try this test: ${currentTest ? currentTest.cardTitle : "MBTI test"}`);
    const title = currentTest ? currentTest.cardTitle : "MBTI Test";

    return { shareUrl, text, title };
}

async function copyShareLink(scope) {
    const { shareUrl } = getSharePayload(scope);
    try {
        await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
        const temp = document.createElement("input");
        temp.value = shareUrl;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
    }
}

function openShareWindow(url) {
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
}

function shareToChannel(type, scope) {
    const { shareUrl, text, title } = getSharePayload(scope);
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);
    const encodedTitle = encodeURIComponent(title);

    if (type === "copy") {
        copyShareLink(scope);
        return;
    }

    if (type === "kakao") {
        openShareWindow(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodedUrl}&text=${encodedText}`);
        return;
    }

    if (type === "x") {
        openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`);
        return;
    }

    if (type === "naver") {
        openShareWindow(`https://share.naver.com/web/shareView?url=${encodedUrl}&title=${encodedTitle}`);
    }
}

function setShareVisibility(showDefault, showResult) {
    if (defaultShareSection) {
        defaultShareSection.hidden = !showDefault;
    }
    if (resultShareSection) {
        resultShareSection.hidden = !showResult;
    }
}

function openNav() {
    if (!sideNavEl || !navOverlayEl || !navToggleBtn) {
        return;
    }
    sideNavEl.classList.add("open");
    sideNavEl.setAttribute("aria-hidden", "false");
    navOverlayEl.hidden = false;
    document.body.classList.add("nav-open");
    navToggleBtn.setAttribute("aria-expanded", "true");
}

function closeNav() {
    if (!sideNavEl || !navOverlayEl || !navToggleBtn) {
        return;
    }
    sideNavEl.classList.remove("open");
    sideNavEl.setAttribute("aria-hidden", "true");
    navOverlayEl.hidden = true;
    document.body.classList.remove("nav-open");
    navToggleBtn.setAttribute("aria-expanded", "false");
}

function applyTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute("data-theme", theme);
    if (themeIconEl) {
        themeIconEl.textContent = theme === "dark" ? "🌙" : "☀";
    }
    localStorage.setItem("theme", theme);
    updateThemeControlLabel();
}

function updateThemeControlLabel() {
    if (!themeToggleBtn) {
        return;
    }
    const langPack = getLangPack();
    const nextThemeLabel = currentTheme === "dark" ? (langPack.lightMode || "Light Mode") : (langPack.darkMode || "Dark Mode");
    themeToggleBtn.setAttribute("aria-label", nextThemeLabel);
}

function updateProgress(answeredCount = getAnsweredCount()) {
    if (!isTestPage || !progressFillEl || !progressTextEl || !currentTest) {
        return;
    }
    const total = currentTest.questions.length;
    const safeAnswered = Math.max(0, Math.min(answeredCount, total));
    const percent = total === 0 ? 0 : Math.round((safeAnswered / total) * 100);
    progressFillEl.style.width = `${percent}%`;
    progressTextEl.textContent = `${percent}% (${safeAnswered}/${total})`;
}

function updateQuestionButtons() {
    if (!isTestPage || !currentTest) {
        return;
    }
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = !userAnswers[currentQuestionIndex];
}

function renderDynamicNav() {
    if (!dynamicNavLinksEl) {
        return;
    }

    dynamicNavLinksEl.innerHTML = "";

    tests.forEach((test) => {
        const link = document.createElement("a");
        link.className = "nav-link nav-test-link";
        link.href = `index.html?test=${encodeURIComponent(test.id)}`;
        link.textContent = test.navTitle;
        link.addEventListener("click", (event) => {
            event.preventDefault();
            closeNav();
            startTestById(test.id);
        });
        dynamicNavLinksEl.appendChild(link);
    });
}

function renderTestCards() {
    if (!testCardGridEl || !noTestsMessageEl) {
        return;
    }

    testCardGridEl.innerHTML = "";

    if (!tests.length) {
        noTestsMessageEl.hidden = false;
        return;
    }

    noTestsMessageEl.hidden = true;

    tests.forEach((test) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "test-card";

        const thumb = document.createElement("div");
        thumb.className = "test-card-thumb";

        if (test.thumbnail) {
            const img = document.createElement("img");
            img.src = test.thumbnail;
            img.alt = `${test.cardTitle} thumbnail`;
            thumb.appendChild(img);
        } else {
            thumb.textContent = "No Image";
        }

        const title = document.createElement("p");
        title.className = "test-card-title";
        title.textContent = test.cardTitle;

        card.appendChild(thumb);
        card.appendChild(title);

        card.addEventListener("click", () => startTestById(test.id));
        testCardGridEl.appendChild(card);
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    localStorage.setItem("language", lang);

    if (languageSelectEl) {
        languageSelectEl.value = lang;
    }

    if (typeof translations !== "undefined") {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
    }

    if (tests.length === 1 && tests[0].isFallback) {
        const wasFallbackOpen = Boolean(currentTest && currentTest.isFallback);
        tests = [buildFallbackTest()];
        renderDynamicNav();
        renderTestCards();
        if (wasFallbackOpen) {
            startTestById("default-mbti");
        }
    }

    updateThemeControlLabel();
}

function showListView() {
    testListViewEl.hidden = false;
    testViewEl.hidden = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("test");
    window.history.replaceState({}, "", url);
}

function startTestById(testId) {
    const found = tests.find((test) => test.id === testId);
    if (!found) {
        return;
    }

    currentTest = found;
    currentQuestionIndex = 0;
    userAnswers = new Array(currentTest.questions.length);
    selectedAnswerIndexes = new Array(currentTest.questions.length);

    activeTestTitleEl.textContent = currentTest.title;
    testListViewEl.hidden = true;
    testViewEl.hidden = false;

    testContainer.hidden = false;
    completionContainer.hidden = true;
    resultContainer.hidden = true;
    setShareVisibility(true, false);

    const url = new URL(window.location.href);
    url.searchParams.set("test", currentTest.id);
    window.history.replaceState({}, "", url);

    showQuestion();
}

function showQuestion() {
    if (!currentTest) {
        return;
    }

    const currentQuestion = currentTest.questions[currentQuestionIndex];
    questionEl.textContent = currentQuestion.question;
    answersEl.innerHTML = "";

    currentQuestion.answers.forEach((answer, answerIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = answer.text;

        if (selectedAnswerIndexes[currentQuestionIndex] === answerIndex) {
            button.classList.add("selected");
        }

        button.onclick = () => {
            if (selectedAnswerIndexes[currentQuestionIndex] === answerIndex) {
                selectedAnswerIndexes[currentQuestionIndex] = undefined;
                userAnswers[currentQuestionIndex] = undefined;
            } else {
                selectedAnswerIndexes[currentQuestionIndex] = answerIndex;
                userAnswers[currentQuestionIndex] = answer.scores;
            }
            showQuestion();
        };

        answersEl.appendChild(button);
    });

    updateQuestionButtons();
    updateProgress();
}

function calculateResult() {
    const counts = {
        E: 0, I: 0, S: 0, N: 0,
        T: 0, F: 0, J: 0, P: 0
    };

    userAnswers.forEach((answerScores) => {
        if (!answerScores) {
            return;
        }
        Object.entries(answerScores).forEach(([key, value]) => {
            if (MBTI_KEYS.includes(key)) {
                counts[key] += Number(value) || 0;
            }
        });
    });

    let result = "";
    result += counts.E > counts.I ? "E" : "I";
    result += counts.S > counts.N ? "S" : "N";
    result += counts.T > counts.F ? "T" : "F";
    result += counts.J > counts.P ? "J" : "P";

    return result;
}

function showCompletion() {
    testContainer.hidden = true;
    completionContainer.hidden = false;
    resultContainer.hidden = true;
    setShareVisibility(false, false);
    updateProgress(currentTest ? currentTest.questions.length : 0);
}

function showResult() {
    if (!currentTest) {
        return;
    }

    const mbtiType = calculateResult();
    const langPack = getLangPack();
    const descriptionMap = currentTest.mbtiDescriptions && Object.keys(currentTest.mbtiDescriptions).length
        ? currentTest.mbtiDescriptions
        : (langPack.mbtiDescriptions || {});

    testContainer.hidden = true;
    completionContainer.hidden = true;
    resultContainer.hidden = false;
    setShareVisibility(false, true);

    resultEl.textContent = `${langPack.resultPrefix || "Your MBTI type is:"} ${mbtiType}`;
    resultDescriptionEl.textContent = descriptionMap[mbtiType] || "";

    if (resultGuideTextEl) {
        resultGuideTextEl.textContent = currentTest.resultGuideText || "";
    }

    if (resultGuideImageEl) {
        if (currentTest.resultImage) {
            resultGuideImageEl.src = currentTest.resultImage;
            resultGuideImageEl.hidden = false;
        } else {
            resultGuideImageEl.removeAttribute("src");
            resultGuideImageEl.hidden = true;
        }
    }

    updateProgress(currentTest.questions.length);
}

if (languageSelectEl) {
    languageSelectEl.addEventListener("change", (event) => setLanguage(event.target.value));
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
}

if (navToggleBtn) {
    navToggleBtn.addEventListener("click", openNav);
}

if (navCloseBtn) {
    navCloseBtn.addEventListener("click", closeNav);
}

if (navOverlayEl) {
    navOverlayEl.addEventListener("click", closeNav);
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeNav();
    }
});

document.querySelectorAll(".share-btn").forEach((el) => {
    el.addEventListener("click", () => {
        const type = el.getAttribute("data-share-type");
        const scope = el.getAttribute("data-share-scope") || "default";
        if (type) {
            shareToChannel(type, scope);
        }
    });
});

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        if (!currentTest || !userAnswers[currentQuestionIndex]) {
            return;
        }

        if (currentQuestionIndex < currentTest.questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
            return;
        }

        if (getAnsweredCount() === currentTest.questions.length) {
            showCompletion();
        }
    });
}

if (viewResultBtn) {
    viewResultBtn.addEventListener("click", () => {
        if (currentTest && getAnsweredCount() === currentTest.questions.length) {
            showResult();
        }
    });
}

if (backToListBtn) {
    backToListBtn.addEventListener("click", showListView);
}

async function initPage() {
    applyTheme(currentTheme);
    setLanguage(currentLanguage);
    if (!isTestPage) {
        return;
    }
    await loadTests();
    renderDynamicNav();
    renderTestCards();

    const testIdFromQuery = new URLSearchParams(window.location.search).get("test");
    if (testIdFromQuery && tests.some((test) => test.id === testIdFromQuery)) {
        startTestById(testIdFromQuery);
    } else {
        showListView();
    }
}

initPage();
