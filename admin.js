const ADMIN_ID = "namu";
const ADMIN_PW = "namu!@#123";
const ADMIN_EMAIL_DOMAIN = "mbti.local";
const MBTI_TYPES = ["", "E", "I", "N", "S", "T", "F", "J", "P"];

const loginPanelEl = document.getElementById("admin-login-panel");
const appEl = document.getElementById("admin-app");
const adminIdEl = document.getElementById("admin-id");
const adminPwEl = document.getElementById("admin-password");
const loginBtn = document.getElementById("admin-login-btn");
const loginErrorEl = document.getElementById("admin-login-error");
const logoutBtn = document.getElementById("admin-logout-btn");
const testTitleEl = document.getElementById("test-title");
const cardTitleEl = document.getElementById("card-title");
const navTitleEl = document.getElementById("nav-title");
const targetQuestionCountEl = document.getElementById("question-count-target");
const applyQuestionCountBtn = document.getElementById("apply-question-count");
const cardThumbnailInputEl = document.getElementById("card-thumbnail-input");
const cardThumbnailPreviewEl = document.getElementById("card-thumbnail-preview");
const resultGuideTextEl = document.getElementById("result-guide-text");
const resultImageInputEl = document.getElementById("result-image-input");
const resultImagePreviewEl = document.getElementById("result-image-preview");
const addQuestionBtn = document.getElementById("add-question-btn");
const questionCountLabelEl = document.getElementById("question-count-label");
const questionListEl = document.getElementById("question-list");
const saveTestBtn = document.getElementById("save-test-btn");
const saveStatusEl = document.getElementById("admin-save-status");
const existingTestsEl = document.getElementById("existing-tests");

const db = window.firebaseServices && window.firebaseServices.db;
const auth = window.firebaseServices && window.firebaseServices.auth;
const isFirebaseConfigured = Boolean(window.firebaseServices && window.firebaseServices.isConfigured && db && auth);

let cardThumbnailData = "";
let resultImageData = "";

function setAuthState(isAuthenticated) {
    if (isAuthenticated) {
        loginPanelEl.hidden = true;
        appEl.hidden = false;
    } else {
        loginPanelEl.hidden = false;
        appEl.hidden = true;
    }
}

function adminEmailFromId(id) {
    return `${id}@${ADMIN_EMAIL_DOMAIN}`;
}

function setLoginError(message) {
    if (!message) {
        loginErrorEl.hidden = true;
        loginErrorEl.textContent = "";
        return;
    }
    loginErrorEl.hidden = false;
    loginErrorEl.textContent = message;
}

function createMbtiSelect(className) {
    const select = document.createElement("select");
    select.className = className;
    MBTI_TYPES.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type || "선택";
        select.appendChild(option);
    });
    return select;
}

function getAnswerScorePreview(answerEl) {
    const lines = [];
    [1, 2].forEach((index) => {
        const type = answerEl.querySelector(`.weight-type-${index}`).value;
        const score = Number(answerEl.querySelector(`.weight-score-${index}`).value || 0);
        if (type && score > 0) {
            lines.push(`${type} +${score}`);
        }
    });
    return lines.length ? lines.join(", ") : "점수 미설정";
}

function refreshAnswerScorePreview(answerEl) {
    const previewEl = answerEl.querySelector(".score-preview");
    previewEl.textContent = `적용 점수: ${getAnswerScorePreview(answerEl)}`;
}

function updateQuestionCount() {
    const count = questionListEl.querySelectorAll(".admin-question").length;
    questionCountLabelEl.textContent = `현재 문항 수: ${count}`;
}

