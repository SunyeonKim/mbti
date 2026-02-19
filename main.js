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
const testFilterButtons = document.querySelectorAll("[data-test-filter]");
const dynamicNavLinksEl = document.getElementById("dynamic-nav-links");
const noTestsMessageEl = document.getElementById("no-tests-message");
const activeTestTitleEl = document.getElementById("active-test-title");
const backToListBtn = document.getElementById("back-to-list-btn");
const recentResultsSectionEl = document.getElementById("recent-results-section");
const recentResultsListEl = document.getElementById("recent-results-list");
const recentResultsIndicatorsEl = document.getElementById("recent-results-indicators");
const toastEl = document.getElementById("toast");

const RECENT_RESULTS_STORAGE_KEY = "recentTestResultsV1";
const MAX_RECENT_RESULTS = 5;
const DRAG_SCROLL_THRESHOLD = 5;

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
let toastTimer = null;
let isRecentDragging = false;
let recentDragMoved = false;
let recentDragStartX = 0;
let recentDragStartLeft = 0;
let activeTestFilter = "all";
let popularSortOrder = "desc";
let latestSortOrder = "desc";

const RecentResultsStore = {
    load() {
        try {
            const raw = localStorage.getItem(RECENT_RESULTS_STORAGE_KEY);
            const parsed = JSON.parse(raw || "[]");
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.filter((item) => item && typeof item === "object" && item.id && item.testId);
        } catch (error) {
            console.warn("Failed to parse recent results:", error);
            return [];
        }
    },
    save(items) {
        localStorage.setItem(RECENT_RESULTS_STORAGE_KEY, JSON.stringify(items));
    },
    add(entry) {
        const current = this.load().filter((item) => item.testId !== entry.testId);
        const next = [entry, ...current].slice(0, 20);
        this.save(next);
    },
    getRecent(limit = MAX_RECENT_RESULTS) {
        return this.load().slice(0, limit);
    }
};

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
        titleEn: "MBTI Personality Test",
        cardTitle: langPack.title || "MBTI 성격 검사",
        cardTitleEn: "MBTI Personality Test",
        navTitle: langPack.title || "MBTI 성격 검사",
        isRecommended: false,
        viewCount: 0,
        thumbnail: "",
        resultSettings: {},
        mbtiDescriptions: langPack.mbtiDescriptions || {},
        questions,
        isFallback: true,
        createdAtMs: 0
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
                textEn: String(answer.textEn || "").trim(),
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
                questionEn: String(question.questionEn || "").trim(),
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
        titleEn: String(data.titleEn || ""),
        cardTitle: String(data.cardTitle || data.title || "테스트"),
        cardTitleEn: String(data.cardTitleEn || ""),
        navTitle: String(data.navTitle || data.cardTitle || data.title || "테스트"),
        isRecommended: Boolean(data.isRecommended),
        viewCount: Math.max(0, Number(data.viewCount) || 0),
        thumbnail: String(data.thumbnail || ""),
        resultGuideText: String(data.resultGuideText || ""),
        resultImage: String(data.resultImage || ""),
        resultSettings: (data.resultSettings && typeof data.resultSettings === "object") ? data.resultSettings : {},
        mbtiDescriptions: (data.mbtiDescriptions && typeof data.mbtiDescriptions === "object") ? data.mbtiDescriptions : {},
        questions: normalizedQuestions,
        isFallback: false,
        createdAtMs: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0
    };
}

function getLocalizedText(ko, en) {
    if (currentLanguage === "en") {
        return String(en || ko || "");
    }
    return String(ko || en || "");
}

function getLocalizedCardTitle(test) {
    return getLocalizedText(test.cardTitle, test.cardTitleEn) || "테스트";
}

function getLocalizedTestTitle(test) {
    return getLocalizedText(test.title, test.titleEn) || "테스트";
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
        ? (isResult ? `내 MBTI 결과는 ${mbtiType}! ${currentTest ? getLocalizedCardTitle(currentTest) : "테스트"} 해보기` : `${currentTest ? getLocalizedCardTitle(currentTest) : "테스트"}를 공유해요`)
        : (isResult ? `My MBTI result is ${mbtiType}. Try this test!` : `Try this test: ${currentTest ? getLocalizedCardTitle(currentTest) : "MBTI test"}`);
    const title = currentTest ? getLocalizedCardTitle(currentTest) : "MBTI Test";

    return { shareUrl, text, title };
}

