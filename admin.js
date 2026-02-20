const ADMIN_ID = "namu";
const ADMIN_PW = "namu!@#123";
const ADMIN_EMAIL_DOMAIN = "namu-23d3b.firebaseapp.com";
const EXTRA_ADMIN_EMAILS = ["ksn0525@gmail.com"];
const MBTI_TYPES = ["", "E", "I", "N", "S", "T", "F", "J", "P"];
const MBTI_RESULT_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const PAGE_SIZE = 15;
const DEFAULT_TEST_SEED_KEY = "default-mbti-personality-v1";
const EXCEL_CELL_TEXT_LIMIT = 32767;

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
const excelUploadBtn = document.getElementById("excel-upload-btn");
const excelUploadInputEl = document.getElementById("excel-upload-input");
const excelTemplateDownloadEl = document.getElementById("excel-template-download");
const backToListBtn = document.getElementById("back-to-list-btn");
const logoutBtn = document.getElementById("admin-logout-btn");

const editorViewTitleEl = document.getElementById("editor-view-title");
const testTitleEl = document.getElementById("test-title");
const cardTitleEl = document.getElementById("card-title");
const isRecommendedEl = document.getElementById("is-recommended");
const publishVisibleEl = document.getElementById("publish-visible");
const publishHiddenEl = document.getElementById("publish-hidden");
const cardThumbnailInputEl = document.getElementById("card-thumbnail-input");
const cardThumbnailPreviewEl = document.getElementById("card-thumbnail-preview");
const resultMbtiSelectEl = document.getElementById("result-mbti-select");
const resultTitleInputEl = document.getElementById("result-title-input");
const resultContentInputEl = document.getElementById("result-content-input");
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
    resultSettings: {},
    selectedResultMbti: MBTI_RESULT_TYPES[0]
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

function getAllowedAdminEmails() {
    return [adminEmailFromId(ADMIN_ID), ...EXTRA_ADMIN_EMAILS]
        .map((email) => String(email || "").trim().toLowerCase())
        .filter(Boolean);
}

function isAllowedAdminEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) {
        return false;
    }
    return getAllowedAdminEmails().includes(normalized);
}