function createAnswerRow(answerNumber) {
    const answerEl = document.createElement("div");
    answerEl.className = "answer-editor";

    const answerLabel = document.createElement("label");
    answerLabel.textContent = `답변 ${answerNumber}`;

    const answerText = document.createElement("input");
    answerText.type = "text";
    answerText.className = "answer-text";
    answerText.placeholder = `답변 ${answerNumber} 텍스트`;

    const weightRow1 = document.createElement("div");
    weightRow1.className = "weight-row";
    const weightType1 = createMbtiSelect("weight-type-1");
    const weightScore1 = document.createElement("input");
    weightScore1.type = "number";
    weightScore1.className = "weight-score-1";
    weightScore1.min = "0";
    weightScore1.max = "10";
    weightScore1.value = "2";
    weightRow1.append(weightType1, weightScore1);

    const weightRow2 = document.createElement("div");
    weightRow2.className = "weight-row";
    const weightType2 = createMbtiSelect("weight-type-2");
    const weightScore2 = document.createElement("input");
    weightScore2.type = "number";
    weightScore2.className = "weight-score-2";
    weightScore2.min = "0";
    weightScore2.max = "10";
    weightScore2.value = "0";
    weightRow2.append(weightType2, weightScore2);

    const scorePreview = document.createElement("p");
    scorePreview.className = "score-preview";
    scorePreview.textContent = "적용 점수: 점수 미설정";

    [answerText, weightType1, weightScore1, weightType2, weightScore2].forEach((el) => {
        el.addEventListener("input", () => refreshAnswerScorePreview(answerEl));
    });

    answerEl.append(answerLabel, answerText, weightRow1, weightRow2, scorePreview);
    return answerEl;
}