async function copyShareLink(scope) {
    const { shareUrl } = getSharePayload(scope);
    try {
        await copyTextToClipboard(shareUrl);
    } catch (error) {
        console.warn("Failed to copy share link:", error);
    }
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return;
    }
    const temp = document.createElement("input");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
}

function showToast(message) {
    if (!toastEl) {
        return;
    }
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add("show");
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
        toastEl.classList.remove("show");
        toastEl.hidden = true;
    }, 1800);
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
    [
        { text: "홈", href: "index.html" },
        { text: "서비스 소개", href: "service.html" },
        { text: "개인정보처리방침", href: "privacy.html" },
        { text: "이용약관", href: "terms.html" },
        { text: "문의하기", href: "contact.html" }
    ].forEach((item) => {
        const link = document.createElement("a");
        link.className = "nav-link";
        link.href = item.href;
        link.textContent = item.text;
        link.addEventListener("click", () => {
            closeNav();
        });
        dynamicNavLinksEl.appendChild(link);
    });
}

function renderTestCards() {
    if (!testCardGridEl || !noTestsMessageEl) {
        return;
    }

    testCardGridEl.innerHTML = "";
    const displayTests = getFilteredTests();

    if (!displayTests.length) {
        noTestsMessageEl.hidden = false;
        return;
    }

    noTestsMessageEl.hidden = true;

    displayTests.forEach((test) => {
        const card = document.createElement("article");
        card.className = "test-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `${getLocalizedCardTitle(test)} 테스트 시작`);

        const thumb = document.createElement("div");
        thumb.className = "test-card-thumb";

        if (test.thumbnail) {
            const img = document.createElement("img");
            img.src = test.thumbnail;
            img.alt = `${getLocalizedCardTitle(test)} thumbnail`;
            thumb.appendChild(img);
        } else {
            thumb.textContent = "No Image";
        }

        const titleRow = document.createElement("div");
        titleRow.className = "test-card-title-row";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "copy-link-btn";
        copyBtn.setAttribute("aria-label", `${test.cardTitle} 링크 복사`);
        copyBtn.textContent = "📎";
        copyBtn.addEventListener("click", async (event) => {
            event.stopPropagation();
            const params = new URLSearchParams(window.location.search);
            params.set("test", test.id);
            const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
            try {
                await copyTextToClipboard(url);
                showToast("링크 복사가 완료되었습니다.");
            } catch (error) {
                showToast("링크 복사에 실패했습니다.");
            }
        });

        const title = document.createElement("p");
        title.className = "test-card-title";
        title.textContent = getLocalizedCardTitle(test);

        titleRow.append(copyBtn, title);
        card.appendChild(thumb);
        card.appendChild(titleRow);

        card.addEventListener("click", () => startTestById(test.id));
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                startTestById(test.id);
            }
        });
        testCardGridEl.appendChild(card);
    });
}

function getFilteredTests() {
    const list = [...tests];

    if (activeTestFilter === "recommended") {
        return list
            .filter((test) => test.isRecommended)
            .sort((a, b) => b.createdAtMs - a.createdAtMs);
    }

    if (activeTestFilter === "popular") {
        return list.sort((a, b) => {
            const viewDiff = popularSortOrder === "desc"
                ? b.viewCount - a.viewCount
                : a.viewCount - b.viewCount;
            if (viewDiff !== 0) {
                return viewDiff;
            }
            return b.createdAtMs - a.createdAtMs;
        });
    }

    if (activeTestFilter === "latest") {
        return list.sort((a, b) => (
            latestSortOrder === "desc"
                ? b.createdAtMs - a.createdAtMs
                : a.createdAtMs - b.createdAtMs
        ));
    }

    return list.sort((a, b) => b.createdAtMs - a.createdAtMs);
}