function resolveAdminEmailFromLoginId(id) {
    const normalized = String(id || "").trim();
    if (!normalized) {
        return "";
    }
    if (normalized.includes("@")) {
        return normalized.toLowerCase();
    }
    return adminEmailFromId(normalized).toLowerCase();
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
    if (code === "auth/user-not-found") {
        return "등록되지 않은 관리자 계정입니다. Firebase Authentication > Users에서 계정을 확인해 주세요.";
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
    return `로그인 실패(${code}): Firebase Auth 설정을 확인해 주세요.`;
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

function createEmptyResultSettings() {
    return MBTI_RESULT_TYPES.reduce((acc, mbti) => {
        acc[mbti] = {
            title: "",
            content: "",
            image: "",
            titleEn: "",
            contentEn: ""
        };
        return acc;
    }, {});
}

function normalizeResultSettings(raw) {
    const base = createEmptyResultSettings();
    const source = raw && typeof raw === "object" ? raw : {};

    if (Array.isArray(source)) {
        source.forEach((item) => {
            if (!item || typeof item !== "object") {
                return;
            }
            const key = String(item.mbti || item.type || "").trim().toUpperCase();
            if (!MBTI_RESULT_TYPES.includes(key)) {
                return;
            }
            base[key] = {
                title: String(item.title || item.titleKo || item.title_ko || ""),
                content: String(item.content || item.contentKo || item.content_ko || ""),
                image: String(item.image || item.imageUrl || item.image_url || ""),
                titleEn: String(item.titleEn || item.title_en || ""),
                contentEn: String(item.contentEn || item.content_en || "")
            };
        });
        return base;
    }

    MBTI_RESULT_TYPES.forEach((mbti) => {
        const item = source[mbti] && typeof source[mbti] === "object" ? source[mbti] : {};
        base[mbti] = {
            title: String(item.title || ""),
            content: String(item.content || ""),
            image: String(item.image || ""),
            titleEn: String(item.titleEn || ""),
            contentEn: String(item.contentEn || "")
        };
    });
    return base;
}

function commitCurrentResultEditor(mbtiKey = state.selectedResultMbti) {
    if (!resultMbtiSelectEl || !resultTitleInputEl || !resultContentInputEl) {
        return;
    }
    const mbti = MBTI_RESULT_TYPES.includes(mbtiKey) ? mbtiKey : resultMbtiSelectEl.value;
    if (!mbti || !state.resultSettings[mbti]) {
        return;
    }
    state.resultSettings[mbti].title = String(resultTitleInputEl.value || "").trim();
    state.resultSettings[mbti].content = String(resultContentInputEl.value || "").trim();
}

function renderResultEditor(mbti) {
    if (!resultMbtiSelectEl || !resultTitleInputEl || !resultContentInputEl || !resultImagePreviewEl) {
        return;
    }
    const key = MBTI_RESULT_TYPES.includes(mbti) ? mbti : MBTI_RESULT_TYPES[0];
    state.selectedResultMbti = key;
    resultMbtiSelectEl.value = key;
    const current = state.resultSettings[key] || { title: "", content: "", image: "" };
    resultTitleInputEl.value = current.title || "";
    resultContentInputEl.value = current.content || "";
    if (current.image) {
        resultImagePreviewEl.src = current.image;
        resultImagePreviewEl.hidden = false;
    } else {
        resultImagePreviewEl.hidden = true;
        resultImagePreviewEl.removeAttribute("src");
    }
    if (resultImageInputEl) {
        resultImageInputEl.value = "";
    }
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
    if (isRecommendedEl) {
        isRecommendedEl.checked = false;
    }
    if (publishVisibleEl) {
        publishVisibleEl.checked = true;
    }
    if (publishHiddenEl) {
        publishHiddenEl.checked = false;
    }
    questionListEl.innerHTML = "";
    state.cardThumbnailData = "";
    state.resultSettings = createEmptyResultSettings();
    state.selectedResultMbti = MBTI_RESULT_TYPES[0];

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
    renderResultEditor(state.selectedResultMbti);
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
    if (isRecommendedEl) {
        isRecommendedEl.checked = Boolean(data.isRecommended);
    }
    if (publishVisibleEl) {
        publishVisibleEl.checked = Boolean(data.isPublished !== false);
    }
    if (publishHiddenEl) {
        publishHiddenEl.checked = !Boolean(data.isPublished !== false);
    }

    state.cardThumbnailData = String(data.thumbnail || "");
    state.resultSettings = normalizeResultSettings(data.resultSettings);

    if (state.cardThumbnailData) {
        cardThumbnailPreviewEl.src = state.cardThumbnailData;
        cardThumbnailPreviewEl.hidden = false;
    } else {
        cardThumbnailPreviewEl.hidden = true;
        cardThumbnailPreviewEl.removeAttribute("src");
    }

    if (data.mbtiDescriptions && typeof data.mbtiDescriptions === "object") {
        MBTI_RESULT_TYPES.forEach((mbti) => {
            if (!state.resultSettings[mbti].content && data.mbtiDescriptions[mbti]) {
                state.resultSettings[mbti].content = String(data.mbtiDescriptions[mbti]);
            }
            if (!state.resultSettings[mbti].title) {
                state.resultSettings[mbti].title = `${mbti} 유형`;
            }
        });
    }

    const questions = Array.isArray(data.questions) ? data.questions : [];
    const targetCount = Math.max(1, questions.length);
    setQuestionCount(targetCount);

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
    renderResultEditor(state.selectedResultMbti);
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
    const isRecommended = Boolean(isRecommendedEl && isRecommendedEl.checked);
    const isPublished = Boolean(publishVisibleEl && publishVisibleEl.checked);
    commitCurrentResultEditor();

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
        navTitle: cardTitle,
        isRecommended,
        isPublished,
        thumbnail: state.cardThumbnailData,
        resultSettings: normalizeResultSettings(state.resultSettings),
        mbtiDescriptions: MBTI_RESULT_TYPES.reduce((acc, mbti) => {
            const content = String(state.resultSettings[mbti] && state.resultSettings[mbti].content || "").trim();
            if (content) {
                acc[mbti] = content;
            }
            return acc;
        }, {}),
        questions,
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
                viewCount: 0,
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

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = "복사";
        copyBtn.addEventListener("click", async () => {
            const ok = window.confirm("정말 복사하시겠습니까?");
            if (!ok) {
                return;
            }

            try {
                const copiedTitle = `${String(item.title || item.cardTitle || "테스트")} (복사본)`;
                const copiedCardTitle = `${String(item.cardTitle || item.title || "테스트")} (복사본)`;
                const { id, ...sourceData } = item;

                await db.collection("tests").add({
                    ...sourceData,
                    title: copiedTitle,
                    cardTitle: copiedCardTitle,
                    navTitle: item.navTitle ? `${String(item.navTitle)} (복사본)` : copiedCardTitle,
                    viewCount: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdById: getCurrentAdminId(),
                    updatedById: getCurrentAdminId()
                });

                listStatusEl.textContent = "테스트를 복사 등록했습니다.";
                await loadTestList();
            } catch (error) {
                console.error(error);
                listStatusEl.textContent = "복사 실패: 콘솔 로그를 확인해 주세요.";
            }
        });

        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.textContent = "다운로드";
        downloadBtn.addEventListener("click", () => {
            try {
                downloadTestAsExcel(item);
                listStatusEl.textContent = "엑셀 다운로드를 시작했습니다.";
            } catch (error) {
                console.error(error);
                listStatusEl.textContent = "엑셀 다운로드 실패: 콘솔 로그를 확인해 주세요.";
            }
        });

        actionWrap.append(editBtn, removeBtn, copyBtn, downloadBtn);
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

function parseBooleanCell(value, defaultValue = false) {
    if (value === true || value === false) {
        return value;
    }
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) {
        return defaultValue;
    }
    return ["1", "true", "yes", "y", "노출", "추천"].includes(normalized);
}

function normalizeExcelHeaderKey(key) {
    return String(key || "")
        .trim()
        .toLowerCase()
        .replace(/[<>{}\[\]()]/g, "")
        .replace(/[\s_-]+/g, "");
}

function findRowValueByHeaderAliases(row, aliases) {
    if (!row || typeof row !== "object") {
        return "";
    }
    const keys = Object.keys(row);
    for (const alias of aliases) {
        const aliasKey = normalizeExcelHeaderKey(alias);
        const foundKey = keys.find((k) => normalizeExcelHeaderKey(k) === aliasKey);
        if (!foundKey) {
            continue;
        }
        const value = row[foundKey];
        if (value !== null && value !== undefined) {
            return value;
        }
    }
    return "";
}

function extractMbtiFromResultRow(row) {
    const direct = String(findRowValueByHeaderAliases(row, ["mbti", "type", "result_type", "유형"]) || "")
        .trim()
        .toUpperCase();
    if (MBTI_RESULT_TYPES.includes(direct)) {
        return direct;
    }

    const values = Object.values(row || {});
    for (const value of values) {
        const candidate = String(value || "").trim().toUpperCase();
        if (MBTI_RESULT_TYPES.includes(candidate)) {
            return candidate;
        }
    }
    return "";
}

function fitExcelCellText(value, options = {}) {
    const {
        emptyIfTooLongDataUrl = true
    } = options;
    const text = String(value || "");
    if (text.length <= EXCEL_CELL_TEXT_LIMIT) {
        return text;
    }

    if (emptyIfTooLongDataUrl && /^data:image\//i.test(text)) {
        return "";
    }

    return text.slice(0, EXCEL_CELL_TEXT_LIMIT);
}

function safeFileName(name, fallback = "mbti-test") {
    const cleaned = String(name || "")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) {
        return fallback;
    }
    return cleaned.slice(0, 120);
}

function normalizeExcelScoreEntries(scores) {
    return Object.entries(scores || {})
        .map(([type, score]) => [String(type || "").trim().toUpperCase(), Number(score) || 0])
        .filter(([type, score]) => MBTI_TYPES.includes(type) && score > 0)
        .slice(0, 2);
}

function buildExcelWorkbookFromTestItem(item) {
    if (!window.XLSX) {
        return null;
    }
    const wb = XLSX.utils.book_new();
    const basicRows = [{
        title_ko: fitExcelCellText(String(item.title || "").trim()),
        title_en: fitExcelCellText(String(item.titleEn || "").trim()),
        card_title_ko: fitExcelCellText(String(item.cardTitle || item.title || "").trim()),
        card_title_en: fitExcelCellText(String(item.cardTitleEn || item.titleEn || "").trim()),
        thumbnail_url: fitExcelCellText(String(item.thumbnail || "").trim()),
        is_recommended: Boolean(item.isRecommended) ? "true" : "false",
        is_published: Boolean(item.isPublished) ? "true" : "false"
    }];

    const questions = Array.isArray(item.questions) ? item.questions : [];
    const questionRows = questions.map((question, index) => {
        const answers = Array.isArray(question.answers) ? question.answers.slice(0, 4) : [];
        const row = {
            order: index + 1,
            question_ko: fitExcelCellText(String(question.question || "").trim()),
            question_en: fitExcelCellText(String(question.questionEn || "").trim())
        };

        for (let i = 1; i <= 4; i += 1) {
            const answer = answers[i - 1] || {};
            const scoreEntries = normalizeExcelScoreEntries(answer.scores);
            row[`answer${i}_ko`] = fitExcelCellText(String(answer.text || "").trim());
            row[`answer${i}_en`] = fitExcelCellText(String(answer.textEn || "").trim());
            row[`answer${i}_type1`] = scoreEntries[0] ? scoreEntries[0][0] : "";
            row[`answer${i}_score1`] = scoreEntries[0] ? scoreEntries[0][1] : 0;
            row[`answer${i}_type2`] = scoreEntries[1] ? scoreEntries[1][0] : "";
            row[`answer${i}_score2`] = scoreEntries[1] ? scoreEntries[1][1] : 0;
        }
        return row;
    });

    const resultSettings = (item.resultSettings && typeof item.resultSettings === "object")
        ? item.resultSettings
        : {};
    const mbtiDescriptions = (item.mbtiDescriptions && typeof item.mbtiDescriptions === "object")
        ? item.mbtiDescriptions
        : {};
    const resultRows = MBTI_RESULT_TYPES.map((mbti) => {
        const setting = (resultSettings[mbti] && typeof resultSettings[mbti] === "object")
            ? resultSettings[mbti]
            : {};
        return {
            mbti,
            title_ko: fitExcelCellText(String(setting.title || `${mbti} 유형`).trim()),
            title_en: fitExcelCellText(String(setting.titleEn || "").trim()),
            content_ko: fitExcelCellText(String(setting.content || mbtiDescriptions[mbti] || "").trim(), { emptyIfTooLongDataUrl: false }),
            content_en: fitExcelCellText(String(setting.contentEn || "").trim(), { emptyIfTooLongDataUrl: false }),
            image_url: fitExcelCellText(String(setting.image || "").trim())
        };
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(basicRows), "Basic");
    XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(questionRows.length ? questionRows : [{ order: 1, question_ko: "", question_en: "" }]),
        "Questions"
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resultRows), "Results");

    const title = String(item.title || item.cardTitle || "mbti-test").trim();
    const fileName = `${safeFileName(title, "mbti-test")}.xlsx`;
    return { wb, fileName };
}

