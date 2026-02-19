const ADMIN_ID = "namu";
const ADMIN_PW = "namu!@#123";
const ADMIN_EMAIL_DOMAIN = "namu-23d3b.firebaseapp.com";
const MBTI_TYPES = ["", "E", "I", "N", "S", "T", "F", "J", "P"];
const PAGE_SIZE = 15;
const DEFAULT_TEST_SEED_KEY = "default-mbti-personality-v1";

const loginPanelEl = document.getElementById("admin-login-panel");
const appEl = document.getElementById("admin-app");
const adminIdEl = document.getElementById("admin-id");
const adminPwEl = document.getElementById("admin-password");
const loginBtn = document.getElementById("admin-login-btn");
const loginErrorEl = document.getElementById("admin-login-error");

const listViewEl = document.getElementById("admin-list-view");
const editorViewEl = document.getElementById("admin-editor-view");
const listStatusEl = document.getElementById("admin-list-status");
const listBodyEl = document.getElementById("admin-test-list-body");
const prevPageBtn = document.getElementById("list-prev-page");
const nextPageBtn = document.getElementById("list-next-page");
const pageInfoEl = document.getElementById("list-page-info");
const goCreateBtn = document.getElementById("go-create-btn");
const backToListBtn = document.getElementById("back-to-list-btn");
const logoutBtn = document.getElementById("admin-logout-btn");

const editorViewTitleEl = document.getElementById("editor-view-title");
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

const firebaseServices = window.firebaseServices || {};
const db = firebaseServices.db || null;
const auth = firebaseServices.auth || null;
const hasFirebaseCoreConfig = Boolean(firebaseServices && firebaseServices.isConfigured);
const isAuthReady = Boolean(hasFirebaseCoreConfig && auth);
const isDbReady = Boolean(hasFirebaseCoreConfig && db);

const state = {
    currentPage: 1,
    tests: [],
    editingTestId: "",
    cardThumbnailData: "",
    resultImageData: ""
};

function setAuthState(isAuthenticated) {
    if (isAuthenticated) {
        loginPanelEl.hidden = true;
        appEl.hidden = false;
        showListView();
        return;
    }

    loginPanelEl.hidden = false;
    appEl.hidden = true;
}

function showListView() {
    listViewEl.hidden = false;
    editorViewEl.hidden = true;
    saveStatusEl.textContent = "";
}

function showEditorView() {
    listViewEl.hidden = true;
    editorViewEl.hidden = false;
}

function adminEmailFromId(id) {
    return `${id}@${ADMIN_EMAIL_DOMAIN}`;
}