function addQuestion() {
    const questionIndex = questionListEl.querySelectorAll(".admin-question").length + 1;
    const questionWrap = document.createElement("article");
    questionWrap.className = "admin-question";

    const topRow = document.createElement("div");
    topRow.className = "admin-top-row";

    const title = document.createElement("h3");
    title.textContent = `문항 ${questionIndex}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "문항 삭제";
    removeBtn.addEventListener("click", () => {
        questionWrap.remove();
        updateQuestionTitles();
        updateQuestionCount();
    });

    topRow.append(title, removeBtn);

    const questionInputLabel = document.createElement("label");
    questionInputLabel.textContent = "질문 제목";

    const questionInput = document.createElement("input");
    questionInput.type = "text";
    questionInput.className = "question-title";
    questionInput.placeholder = `문항 ${questionIndex} 질문 입력`;

    questionInputLabel.appendChild(questionInput);

    const answersWrap = document.createElement("div");
    answersWrap.className = "answers-editor";
    for (let i = 1; i <= 4; i += 1) {
        answersWrap.appendChild(createAnswerRow(i));
    }

    questionWrap.append(topRow, questionInputLabel, answersWrap);
    questionListEl.appendChild(questionWrap);
    updateQuestionTitles();
    updateQuestionCount();
}

function updateQuestionTitles() {
    questionListEl.querySelectorAll(".admin-question").forEach((questionEl, idx) => {
        const h3 = questionEl.querySelector("h3");
        const input = questionEl.querySelector(".question-title");
        if (h3) {
            h3.textContent = `문항 ${idx + 1}`;
        }
        if (input && !input.value) {
            input.placeholder = `문항 ${idx + 1} 질문 입력`;
        }
    });
}

function setQuestionCount(target) {
    const safeTarget = Math.max(1, Number(target) || 1);
    const current = questionListEl.querySelectorAll(".admin-question").length;

    if (current < safeTarget) {
        for (let i = current; i < safeTarget; i += 1) {
            addQuestion();
        }
    } else if (current > safeTarget) {
        for (let i = current; i > safeTarget; i -= 1) {
            const last = questionListEl.querySelector(".admin-question:last-child");
            if (last) {
                last.remove();
            }
        }
        updateQuestionTitles();
        updateQuestionCount();
    }
}

function toDataUrl(file, maxSide = 640) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > maxSide) {
                    height = Math.round((height * maxSide) / width);
                    width = maxSide;
                } else if (height >= width && height > maxSide) {
                    width = Math.round((width * maxSide) / height);
                    height = maxSide;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = reject;
            img.src = String(reader.result || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function collectQuestions() {
    const questions = [];

    const questionEditors = questionListEl.querySelectorAll(".admin-question");
    questionEditors.forEach((questionEditor, questionIndex) => {
        const questionTitle = String(questionEditor.querySelector(".question-title").value || "").trim();
        if (!questionTitle) {
            throw new Error(`${questionIndex + 1}번 문항의 질문 제목을 입력해 주세요.`);
        }

        const answers = [];
        questionEditor.querySelectorAll(".answer-editor").forEach((answerEditor, answerIndex) => {
            const answerText = String(answerEditor.querySelector(".answer-text").value || "").trim();
            if (!answerText) {
                throw new Error(`${questionIndex + 1}번 문항 ${answerIndex + 1}번 답변 제목을 입력해 주세요.`);
            }

            const scores = {};
            [1, 2].forEach((weightIndex) => {
                const type = answerEditor.querySelector(`.weight-type-${weightIndex}`).value;
                const score = Number(answerEditor.querySelector(`.weight-score-${weightIndex}`).value || 0);
                if (type && score > 0) {
                    scores[type] = (scores[type] || 0) + score;
                }
            });

            if (!Object.keys(scores).length) {
                throw new Error(`${questionIndex + 1}번 문항 ${answerIndex + 1}번 답변에 MBTI 가중치를 설정해 주세요.`);
            }

            answers.push({ text: answerText, scores });
        });

        if (answers.length !== 4) {
            throw new Error(`${questionIndex + 1}번 문항은 답변 4개가 필요합니다.`);
        }

        questions.push({ question: questionTitle, answers });
    });

    return questions;
}

async function saveTest() {
    saveStatusEl.textContent = "";

    if (!isFirebaseConfigured) {
        saveStatusEl.textContent = "Firebase 설정이 없어 저장할 수 없습니다. firebase-config.js 값을 먼저 채워 주세요.";
        return;
    }

    const title = String(testTitleEl.value || "").trim();
    const cardTitle = String(cardTitleEl.value || "").trim();
    const navTitle = String(navTitleEl.value || "").trim();
    const resultGuideText = String(resultGuideTextEl.value || "").trim();

    if (!title) {
        saveStatusEl.textContent = "테스트 제목을 입력해 주세요.";
        return;
    }

    if (!cardTitle) {
        saveStatusEl.textContent = "카드 제목을 입력해 주세요.";
        return;
    }

    let questions;
    try {
        questions = collectQuestions();
    } catch (error) {
        saveStatusEl.textContent = error.message;
        return;
    }

    saveStatusEl.textContent = "저장 중...";

    try {
        await db.collection("tests").add({
            title,
            cardTitle,
            navTitle: navTitle || cardTitle,
            thumbnail: cardThumbnailData,
            resultGuideText,
            resultImage: resultImageData,
            questions,
            isPublished: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        saveStatusEl.textContent = "저장 완료";
        resetEditor();
        await loadExistingTests();
    } catch (error) {
        console.error(error);
        saveStatusEl.textContent = "저장 실패: 콘솔 로그를 확인해 주세요.";
    }
}

function resetEditor() {
    testTitleEl.value = "";
    cardTitleEl.value = "";
    navTitleEl.value = "";
    resultGuideTextEl.value = "";
    questionListEl.innerHTML = "";
    cardThumbnailData = "";
    resultImageData = "";
    cardThumbnailPreviewEl.hidden = true;
    cardThumbnailPreviewEl.removeAttribute("src");
    resultImagePreviewEl.hidden = true;
    resultImagePreviewEl.removeAttribute("src");
    setQuestionCount(1);
    targetQuestionCountEl.value = "1";
}

async function loadExistingTests() {
    existingTestsEl.innerHTML = "";

    if (!isFirebaseConfigured) {
        const li = document.createElement("li");
        li.textContent = "Firebase 미설정 상태입니다.";
        existingTestsEl.appendChild(li);
        return;
    }

    try {
        const snapshot = await db.collection("tests").orderBy("createdAt", "desc").limit(30).get();
        if (snapshot.empty) {
            const li = document.createElement("li");
            li.textContent = "등록된 테스트가 없습니다.";
            existingTestsEl.appendChild(li);
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data() || {};
            const li = document.createElement("li");
            li.className = "existing-test-item";

            const title = document.createElement("span");
            title.textContent = `${data.cardTitle || data.title || "테스트"} (${doc.id})`;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "삭제";
            removeBtn.addEventListener("click", async () => {
                const ok = window.confirm("해당 테스트를 삭제할까요?");
                if (!ok) {
                    return;
                }
                await db.collection("tests").doc(doc.id).delete();
                await loadExistingTests();
            });

            li.append(title, removeBtn);
            existingTestsEl.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        const li = document.createElement("li");
        li.textContent = "테스트 목록을 불러오지 못했습니다.";
        existingTestsEl.appendChild(li);
    }
}

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const id = String(adminIdEl.value || "").trim();
        const pw = String(adminPwEl.value || "");

        if (!isFirebaseConfigured) {
            setLoginError("Firebase Auth 설정이 필요합니다. firebase-config.js 값을 확인해 주세요.");
            return;
        }

        if (id !== ADMIN_ID) {
            setLoginError("허용되지 않은 관리자 ID입니다.");
            return;
        }

        const email = adminEmailFromId(id);
        setLoginError("");

        try {
            await auth.signInWithEmailAndPassword(email, pw);
        } catch (error) {
            const code = error && error.code ? error.code : "";
            if ((code === "auth/user-not-found" || code === "auth/invalid-credential") && id === ADMIN_ID && pw === ADMIN_PW) {
                try {
                    await auth.createUserWithEmailAndPassword(email, pw);
                    return;
                } catch (createError) {
                    setLoginError("초기 관리자 계정 생성에 실패했습니다. Firebase Auth 설정을 확인해 주세요.");
                    return;
                }
            }
            if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
                setLoginError("비밀번호가 올바르지 않습니다.");
                return;
            }
            setLoginError("로그인 실패: Firebase Auth 설정을 확인해 주세요.");
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        if (auth) {
            await auth.signOut();
        } else {
            setAuthState(false);
        }
    });
}

if (cardThumbnailInputEl) {
    cardThumbnailInputEl.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        cardThumbnailData = await toDataUrl(file, 800);
        cardThumbnailPreviewEl.src = cardThumbnailData;
        cardThumbnailPreviewEl.hidden = false;
    });
}

if (resultImageInputEl) {
    resultImageInputEl.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        resultImageData = await toDataUrl(file, 1024);
        resultImagePreviewEl.src = resultImageData;
        resultImagePreviewEl.hidden = false;
    });
}

if (addQuestionBtn) {
    addQuestionBtn.addEventListener("click", addQuestion);
}

if (applyQuestionCountBtn) {
    applyQuestionCountBtn.addEventListener("click", () => {
        setQuestionCount(targetQuestionCountEl.value);
    });
}

if (saveTestBtn) {
    saveTestBtn.addEventListener("click", saveTest);
}

(function init() {
    setQuestionCount(1);

    if (!isFirebaseConfigured) {
        setAuthState(false);
        setLoginError("Firebase 설정이 필요합니다. firebase-config.js를 먼저 채워 주세요.");
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        const expectedEmail = adminEmailFromId(ADMIN_ID);
        const authorized = Boolean(user && user.email === expectedEmail);
        setAuthState(authorized);
        if (authorized) {
            setLoginError("");
            await loadExistingTests();
            return;
        }
        if (user && user.email !== expectedEmail) {
            await auth.signOut();
            setLoginError("해당 계정은 관리자 접근 권한이 없습니다.");
        }
    });
})();