function downloadTestAsExcel(item) {
    if (!window.XLSX) {
        throw new Error("엑셀 라이브러리를 불러오지 못했습니다.");
    }
    const result = buildExcelWorkbookFromTestItem(item);
    if (!result) {
        throw new Error("엑셀 파일을 생성할 수 없습니다.");
    }
    XLSX.writeFile(result.wb, result.fileName);
}

function buildExcelTemplateWorkbook() {
    if (!window.XLSX) {
        return null;
    }
    const wb = XLSX.utils.book_new();

    const basicRows = [{
        title_ko: "직장인 공감 MBTI",
        title_en: "Office Worker MBTI",
        card_title_ko: "직장인 공감 MBTI",
        card_title_en: "Office Worker MBTI",
        thumbnail_url: "",
        is_recommended: "false",
        is_published: "true"
    }];

    const questionRows = [{
        order: 1,
        question_ko: "회의 전에 준비를 철저히 한다.",
        question_en: "I prepare thoroughly before meetings.",
        answer1_ko: "매우 그렇다",
        answer1_en: "Strongly agree",
        answer1_type1: "J",
        answer1_score1: 2,
        answer1_type2: "",
        answer1_score2: 0,
        answer2_ko: "대체로 그렇다",
        answer2_en: "Agree",
        answer2_type1: "J",
        answer2_score1: 1,
        answer2_type2: "",
        answer2_score2: 0,
        answer3_ko: "대체로 아니다",
        answer3_en: "Disagree",
        answer3_type1: "P",
        answer3_score1: 1,
        answer3_type2: "",
        answer3_score2: 0,
        answer4_ko: "전혀 아니다",
        answer4_en: "Strongly disagree",
        answer4_type1: "P",
        answer4_score1: 2,
        answer4_type2: "",
        answer4_score2: 0
    }];

    const resultRows = MBTI_RESULT_TYPES.map((mbti) => ({
        mbti,
        title_ko: `${mbti} 유형`,
        title_en: `${mbti} Type`,
        content_ko: `${mbti} 결과 설명을 입력해 주세요.`,
        content_en: `Describe ${mbti} result in English.`,
        image_url: ""
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(basicRows), "Basic");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(questionRows), "Questions");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resultRows), "Results");
    return wb;
}

