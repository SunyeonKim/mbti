const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const completionContainer = document.getElementById("completion-container");
const viewResultBtn = document.getElementById("view-result-btn");
const resultContainer = document.getElementById("result-container");
const resultEl = document.getElementById("result");
const resultDescriptionEl = document.getElementById("result-description");
const languageSelectEl = document.getElementById("language-select");
const themeSelectEl = document.getElementById("theme-select");
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
);

let currentQuestionIndex = 0;
let userAnswers = [];
let selectedAnswerIndexes = [];
let currentLanguage = localStorage.getItem("language") || "ko";
let currentTheme = localStorage.getItem("theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function getQuestions() {
    return translations[currentLanguage].questions;
}

function getAnsweredCount() {
    return userAnswers.filter(Boolean).length;
}

function getSharePayload(scope) {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const mbtiType = calculateResult();
    const isResult = scope === "result";
    const text = currentLanguage === "ko"
        ? (isResult ? `내 MBTI 결과는 ${mbtiType}! 나도 테스트해보기` : "MBTI 성격 검사를 공유해요")
        : (isResult ? `My MBTI result is ${mbtiType}. Try this test!` : "Try this MBTI personality test.");
    const title = currentLanguage === "ko"
        ? (isResult ? `MBTI 결과 ${mbtiType}` : "MBTI 성격 검사")
        : (isResult ? `MBTI Result ${mbtiType}` : "MBTI Personality Test");

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

function setShareVisibility({ showDefault, showResult }) {
    if (defaultShareSection) {
        defaultShareSection.style.display = showDefault ? "block" : "none";
    }
    if (resultShareSection) {
        resultShareSection.style.display = showResult ? "block" : "none";
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
    if (themeSelectEl) {
        themeSelectEl.value = theme;
    }
    if (themeIconEl) {
        themeIconEl.textContent = theme === "dark" ? "🌙" : "☀";
    }
    localStorage.setItem("theme", theme);
    updateThemeControlLabels();
}

function updateThemeControlLabels() {
    const langPack = translations[currentLanguage];
    if (themeSelectEl) {
        const lightOption = themeSelectEl.querySelector('option[value="light"]');
        const darkOption = themeSelectEl.querySelector('option[value="dark"]');
        if (lightOption) {
            lightOption.textContent = langPack.lightMode;
        }
        if (darkOption) {
            darkOption.textContent = langPack.darkMode;
        }
    }
    if (themeToggleBtn) {
        const nextThemeLabel = currentTheme === "dark" ? langPack.lightMode : langPack.darkMode;
        themeToggleBtn.setAttribute("aria-label", nextThemeLabel);
    }
}

function updateProgress(answeredCount = getAnsweredCount()) {
    if (!isTestPage || !progressFillEl || !progressTextEl) {
        return;
    }
    const total = getQuestions().length;
    const safeAnswered = Math.max(0, Math.min(answeredCount, total));
    const percent = total === 0 ? 0 : Math.round((safeAnswered / total) * 100);
    progressFillEl.style.width = `${percent}%`;
    progressTextEl.textContent = `${percent}% (${safeAnswered}/${total})`;
}

function updateQuestionButtons() {
    if (!isTestPage) {
        return;
    }
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = !userAnswers[currentQuestionIndex];
}

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    localStorage.setItem("language", lang);

    if (languageSelectEl) {
        languageSelectEl.value = lang;
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    updateThemeControlLabels();

    if (isTestPage) {
        startTest();
    }
}

function startTest() {
    if (!isTestPage) {
        return;
    }
    currentQuestionIndex = 0;
    userAnswers = [];
    selectedAnswerIndexes = [];
    testContainer.style.display = "block";
    completionContainer.style.display = "none";
    resultContainer.style.display = "none";
    setShareVisibility({ showDefault: true, showResult: false });
    showQuestion();
}

function showQuestion() {
    const questions = getQuestions();
    const currentQuestion = questions[currentQuestionIndex];

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
                delete selectedAnswerIndexes[currentQuestionIndex];
                delete userAnswers[currentQuestionIndex];
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
            counts[key] += value;
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
    testContainer.style.display = "none";
    completionContainer.style.display = "block";
    resultContainer.style.display = "none";
    setShareVisibility({ showDefault: false, showResult: false });
    updateProgress(getQuestions().length);
}

function showResult() {
    const mbtiType = calculateResult();
    testContainer.style.display = "none";
    completionContainer.style.display = "none";
    resultContainer.style.display = "block";
    setShareVisibility({ showDefault: false, showResult: true });
    resultEl.textContent = `${translations[currentLanguage].resultPrefix} ${mbtiType}`;
    resultDescriptionEl.textContent = translations[currentLanguage].mbtiDescriptions[mbtiType];
    updateProgress(getQuestions().length);
}

if (languageSelectEl) {
    languageSelectEl.addEventListener("change", (event) => setLanguage(event.target.value));
}

if (themeSelectEl) {
    themeSelectEl.addEventListener("change", (event) => applyTheme(event.target.value));
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

document.querySelectorAll(".side-nav .nav-link").forEach((el) => {
    el.addEventListener("click", closeNav);
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
        if (!userAnswers[currentQuestionIndex]) {
            return;
        }

        if (currentQuestionIndex < getQuestions().length - 1) {
            currentQuestionIndex++;
            showQuestion();
            return;
        }

        if (getAnsweredCount() === getQuestions().length) {
            showCompletion();
        }
    });
}

if (viewResultBtn) {
    viewResultBtn.addEventListener("click", () => {
        if (getAnsweredCount() === getQuestions().length) {
            showResult();
        }
    });
}

applyTheme(currentTheme);
setLanguage(currentLanguage);
