const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const nextBtn = document.getElementById("next-btn");
const resultContainer = document.getElementById("result-container");
const resultEl = document.getElementById("result");
const resultDescriptionEl = document.getElementById("result-description");
const langEnBtn = document.getElementById("lang-en");
const langKoBtn = document.getElementById("lang-ko");
const themeToggleBtn = document.getElementById("theme-toggle");

let currentQuestionIndex = 0;
let userAnswers = [];
let currentLanguage = 'ko';
let currentTheme = localStorage.getItem("theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function applyTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute("data-theme", theme);
    themeToggleBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
    localStorage.setItem("theme", theme);
}

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = translations[lang][key];
    });
    startTest();
}

langEnBtn.addEventListener('click', () => setLanguage('en'));
langKoBtn.addEventListener('click', () => setLanguage('ko'));
themeToggleBtn.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
});

function startTest() {
    currentQuestionIndex = 0;
    userAnswers = [];
    showQuestion();
}

function showQuestion() {
    nextBtn.disabled = true;
    const currentQuestion = translations[currentLanguage].questions[currentQuestionIndex];
    questionEl.textContent = currentQuestion.question;
    answersEl.innerHTML = "";

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.onclick = () => {
            userAnswers.push(answer.type);
            Array.from(answersEl.children).forEach(btn => {
                btn.disabled = true;
                if(btn === button) {
                    btn.classList.add("selected");
                }
            });
            nextBtn.disabled = false;
        };
        answersEl.appendChild(button);
    });
}

nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < translations[currentLanguage].questions.length) {
        showQuestion();
    } else {
        showResult();
    }
});

function calculateResult() {
    const counts = {
        E: 0, I: 0, S: 0, N: 0,
        T: 0, F: 0, J: 0, P: 0
    };

    userAnswers.forEach(answer => {
        counts[answer]++;
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
    resultEl.textContent = `Your MBTI Type is: ${mbtiType}`;
    resultDescriptionEl.textContent = translations[currentLanguage].mbtiDescriptions[mbtiType];
}

applyTheme(currentTheme);
setLanguage(currentLanguage);
