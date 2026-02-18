const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const nextBtn = document.getElementById("next-btn");
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

const isTestPage = Boolean(questionEl && answersEl && nextBtn && resultContainer && resultEl && resultDescriptionEl);

let currentQuestionIndex = 0;
let userAnswers = [];
let currentLanguage = localStorage.getItem("language") || "ko";
let currentTheme = localStorage.getItem("theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

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

function updateProgress(answeredCount = currentQuestionIndex) {
    if (!isTestPage || !progressFillEl || !progressTextEl) {
        return;
    }
    const total = translations[currentLanguage].questions.length;
    const safeAnswered = Math.max(0, Math.min(answeredCount, total));
    const percent = total === 0 ? 0 : Math.round((safeAnswered / total) * 100);
    progressFillEl.style.width = `${percent}%`;
    progressTextEl.textContent = `${percent}% (${safeAnswered}/${total})`;
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
    document.getElementById("test-container").style.display = "block";
    resultContainer.style.display = "none";
    updateProgress(0);
    showQuestion();
}

function showQuestion() {
    nextBtn.disabled = true;
    const currentQuestion = translations[currentLanguage].questions[currentQuestionIndex];
    questionEl.textContent = currentQuestion.question;
    answersEl.innerHTML = "";

    currentQuestion.answers.forEach((answer) => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.onclick = () => {
            userAnswers[currentQuestionIndex] = answer.scores;
            Array.from(answersEl.children).forEach((btn) => {
                btn.disabled = true;
                if (btn === button) {
                    btn.classList.add("selected");
                }
            });
            nextBtn.disabled = false;
            updateProgress(currentQuestionIndex + 1);
        };
        answersEl.appendChild(button);
    });
    updateProgress(currentQuestionIndex);
}

function calculateResult() {
    const counts = {
        E: 0, I: 0, S: 0, N: 0,
        T: 0, F: 0, J: 0, P: 0
    };

    userAnswers.forEach((answerScores) => {
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

function showResult() {
    const mbtiType = calculateResult();
    document.getElementById("test-container").style.display = "none";
    resultContainer.style.display = "block";
    resultEl.textContent = `${translations[currentLanguage].resultPrefix} ${mbtiType}`;
    resultDescriptionEl.textContent = translations[currentLanguage].mbtiDescriptions[mbtiType];
    updateProgress(translations[currentLanguage].questions.length);
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

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < translations[currentLanguage].questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    });
}

applyTheme(currentTheme);
setLanguage(currentLanguage);