function parseExcelQuestions(rows) {
    if (!Array.isArray(rows) || !rows.length) {
        throw new Error("Questions 시트에 문항 데이터가 없습니다.");
    }

    return rows
        .map((row) => {
            const order = Number(row.order);
            if (!Number.isFinite(order)) {
                throw new Error("Questions 시트의 order 값이 올바르지 않습니다.");
            }
            const question = String(row.question_ko || "").trim();
            if (!question) {
                throw new Error(`Questions 시트 ${order}번 문항의 question_ko가 비어 있습니다.`);
            }
            const questionEn = String(row.question_en || "").trim();

            const answers = [];
            for (let i = 1; i <= 4; i += 1) {
                const text = String(row[`answer${i}_ko`] || "").trim();
                const textEn = String(row[`answer${i}_en`] || "").trim();
                if (!text) {
                    throw new Error(`Questions 시트 ${order}번 문항 answer${i}_ko가 비어 있습니다.`);
                }
                const scores = {};
                [1, 2].forEach((index) => {
                    const type = String(row[`answer${i}_type${index}`] || "").trim().toUpperCase();
                    const score = Number(row[`answer${i}_score${index}`] || 0);
                    if (type) {
                        if (!MBTI_TYPES.includes(type)) {
                            throw new Error(`Questions 시트 ${order}번 문항 answer${i}_type${index} 값이 잘못되었습니다.`);
                        }
                        if (!(score > 0)) {
                            throw new Error(`Questions 시트 ${order}번 문항 answer${i}_score${index} 값이 0보다 커야 합니다.`);
                        }
                        scores[type] = (scores[type] || 0) + score;
                    }
                });
                if (!Object.keys(scores).length) {
                    throw new Error(`Questions 시트 ${order}번 문항 answer${i}에 MBTI 점수가 없습니다.`);
                }
                answers.push({ text, textEn, scores });
            }
            return { order, question, questionEn, answers };
        })
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
            question: item.question,
            questionEn: item.questionEn,
            answers: item.answers
        }));
}