function adminIdFromEmail(email) {
    if (!email || typeof email !== "string") {
        return "-";
    }
    const atIndex = email.indexOf("@");
    if (atIndex <= 0) {
        return email;
    }
    return email.slice(0, atIndex);
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

function messageFromAuthErrorCode(code) {
    if (!code) {
        return "로그인 실패: Firebase Auth 설정을 확인해 주세요.";
    }
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        return "비밀번호가 올바르지 않습니다.";
    }
    if (code === "auth/invalid-email") {
        return "관리자 이메일 형식이 올바르지 않습니다. admin.js 설정을 확인해 주세요.";
    }
    if (code === "auth/operation-not-allowed") {
        return "Firebase 콘솔에서 Email/Password 로그인 방식을 활성화해 주세요.";
    }
    if (code === "auth/network-request-failed") {
        return "네트워크 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    }
    if (code === "auth/too-many-requests") {
        return "요청이 많아 잠시 차단되었습니다. 잠시 후 다시 시도해 주세요.";
    }
    return "로그인 실패: Firebase Auth 설정을 확인해 주세요.";
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    let dateValue = null;
    if (value.toDate && typeof value.toDate === "function") {
        dateValue = value.toDate();
    } else if (value.toMillis && typeof value.toMillis === "function") {
        dateValue = new Date(value.toMillis());
    } else if (typeof value === "number") {
        dateValue = new Date(value);
    }

    if (!dateValue || Number.isNaN(dateValue.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(dateValue);
}

function getSortableTimestamp(data) {
    const updatedAt = data && data.updatedAt;
    const createdAt = data && data.createdAt;

    if (updatedAt && typeof updatedAt.toMillis === "function") {
        return updatedAt.toMillis();
    }
    if (createdAt && typeof createdAt.toMillis === "function") {
        return createdAt.toMillis();
    }
    return 0;
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

function resetEditor() {
    state.editingTestId = "";
    editorViewTitleEl.textContent = "테스트 등록";
    saveTestBtn.textContent = "등록";

    testTitleEl.value = "";
    cardTitleEl.value = "";
    navTitleEl.value = "";
    resultGuideTextEl.value = "";
    questionListEl.innerHTML = "";
    state.cardThumbnailData = "";
    state.resultImageData = "";

    if (cardThumbnailInputEl) {
        cardThumbnailInputEl.value = "";
    }
    if (resultImageInputEl) {
        resultImageInputEl.value = "";
    }

    cardThumbnailPreviewEl.hidden = true;
    cardThumbnailPreviewEl.removeAttribute("src");
    resultImagePreviewEl.hidden = true;
    resultImagePreviewEl.removeAttribute("src");

    saveStatusEl.textContent = "";
    setQuestionCount(1);
    targetQuestionCountEl.value = "1";
}

function setAnswerEditor(answerEditor, answerData) {
    const answerTextEl = answerEditor.querySelector(".answer-text");
    const type1El = answerEditor.querySelector(".weight-type-1");
    const score1El = answerEditor.querySelector(".weight-score-1");
    const type2El = answerEditor.querySelector(".weight-type-2");
    const score2El = answerEditor.querySelector(".weight-score-2");

    answerTextEl.value = String(answerData.text || "");

    const scoreEntries = Object.entries(answerData.scores || {})
        .filter((entry) => Number(entry[1]) > 0)
        .slice(0, 2);

    if (scoreEntries[0]) {
        type1El.value = scoreEntries[0][0];
        score1El.value = String(Number(scoreEntries[0][1]));
    } else {
        type1El.value = "";
        score1El.value = "0";
    }

    if (scoreEntries[1]) {
        type2El.value = scoreEntries[1][0];
        score2El.value = String(Number(scoreEntries[1][1]));
    } else {
        type2El.value = "";
        score2El.value = "0";
    }

    refreshAnswerScorePreview(answerEditor);
}

function loadEditorFromData(data) {
    testTitleEl.value = String(data.title || "");
    cardTitleEl.value = String(data.cardTitle || "");
    navTitleEl.value = String(data.navTitle || "");
    resultGuideTextEl.value = String(data.resultGuideText || "");

    state.cardThumbnailData = String(data.thumbnail || "");
    state.resultImageData = String(data.resultImage || "");

    if (state.cardThumbnailData) {
        cardThumbnailPreviewEl.src = state.cardThumbnailData;
        cardThumbnailPreviewEl.hidden = false;
    } else {
        cardThumbnailPreviewEl.hidden = true;
        cardThumbnailPreviewEl.removeAttribute("src");
    }

    if (state.resultImageData) {
        resultImagePreviewEl.src = state.resultImageData;
        resultImagePreviewEl.hidden = false;
    } else {
        resultImagePreviewEl.hidden = true;
        resultImagePreviewEl.removeAttribute("src");
    }

    const questions = Array.isArray(data.questions) ? data.questions : [];
    const targetCount = Math.max(1, questions.length);
    setQuestionCount(targetCount);
    targetQuestionCountEl.value = String(targetCount);

    questions.forEach((questionData, questionIndex) => {
        const questionEl = questionListEl.querySelectorAll(".admin-question")[questionIndex];
        if (!questionEl) {
            return;
        }

        const questionInput = questionEl.querySelector(".question-title");
        questionInput.value = String(questionData.question || "");

        const answerEditors = questionEl.querySelectorAll(".answer-editor");
        const answers = Array.isArray(questionData.answers) ? questionData.answers.slice(0, 4) : [];

        answerEditors.forEach((answerEditor, answerIndex) => {
            const answerData = answers[answerIndex] || { text: "", scores: {} };
            setAnswerEditor(answerEditor, answerData);
        });
    });

    updateQuestionCount();
}

function getCurrentAdminId() {
    if (auth && auth.currentUser && auth.currentUser.email) {
        return adminIdFromEmail(auth.currentUser.email);
    }
    return ADMIN_ID;
}

async function saveTest() {
    saveStatusEl.textContent = "";

    if (!isDbReady) {
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

    const payload = {
        title,
        cardTitle,
        navTitle: navTitle || cardTitle,
        thumbnail: state.cardThumbnailData,
        resultGuideText,
        resultImage: state.resultImageData,
        questions,
        isPublished: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedById: getCurrentAdminId()
    };

    saveStatusEl.textContent = state.editingTestId ? "수정 저장 중..." : "등록 중...";

    try {
        if (state.editingTestId) {
            await db.collection("tests").doc(state.editingTestId).update(payload);
            saveStatusEl.textContent = "수정 저장 완료";
        } else {
            await db.collection("tests").add({
                ...payload,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdById: getCurrentAdminId()
            });
            saveStatusEl.textContent = "등록 완료";
        }

        showListView();
        await loadTestList();
    } catch (error) {
        console.error(error);
        saveStatusEl.textContent = "저장 실패: 콘솔 로그를 확인해 주세요.";
    }
}

function getTotalPages() {
    return Math.max(1, Math.ceil(state.tests.length / PAGE_SIZE));
}

function updatePaginationControls() {
    const totalPages = getTotalPages();
    if (state.currentPage > totalPages) {
        state.currentPage = totalPages;
    }

    pageInfoEl.textContent = `${state.currentPage} / ${totalPages}`;
    prevPageBtn.disabled = state.currentPage <= 1;
    nextPageBtn.disabled = state.currentPage >= totalPages;
}

function renderListRows() {
    listBodyEl.innerHTML = "";

    if (!state.tests.length) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 5;
        emptyCell.textContent = "등록된 테스트가 없습니다.";
        emptyRow.appendChild(emptyCell);
        listBodyEl.appendChild(emptyRow);
        updatePaginationControls();
        return;
    }

    const start = (state.currentPage - 1) * PAGE_SIZE;
    const pageItems = state.tests.slice(start, start + PAGE_SIZE);

    pageItems.forEach((item, idx) => {
        const row = document.createElement("tr");

        const numberCell = document.createElement("td");
        numberCell.textContent = String(start + idx + 1);

        const titleCell = document.createElement("td");
        titleCell.textContent = String(item.title || item.cardTitle || "테스트");

        const authorCell = document.createElement("td");
        authorCell.textContent = String(item.createdById || adminIdFromEmail(item.createdByEmail) || "-");

        const createdCell = document.createElement("td");
        createdCell.textContent = formatDateTime(item.createdAt);

        const actionsCell = document.createElement("td");
        const actionWrap = document.createElement("div");
        actionWrap.className = "table-action-wrap";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "수정";
        editBtn.addEventListener("click", () => {
            openEditView(item.id);
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "삭제";
        removeBtn.addEventListener("click", async () => {
            const ok = window.confirm("해당 테스트를 삭제할까요?");
            if (!ok) {
                return;
            }

            try {
                await db.collection("tests").doc(item.id).delete();
                await loadTestList();
            } catch (error) {
                console.error(error);
                listStatusEl.textContent = "삭제 실패: 콘솔 로그를 확인해 주세요.";
            }
        });

        actionWrap.append(editBtn, removeBtn);
        actionsCell.appendChild(actionWrap);

        row.append(numberCell, titleCell, authorCell, createdCell, actionsCell);
        listBodyEl.appendChild(row);
    });

    updatePaginationControls();
}

async function loadTestList() {
    if (!isDbReady) {
        listStatusEl.textContent = "Firebase 미설정 상태입니다.";
        listBodyEl.innerHTML = "";
        updatePaginationControls();
        return;
    }

    listStatusEl.textContent = "목록을 불러오는 중...";

    try {
        const snapshot = await db.collection("tests").get();
        state.tests = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => getSortableTimestamp(b) - getSortableTimestamp(a));

        listStatusEl.textContent = "";
        renderListRows();
    } catch (error) {
        console.error(error);
        listStatusEl.textContent = "테스트 목록을 불러오지 못했습니다.";
    }
}

async function openCreateView() {
    resetEditor();
    showEditorView();
}

async function openEditView(testId) {
    if (!testId) {
        return;
    }

    try {
        const doc = await db.collection("tests").doc(testId).get();
        if (!doc.exists) {
            listStatusEl.textContent = "대상 테스트를 찾을 수 없습니다.";
            return;
        }

        state.editingTestId = testId;
        editorViewTitleEl.textContent = "테스트 수정";
        saveTestBtn.textContent = "수정 저장";
        saveStatusEl.textContent = "";
        loadEditorFromData(doc.data() || {});
        showEditorView();
    } catch (error) {
        console.error(error);
        listStatusEl.textContent = "테스트 데이터를 불러오지 못했습니다.";
    }
}

function getSeedQuestions() {
    if (typeof translations === "undefined" || !translations.ko || !Array.isArray(translations.ko.questions)) {
        return [];
    }

    return translations.ko.questions
        .map((question) => {
            const answers = Array.isArray(question.answers) ? question.answers.slice(0, 4) : [];
            if (!question.question || answers.length !== 4) {
                return null;
            }

            const normalizedAnswers = answers
                .map((answer) => ({
                    text: String(answer.text || "").trim(),
                    scores: Object.keys(answer.scores || {}).reduce((acc, key) => {
                        const value = Number(answer.scores[key]);
                        if (!Number.isNaN(value) && value > 0) {
                            acc[key] = value;
                        }
                        return acc;
                    }, {})
                }))
                .filter((answer) => answer.text && Object.keys(answer.scores).length > 0);

            if (normalizedAnswers.length !== 4) {
                return null;
            }

            return {
                question: String(question.question).trim(),
                answers: normalizedAnswers
            };
        })
        .filter(Boolean);
}

async function ensureDefaultMbtiTest() {
    if (!isAuthReady) {
        return;
    }

    const seedQuestions = getSeedQuestions();
    if (!seedQuestions.length) {
        return;
    }

    try {
        const existing = await db.collection("tests").where("seedKey", "==", DEFAULT_TEST_SEED_KEY).limit(1).get();
        if (!existing.empty) {
            return;
        }

        const descriptions = (typeof translations !== "undefined" && translations.ko && translations.ko.mbtiDescriptions)
            ? translations.ko.mbtiDescriptions
            : {};

        await db.collection("tests").add({
            seedKey: DEFAULT_TEST_SEED_KEY,
            title: "MBTI 성격 검사",
            cardTitle: "MBTI 성격 검사",
            navTitle: "MBTI 성격 검사",
            thumbnail: "",
            resultGuideText: "",
            resultImage: "",
            questions: seedQuestions,
            mbtiDescriptions: descriptions,
            isPublished: true,
            createdById: ADMIN_ID,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("기본 MBTI 테스트 자동 등록 실패:", error);
    }
}

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const id = String(adminIdEl.value || "").trim();
        const pw = String(adminPwEl.value || "");

        if (!isAuthReady) {
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
                    const createCode = createError && createError.code ? createError.code : "";
                    if (createCode === "auth/email-already-in-use") {
                        setLoginError("이미 생성된 관리자 계정입니다. 비밀번호를 확인해 주세요.");
                        return;
                    }
                    setLoginError(messageFromAuthErrorCode(createCode));
                    return;
                }
            }
            setLoginError(messageFromAuthErrorCode(code));
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

if (goCreateBtn) {
    goCreateBtn.addEventListener("click", openCreateView);
}

if (backToListBtn) {
    backToListBtn.addEventListener("click", () => {
        showListView();
    });
}

if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
        if (state.currentPage > 1) {
            state.currentPage -= 1;
            renderListRows();
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
        const totalPages = getTotalPages();
        if (state.currentPage < totalPages) {
            state.currentPage += 1;
            renderListRows();
        }
    });
}

if (cardThumbnailInputEl) {
    cardThumbnailInputEl.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        state.cardThumbnailData = await toDataUrl(file, 800);
        cardThumbnailPreviewEl.src = state.cardThumbnailData;
        cardThumbnailPreviewEl.hidden = false;
    });
}

if (resultImageInputEl) {
    resultImageInputEl.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        state.resultImageData = await toDataUrl(file, 1024);
        resultImagePreviewEl.src = state.resultImageData;
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

    if (!isAuthReady) {
        setAuthState(false);
        setLoginError("Firebase Auth 설정이 필요합니다. firebase-config.js 값을 확인해 주세요.");
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        const expectedEmail = adminEmailFromId(ADMIN_ID);
        const authorized = Boolean(user && user.email === expectedEmail);
        setAuthState(authorized);

        if (authorized) {
            setLoginError("");
            await ensureDefaultMbtiTest();
            state.currentPage = 1;
            await loadTestList();
            return;
        }

        if (user && user.email !== expectedEmail) {
            await auth.signOut();
            setLoginError("해당 계정은 관리자 접근 권한이 없습니다.");
        }
    });
})();