function updateFilterControls() {
    testFilterButtons.forEach((button) => {
        const mode = button.dataset.testFilter || "all";
        const isActive = mode === activeTestFilter;
        if (mode === "popular") {
            button.textContent = popularSortOrder === "desc" ? "인기순↓" : "인기순↑";
        } else if (mode === "latest") {
            button.textContent = latestSortOrder === "desc" ? "최신순↓" : "최신순↑";
        }
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

async function incrementTestViewCount(testId) {
    const target = tests.find((test) => test.id === testId);
    if (target) {
        target.viewCount = Math.max(0, Number(target.viewCount) || 0) + 1;
    }

    const services = window.firebaseServices || {};
    const firebaseGlobal = window.firebase;
    if (!services.db || !firebaseGlobal || !firebaseGlobal.firestore || !firebaseGlobal.firestore.FieldValue) {
        return;
    }

    try {
        await services.db.collection("tests").doc(testId).update({
            viewCount: firebaseGlobal.firestore.FieldValue.increment(1),
            updatedAt: firebaseGlobal.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.warn("Failed to increment view count:", error);
    }
}

function buildResultSummary(text) {
    const normalized = String(text || "").trim();
    if (!normalized) {
        return "결과 요약이 준비되지 않았습니다.";
    }
    return normalized;
}

function saveRecentResult(test, mbtiType, description) {
    if (!test || !test.id) {
        return;
    }
    const now = Date.now();
    const recordId = `${test.id}-${now}`;
    RecentResultsStore.add({
        id: recordId,
        testId: test.id,
        testTitle: test.cardTitle || test.title || "테스트",
        resultType: mbtiType,
        summary: buildResultSummary(description),
        completedAt: now
    });
}

function renderRecentResults() {
    if (!recentResultsListEl || !recentResultsSectionEl || !recentResultsIndicatorsEl) {
        return;
    }

    const recent = RecentResultsStore
        .getRecent(MAX_RECENT_RESULTS)
        .sort((a, b) => (Number(b.completedAt) || 0) - (Number(a.completedAt) || 0));
    recentResultsListEl.innerHTML = "";
    recentResultsIndicatorsEl.innerHTML = "";

    if (!recent.length) {
        recentResultsSectionEl.hidden = true;
        return;
    }

    recentResultsSectionEl.hidden = false;

    recent.forEach((item) => {
        const card = document.createElement("a");
        card.className = "test-card recent-result-card carousel-card";
        card.href = `result.html?record=${encodeURIComponent(item.id)}`;

        const body = document.createElement("div");
        body.className = "recent-result-body";

        const title = document.createElement("p");
        title.className = "test-card-title";
        title.textContent = item.testTitle;

        const type = document.createElement("p");
        type.className = "recent-result-type";
        type.textContent = item.resultType;

        const summary = document.createElement("p");
        summary.className = "recent-result-summary";
        summary.textContent = item.summary;

        body.append(title, type, summary);
        card.appendChild(body);
        recentResultsListEl.appendChild(card);
    });

    renderRecentResultIndicators(recent.length, 0);
    requestAnimationFrame(() => {
        if (recentResultsListEl) {
            recentResultsListEl.scrollLeft = 0;
        }
    });
}

function getRecentCardSpan() {
    if (!recentResultsListEl) {
        return 1;
    }
    const cards = recentResultsListEl.querySelectorAll(".carousel-card");
    if (!cards.length) {
        return 1;
    }
    if (cards.length === 1) {
        return cards[0].getBoundingClientRect().width;
    }
    const firstRect = cards[0].getBoundingClientRect();
    const secondRect = cards[1].getBoundingClientRect();
    return Math.max(1, secondRect.left - firstRect.left);
}

function renderRecentResultIndicators(total, activeIndex) {
    if (!recentResultsIndicatorsEl) {
        return;
    }
    recentResultsIndicatorsEl.innerHTML = "";

    for (let i = 0; i < total; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `carousel-dot${i === activeIndex ? " active" : ""}`;
        dot.setAttribute("aria-label", `최근 결과 ${i + 1}번으로 이동`);
        dot.addEventListener("click", () => {
            if (!recentResultsListEl) {
                return;
            }
            const span = getRecentCardSpan();
            recentResultsListEl.scrollTo({
                left: span * i,
                behavior: "smooth"
            });
        });
        recentResultsIndicatorsEl.appendChild(dot);
    }
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
    renderTestCards();
    const url = new URL(window.location.href);
    url.searchParams.delete("test");
    window.history.replaceState({}, "", url);
}

function startTestById(testId) {
    const found = tests.find((test) => test.id === testId);
    if (!found) {
        return;
    }
    if (!found.isFallback) {
        incrementTestViewCount(found.id);
    }

    currentTest = found;
    currentQuestionIndex = 0;
    userAnswers = new Array(currentTest.questions.length);
    selectedAnswerIndexes = new Array(currentTest.questions.length);

    activeTestTitleEl.textContent = getLocalizedTestTitle(currentTest);
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
    questionEl.textContent = getLocalizedText(currentQuestion.question, currentQuestion.questionEn);
    answersEl.innerHTML = "";

    currentQuestion.answers.forEach((answer, answerIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = getLocalizedText(answer.text, answer.textEn);

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
    const resultSettings = currentTest.resultSettings && typeof currentTest.resultSettings === "object"
        ? currentTest.resultSettings
        : {};
    const resultConfig = resultSettings[mbtiType] && typeof resultSettings[mbtiType] === "object"
        ? resultSettings[mbtiType]
        : {};
    const localizedResultTitle = getLocalizedText(resultConfig.title, resultConfig.titleEn) || currentTest.resultGuideText || `${mbtiType} 유형`;
    const localizedResultContent = getLocalizedText(resultConfig.content, resultConfig.contentEn) || (descriptionMap[mbtiType] || "");

    testContainer.hidden = true;
    completionContainer.hidden = true;
    resultContainer.hidden = false;
    setShareVisibility(false, true);

    resultEl.textContent = localizedResultTitle;
    resultDescriptionEl.textContent = localizedResultContent;
    saveRecentResult(currentTest, mbtiType, localizedResultContent || "");
    renderRecentResults();

    if (resultGuideTextEl) {
        resultGuideTextEl.textContent = localizedResultTitle;
    }

    if (resultGuideImageEl) {
        if (resultConfig.image || currentTest.resultImage) {
            resultGuideImageEl.src = resultConfig.image || currentTest.resultImage;
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

if (recentResultsListEl && recentResultsIndicatorsEl) {
    recentResultsListEl.addEventListener("scroll", () => {
        const dots = recentResultsIndicatorsEl.querySelectorAll(".carousel-dot");
        if (!dots.length) {
            return;
        }
        const span = getRecentCardSpan();
        const activeIndex = Math.max(0, Math.min(
            dots.length - 1,
            Math.round(recentResultsListEl.scrollLeft / span)
        ));
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === activeIndex);
        });
    });

    recentResultsListEl.addEventListener("mousedown", (event) => {
        isRecentDragging = true;
        recentDragMoved = false;
        recentDragStartX = event.clientX;
        recentDragStartLeft = recentResultsListEl.scrollLeft;
        recentResultsListEl.classList.add("dragging");
    });

    window.addEventListener("mousemove", (event) => {
        if (!isRecentDragging) {
            return;
        }
        const deltaX = event.clientX - recentDragStartX;
        if (Math.abs(deltaX) > DRAG_SCROLL_THRESHOLD) {
            recentDragMoved = true;
        }
        recentResultsListEl.scrollLeft = recentDragStartLeft - deltaX;
    });

    window.addEventListener("mouseup", () => {
        if (!isRecentDragging) {
            return;
        }
        isRecentDragging = false;
        recentResultsListEl.classList.remove("dragging");
    });

    recentResultsListEl.addEventListener("click", (event) => {
        if (recentDragMoved) {
            event.preventDefault();
            event.stopPropagation();
            recentDragMoved = false;
        }
    }, true);
}

testFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const mode = button.dataset.testFilter || "all";
        if (mode === "popular") {
            if (activeTestFilter === "popular") {
                popularSortOrder = popularSortOrder === "desc" ? "asc" : "desc";
            } else {
                popularSortOrder = "desc";
                activeTestFilter = "popular";
            }
        } else if (mode === "latest") {
            if (activeTestFilter === "latest") {
                latestSortOrder = latestSortOrder === "desc" ? "asc" : "desc";
            } else {
                latestSortOrder = "desc";
                activeTestFilter = "latest";
            }
        } else {
            activeTestFilter = mode;
        }
        updateFilterControls();
        renderTestCards();
    });
});

async function initPage() {
    applyTheme(currentTheme);
    setLanguage(currentLanguage);
    renderDynamicNav();
    updateFilterControls();
    if (!isTestPage) {
        return;
    }
    await loadTests();
    renderTestCards();
    renderRecentResults();

    const testIdFromQuery = new URLSearchParams(window.location.search).get("test");
    if (testIdFromQuery && tests.some((test) => test.id === testIdFromQuery)) {
        startTestById(testIdFromQuery);
    } else {
        showListView();
    }
}

initPage();