function parseExcelResultSettings(rows) {
    const settings = createEmptyResultSettings();
    if (!Array.isArray(rows) || !rows.length) {
        return settings;
    }
    rows.forEach((row) => {
        const mbti = extractMbtiFromResultRow(row);
        if (!MBTI_RESULT_TYPES.includes(mbti)) {
            return;
        }
        settings[mbti] = {
            title: String(findRowValueByHeaderAliases(row, ["title_ko", "titleko", "title"]) || "").trim(),
            titleEn: String(findRowValueByHeaderAliases(row, ["title_en", "titleen"]) || "").trim(),
            content: String(findRowValueByHeaderAliases(row, ["content_ko", "contentko", "content"]) || "").trim(),
            contentEn: String(findRowValueByHeaderAliases(row, ["content_en", "contenten"]) || "").trim(),
            image: String(findRowValueByHeaderAliases(row, ["image_url", "image", "imageurl"]) || "").trim()
        };
    });
    return settings;
}

async function importFromExcelFile(file) {
    if (!window.XLSX) {
        alert("엑셀 파서 로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const normalizeSheetName = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const findSheet = (aliases) => {
        const normalizedAliases = aliases.map((alias) => normalizeSheetName(alias)).filter(Boolean);
        const sheetName = (workbook.SheetNames || []).find((name) => normalizedAliases.includes(normalizeSheetName(name)));
        return sheetName ? workbook.Sheets[sheetName] : null;
    };

    const basicSheet = findSheet(["Basic"]);
    const questionSheet = findSheet(["Questions", "Question"]);
    const resultSheet = findSheet(["Results", "<Results>", "Result"]);

    if (!basicSheet || !questionSheet) {
        throw new Error("엑셀 시트명이 올바르지 않습니다. Basic, Questions 시트를 확인해 주세요.");
    }

    const basicRows = XLSX.utils.sheet_to_json(basicSheet, { defval: "" });
    const questionRows = XLSX.utils.sheet_to_json(questionSheet, { defval: "" });
    const resultRows = resultSheet ? XLSX.utils.sheet_to_json(resultSheet, { defval: "" }) : [];

    if (!basicRows.length) {
        throw new Error("Basic 시트가 비어 있습니다.");
    }

    const basic = basicRows[0];
    const title = String(basic.title_ko || "").trim();
    const cardTitle = String(basic.card_title_ko || "").trim();
    if (!title || !cardTitle) {
        throw new Error("Basic 시트의 title_ko, card_title_ko는 필수입니다.");
    }

    const payload = {
        title,
        titleEn: String(basic.title_en || "").trim(),
        cardTitle,
        cardTitleEn: String(basic.card_title_en || "").trim(),
        navTitle: cardTitle,
        thumbnail: String(basic.thumbnail_url || "").trim(),
        isRecommended: parseBooleanCell(basic.is_recommended, false),
        isPublished: false,
        viewCount: 0,
        questions: parseExcelQuestions(questionRows),
        resultSettings: parseExcelResultSettings(resultRows),
        mbtiDescriptions: {},
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedById: getCurrentAdminId(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdById: getCurrentAdminId()
    };

    payload.mbtiDescriptions = MBTI_RESULT_TYPES.reduce((acc, mbti) => {
        const content = String(payload.resultSettings[mbti].content || "").trim();
        if (content) {
            acc[mbti] = content;
        }
        return acc;
    }, {});

    await db.collection("tests").add(payload);
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
        const seedResultSettings = createEmptyResultSettings();
        MBTI_RESULT_TYPES.forEach((mbti) => {
            seedResultSettings[mbti].title = `${mbti} 유형`;
            seedResultSettings[mbti].content = String(descriptions[mbti] || "");
        });

        await db.collection("tests").add({
            seedKey: DEFAULT_TEST_SEED_KEY,
            title: "MBTI 성격 검사",
            cardTitle: "MBTI 성격 검사",
            navTitle: "MBTI 성격 검사",
            isRecommended: false,
            viewCount: 0,
            thumbnail: "",
            resultSettings: seedResultSettings,
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

        const email = resolveAdminEmailFromLoginId(id);
        if (!isAllowedAdminEmail(email)) {
            setLoginError("허용되지 않은 관리자 계정입니다.");
            return;
        }

        setLoginError("");

        try {
            await auth.signInWithEmailAndPassword(email, pw);
        } catch (error) {
            const code = error && error.code ? error.code : "";
            console.error("Admin login failed:", code, error);
            const defaultAdminEmail = adminEmailFromId(ADMIN_ID).toLowerCase();
            if ((code === "auth/user-not-found" || code === "auth/invalid-credential") && email === defaultAdminEmail && pw === ADMIN_PW) {
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
            if (code === "auth/user-not-found" && isAllowedAdminEmail(email)) {
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

if (excelUploadBtn && excelUploadInputEl) {
    excelUploadBtn.addEventListener("click", () => {
        excelUploadInputEl.click();
    });
    excelUploadInputEl.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        try {
            listStatusEl.textContent = "엑셀 업로드 처리 중...";
            await importFromExcelFile(file);
            listStatusEl.textContent = "엑셀 등록 완료 (기본 숨김 상태)";
            await loadTestList();
        } catch (error) {
            console.error(error);
            alert(`엑셀 등록 실패: ${error.message || "형식을 확인해 주세요."}`);
            listStatusEl.textContent = "엑셀 등록 실패";
        } finally {
            excelUploadInputEl.value = "";
        }
    });
}

if (excelTemplateDownloadEl) {
    excelTemplateDownloadEl.addEventListener("click", (event) => {
        event.preventDefault();
        const workbook = buildExcelTemplateWorkbook();
        if (!workbook || !window.XLSX) {
            alert("엑셀 템플릿을 생성할 수 없습니다.");
            return;
        }
        XLSX.writeFile(workbook, "mbti-test-template.xlsx");
    });
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
        const selectedMbti = resultMbtiSelectEl ? resultMbtiSelectEl.value : state.selectedResultMbti;
        if (!state.resultSettings[selectedMbti]) {
            state.resultSettings[selectedMbti] = { title: "", content: "", image: "", titleEn: "", contentEn: "" };
        }
        state.resultSettings[selectedMbti].image = await toDataUrl(file, 1024);
        resultImagePreviewEl.src = state.resultSettings[selectedMbti].image;
        resultImagePreviewEl.hidden = false;
    });
}

if (addQuestionBtn) {
    addQuestionBtn.addEventListener("click", addQuestion);
}

if (saveTestBtn) {
    saveTestBtn.addEventListener("click", saveTest);
}

if (resultMbtiSelectEl) {
    resultMbtiSelectEl.addEventListener("change", () => {
        commitCurrentResultEditor(state.selectedResultMbti);
        renderResultEditor(resultMbtiSelectEl.value);
    });
}

if (resultTitleInputEl) {
    resultTitleInputEl.addEventListener("input", () => {
        commitCurrentResultEditor();
    });
}

if (resultContentInputEl) {
    resultContentInputEl.addEventListener("input", () => {
        commitCurrentResultEditor();
    });
}

(function init() {
    state.resultSettings = createEmptyResultSettings();
    renderResultEditor(state.selectedResultMbti);
    setQuestionCount(1);

    if (!isAuthReady) {
        setAuthState(false);
        setLoginError("Firebase Auth 설정이 필요합니다. firebase-config.js 값을 확인해 주세요.");
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        const authorized = Boolean(user && isAllowedAdminEmail(user.email));
        setAuthState(authorized);

        if (authorized) {
            setLoginError("");
            await ensureDefaultMbtiTest();
            state.currentPage = 1;
            await loadTestList();
            return;
        }

        if (user && !isAllowedAdminEmail(user.email)) {
            await auth.signOut();
            setLoginError("해당 계정은 관리자 접근 권한이 없습니다.");
        }
    });
})();
