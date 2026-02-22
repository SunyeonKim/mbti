const ADMIN_ID = "namu";
const ADMIN_PW = "namu!@#123";
const ADMIN_EMAIL_DOMAIN = "namu-23d3b.firebaseapp.com";
const EXTRA_ADMIN_EMAILS = ["ksn0525@gmail.com"];
const MBTI_TYPES = ["", "E", "I", "N", "S", "T", "F", "J", "P"];
const MBTI_RESULT_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
const PAGE_SIZE = 15;
const DEFAULT_TEST_SEED_KEY = "default-mbti-personality-v1";
const SURFING_TEST_SEED_KEY = "surfing-mbti-youth-v1";
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

function getSurfingSeedQuestions() {
    return [
        {
            question: "파도 미쳤다는 소식 뜨면 네 반응은?",
            answers: [
                { text: "단톡에 \"오늘 출동 가능?\" 바로 쏜다.", scores: { E: 2 } },
                { text: "친한 1~2명에게만 슬쩍 공유한다.", scores: { E: 1, I: 1 } },
                { text: "알림 끄고 혼자 조용히 바다로 간다.", scores: { I: 2 } },
                { text: "아무 말 없이 내 루틴부터 체크한다.", scores: { I: 2 } }
            ]
        },
        {
            question: "오늘 입수 여부를 정하는 기준은?",
            answers: [
                { text: "스웰/풍속/조위 수치부터 본다.", scores: { S: 2 } },
                { text: "수치 확인 후 현장 느낌으로 결정한다.", scores: { S: 1, N: 1 } },
                { text: "파도 결이랑 하늘 톤 보고 감 잡는다.", scores: { N: 2 } },
                { text: "\"오늘 뭔가 될 날\" 직감이 온다.", scores: { N: 2 } }
            ]
        },
        {
            question: "라이딩 영상 다시 볼 때 너는?",
            answers: [
                { text: "프레임 단위로 자세/타이밍 분석한다.", scores: { T: 2 } },
                { text: "영상 분위기랑 표정부터 본다.", scores: { F: 2 } },
                { text: "기술 포인트랑 멘탈 상태 둘 다 본다.", scores: { T: 1, F: 1 } },
                { text: "\"오늘 즐거웠나\" 감정부터 체크한다.", scores: { F: 2 } }
            ]
        },
        {
            question: "서핑 전 준비 스타일은?",
            answers: [
                { text: "전날 체크리스트 완료하고 잔다.", scores: { J: 2 } },
                { text: "큰 계획만 세우고 현장 조정한다.", scores: { J: 1, P: 1 } },
                { text: "아침 기분 보고 포인트 정한다.", scores: { P: 2 } },
                { text: "바다 보이면 그냥 바로 입수한다.", scores: { P: 2 } }
            ]
        },
        {
            question: "서핑샵 첫 방문, 낯선 사람들 가득하면?",
            answers: [
                { text: "초면이어도 먼저 말 건다.", scores: { E: 2 } },
                { text: "분위기 보다가 몇 명과만 대화한다.", scores: { E: 1, I: 1 } },
                { text: "가볍게 인사만 하고 준비한다.", scores: { I: 2 } },
                { text: "조용히 장비 확인부터 한다.", scores: { I: 2 } }
            ]
        },
        {
            question: "새 기술 배울 때 제일 신나는 방식은?",
            answers: [
                { text: "기본 동작을 정확히 반복 연습한다.", scores: { S: 2 } },
                { text: "기본기 익힌 뒤 살짝 응용해본다.", scores: { S: 1, N: 1 } },
                { text: "\"이 동작 이렇게 바꾸면?\" 실험한다.", scores: { N: 2 } },
                { text: "영상 보며 나만의 라인을 상상한다.", scores: { N: 2 } }
            ]
        },
        {
            question: "친구가 연속 와이프아웃으로 멘붕 왔다면?",
            answers: [
                { text: "원인부터 짚고 수정 포인트를 준다.", scores: { T: 2 } },
                { text: "괜찮다고 공감해주며 마음부터 잡아준다.", scores: { F: 2 } },
                { text: "피드백 주면서 동시에 응원도 한다.", scores: { T: 1, F: 1 } },
                { text: "일단 쉬자고 하고 텐션 회복시킨다.", scores: { F: 2 } }
            ]
        },
        {
            question: "한 달 서핑 루틴은 보통?",
            answers: [
                { text: "주 n회 고정 루틴으로 간다.", scores: { J: 2 } },
                { text: "주간 목표만 정하고 유동적으로 탄다.", scores: { J: 1, P: 1 } },
                { text: "날씨 좋을 때 몰아서 탄다.", scores: { P: 2 } },
                { text: "계획표는 있는데 거의 즉흥이다.", scores: { P: 2 } }
            ]
        },
        {
            question: "오늘 라이딩 올릴 때 SNS 스타일은?",
            answers: [
                { text: "릴스 편집해서 다같이 태그한다.", scores: { E: 2 } },
                { text: "하이라이트만 친한 사람에게 공유한다.", scores: { E: 1, I: 1 } },
                { text: "기록은 남기되 공개는 안 한다.", scores: { I: 2 } },
                { text: "애초에 폰을 안 꺼낸다.", scores: { I: 2 } }
            ]
        },
        {
            question: "새 보드 고를 때 제일 먼저 보는 건?",
            answers: [
                { text: "스펙표와 실제 리뷰 데이터.", scores: { S: 2 } },
                { text: "스펙도 보고 디자인도 본다.", scores: { S: 1, N: 1 } },
                { text: "브랜드 스토리와 감성 무드.", scores: { N: 2 } },
                { text: "\"이건 내 보드다\" 느낌.", scores: { N: 2 } }
            ]
        },
        {
            question: "팀 약속 시간에 지각 이슈가 생기면?",
            answers: [
                { text: "규칙을 먼저 재정리한다.", scores: { T: 2 } },
                { text: "사정을 듣고 감정을 먼저 살핀다.", scores: { F: 2 } },
                { text: "원칙 설명 + 배려를 같이 챙긴다.", scores: { T: 1, F: 1 } },
                { text: "오늘은 웃고 넘기자고 한다.", scores: { F: 2 } }
            ]
        },
        {
            question: "서핑 여행 가면 네 일정표는?",
            answers: [
                { text: "시간대별 입수 계획까지 다 짠다.", scores: { J: 2 } },
                { text: "핵심 스팟만 정하고 유연하게 움직인다.", scores: { J: 1, P: 1 } },
                { text: "현지 컨디션 보고 즉흥 선택한다.", scores: { P: 2 } },
                { text: "길 가다 끌리는 해변에서 바로 탄다.", scores: { P: 2 } }
            ]
        },
        {
            question: "오늘 파도 피드백을 남긴다면?",
            answers: [
                { text: "수치와 체감을 구분해서 기록한다.", scores: { S: 2 } },
                { text: "수치 + 인사이트를 함께 메모한다.", scores: { S: 1, N: 1 } },
                { text: "느낌/장면 중심으로 감성 기록한다.", scores: { N: 2 } },
                { text: "이 경험이 미래에 줄 변화부터 쓴다.", scores: { N: 2 } }
            ]
        },
        {
            question: "대회 참가를 고민할 때 너의 기준은?",
            answers: [
                { text: "성장 효율과 기록 개선 가능성.", scores: { T: 2 } },
                { text: "함께 도전할 사람과 분위기.", scores: { F: 2 } },
                { text: "성과도 관계도 둘 다 중요하다.", scores: { T: 1, F: 1 } },
                { text: "일단 재밌어 보이면 도전한다.", scores: { F: 2 } }
            ]
        },
        {
            question: "일출 서핑 제안이 새벽에 오면?",
            answers: [
                { text: "모닝콜 돌리고 멤버들 소집한다.", scores: { E: 2 } },
                { text: "딱 1~2명에게만 연락한다.", scores: { E: 1, I: 1 } },
                { text: "조용히 준비해서 혼자 출발한다.", scores: { I: 2 } },
                { text: "말 없이 파도 소리 들으러 간다.", scores: { I: 2 } }
            ]
        }
    ];
}

function createSurfingSeedResultSettings() {
    const settings = createEmptyResultSettings();

    function buildContent(title, summary, interpretation, pros, cons, matchFirst, matchSecond) {
        const interpretationHtml = interpretation.map((line) => `<p>${line}</p>`).join("\n");
        const prosHtml = pros.map((item) => `<li>${item}</li>`).join("");
        const consHtml = cons.map((item) => `<li>${item}</li>`).join("");

        return `${title}

<h3>한 줄 요약</h3>
<p>${summary}</p>

<h4>유형 해석</h4>
${interpretationHtml}

<h4>장점</h4>
<ul>
${prosHtml}
</ul>

<h4>단점</h4>
<ul>
${consHtml}
</ul>

<h4>나와 잘 맞는 유형</h4>
<p><strong>1위 : ${matchFirst.title}</strong><br>
- ${matchFirst.points[0]}<br>
- ${matchFirst.points[1]}<br>
- ${matchFirst.points[2]}
</p>

<p><strong>2위 : ${matchSecond.title}</strong><br>
- ${matchSecond.points[0]}<br>
- ${matchSecond.points[1]}<br>
- ${matchSecond.points[2]}
</p>`;
    }

    const templates = {
        INTJ: {
            title: "<h2>당신은 INTJ : 전략 라인 설계 서퍼 📊🧠</h2>",
            summary: "파도도 계획대로 태우는 설계형.",
            interpretation: ["입수 전 이미 머릿속에서 시뮬레이션이 끝납니다.", "컨디션, 조류, 라인까지 체계적으로 계산합니다.", "예측이 맞아떨어질 때 가장 큰 쾌감을 느낍니다."],
            pros: ["장기 성장 플랜이 탄탄함", "문제 원인 분석이 빠름", "훈련 효율이 높음", "자기 통제가 강함"],
            cons: ["즉흥 상황에 경직될 수 있음", "재미보다 성과에 치우침", "완벽주의로 피로 누적"],
            match: "서핑 메이트",
            first: { title: "ENFP : 바이브 폭발 서퍼 🌈", points: ["재미 지수를 올려줌", "고정 사고를 깨줌", "감정 밸런스를 맞춰줌"] },
            second: { title: "ESFP : 비치 페스티벌러 서퍼 🎉", points: ["현장 텐션 상승", "실전 적응력 보완", "휴식도 즐기게 만듦"] }
        },
        INTP: {
            title: "<h2>당신은 INTP : 파도 연구소 서퍼 🧪🌊</h2>",
            summary: "서핑도 결국 끝없는 실험.",
            interpretation: ["한 번 탄 파도를 그냥 넘기지 않고 패턴을 분석합니다.", "기술 디테일을 파고들수록 더 재미를 느낍니다.", "혼자 몰입할 때 실력이 급상승하는 타입입니다."],
            pros: ["원리 이해가 깊음", "새 기술 학습 속도가 빠름", "문제 해결 아이디어가 많음", "객관적 자기 피드백 가능"],
            cons: ["생각이 과해 실행이 늦어질 수 있음", "루틴 유지력이 떨어질 수 있음", "감정 표현이 적어 오해받기 쉬움"],
            match: "서핑 메이트",
            first: { title: "ENFJ : 크루 부스터 서퍼 🤝", points: ["실행 동력을 끌어줌", "소통을 부드럽게 만듦", "현장 연결감을 강화"] },
            second: { title: "ESFJ : 선셋 케어메이트 서퍼 🌅", points: ["생활 리듬 관리 보완", "팀 적응을 도와줌", "지속 루틴을 잡아줌"] }
        },
        ENTJ: {
            title: "<h2>당신은 ENTJ : 스웰 프로젝트 리더 서퍼 🚀📈</h2>",
            summary: "파도 위에서도 목표 달성형.",
            interpretation: ["목표를 수치로 설정하고 실행 속도를 높입니다.", "팀에서도 자연스럽게 방향을 정리하는 리더입니다.", "결과를 만드는 구조를 만드는 데 강합니다."],
            pros: ["결단력과 추진력이 강함", "계획 수립 능력이 뛰어남", "성과 중심 실행이 빠름", "팀 운영 감각이 좋음"],
            cons: ["속도 차이로 주변을 압박할 수 있음", "실패 허용 범위가 좁을 수 있음", "휴식보다 성과를 우선함"],
            match: "서핑 메이트",
            first: { title: "INFP : 무드 파도 시인 서퍼 🎧", points: ["감정적 완충 작용", "과열된 목표를 조절", "즐거움의 의미를 상기"] },
            second: { title: "ISFP : 감성 글라이더 서퍼 🫧", points: ["현재 감각을 확장", "유연성을 더해줌", "강한 텐션을 부드럽게 완화"] }
        },
        ENTP: {
            title: "<h2>당신은 ENTP : 트릭 실험실 서퍼 ⚡🌀</h2>",
            summary: "새로운 라인을 찾아 계속 변주.",
            interpretation: ["익숙한 방식보다 새로운 시도를 더 즐깁니다.", "현장에서 아이디어가 즉석으로 쏟아집니다.", "틀을 깨는 플레이에서 존재감이 크게 드러납니다."],
            pros: ["창의적 문제 해결이 뛰어남", "적응력과 순발력이 좋음", "도전 의지가 강함", "분위기를 빠르게 끌어올림"],
            cons: ["지속 루틴이 약해질 수 있음", "마무리 집중력이 떨어질 수 있음", "리스크 관리가 느슨할 수 있음"],
            match: "서핑 메이트",
            first: { title: "ISTJ : 루틴 마스터 서퍼 🗂️", points: ["실행 구조를 잡아줌", "과감함에 안정성을 추가", "완성도를 높여줌"] },
            second: { title: "ISFJ : 세이프 가디언 서퍼 🛟", points: ["안전 감각을 보완", "지속 페이스를 유지", "실전 실수를 줄여줌"] }
        },
        INFJ: {
            title: "<h2>당신은 INFJ : 감각 큐레이터 서퍼 🌙🔮</h2>",
            summary: "파도와 마음의 결을 함께 읽는 타입.",
            interpretation: ["서핑을 단순한 스포츠보다 의미 있는 경험으로 받아들입니다.", "상대의 분위기와 현장 흐름을 섬세하게 감지합니다.", "깊이 있는 몰입으로 안정적인 성장 곡선을 만듭니다."],
            pros: ["통찰력과 공감 능력이 높음", "집중 몰입이 깊음", "섬세한 피드백이 가능", "장기적 비전을 잘 봄"],
            cons: ["감정 소모가 누적되기 쉬움", "완벽한 타이밍을 기다리다 기회를 놓칠 수 있음", "혼자 감당하려는 경향"],
            match: "서핑 메이트",
            first: { title: "ENTP : 트릭 실험실 서퍼 ⚡", points: ["새로운 시도를 자극", "과한 고민을 행동으로 전환", "유쾌한 에너지를 공급"] },
            second: { title: "ESTP : 파도 액션 스타터 서퍼 🏄", points: ["즉시 실행력을 보완", "현장 대처 속도 향상", "과몰입을 가볍게 풀어줌"] }
        },
        INFP: {
            title: "<h2>당신은 INFP : 무드 파도 시인 서퍼 🎧🌊</h2>",
            summary: "파도를 타며 마음의 문장을 쓰는 타입.",
            interpretation: ["그날의 감정과 파도 결을 연결해 기억합니다.", "의미가 느껴지는 순간에 폭발적인 몰입을 합니다.", "자기만의 스타일이 분명한 창작형 서퍼입니다."],
            pros: ["감수성이 풍부함", "자기 동기 부여가 깊음", "개성 있는 스타일 구축", "타인의 감정을 잘 이해함"],
            cons: ["기분 영향으로 기복이 생길 수 있음", "현실 루틴 관리가 약할 수 있음", "비교에 민감해질 수 있음"],
            match: "서핑 메이트",
            first: { title: "ENTJ : 스웰 프로젝트 리더 서퍼 📈", points: ["목표 설정을 명확히 도움", "실행력을 안정화", "성장 지표를 만들어줌"] },
            second: { title: "ESTJ : 타임어택 매니저 서퍼 ⏱️", points: ["생활 루틴을 잡아줌", "훈련 지속성을 강화", "현실 관리 부담을 줄임"] }
        },
        ENFJ: {
            title: "<h2>당신은 ENFJ : 크루 부스터 서퍼 🤝🌟</h2>",
            summary: "팀 분위기와 성장 둘 다 챙기는 타입.",
            interpretation: ["함께 타는 사람들의 에너지를 빠르게 끌어올립니다.", "누가 지쳤는지 먼저 알아채고 동기를 살려줍니다.", "관계와 성장을 동시에 끌고 가는 조율 능력이 강합니다."],
            pros: ["리더십과 공감이 균형적", "팀 시너지를 잘 만듦", "동기 부여 능력이 좋음", "갈등 중재에 강함"],
            cons: ["타인 감정에 과몰입할 수 있음", "자기 회복 시간을 놓치기 쉬움", "거절이 어려워 과부하 위험"],
            match: "서핑 메이트",
            first: { title: "INTP : 파도 연구소 서퍼 🧪", points: ["분석 깊이를 더해줌", "감정-논리 균형 강화", "장기 전략을 정교화"] },
            second: { title: "ISTP : 실전 테크니션 서퍼 🔧", points: ["현장 기술 보완", "간결한 피드백 제공", "실전 실행력을 높임"] }
        },
        ENFP: {
            title: "<h2>당신은 ENFP : 바이브 폭발 서퍼 🌈🔥</h2>",
            summary: "파도도 사람도 신나게 만드는 에너자이저.",
            interpretation: ["새로운 스팟과 경험에서 에너지를 얻습니다.", "감정 표현이 풍부해 주변 텐션을 끌어올립니다.", "재미와 성장의 연결점을 빠르게 찾아냅니다."],
            pros: ["적응력과 친화력이 높음", "창의적 분위기 메이커", "도전 의지가 강함", "회복 탄력성이 좋음"],
            cons: ["루틴이 흐트러질 수 있음", "우선순위가 자주 바뀔 수 있음", "집중력이 분산되기 쉬움"],
            match: "서핑 메이트",
            first: { title: "INTJ : 전략 라인 설계 서퍼 📊", points: ["아이디어를 구조화", "실행 우선순위 정리", "성장 속도를 안정화"] },
            second: { title: "ISTJ : 루틴 마스터 서퍼 🗂️", points: ["일상 루틴 보완", "마감 관리 강화", "장기 지속력을 확보"] }
        },
        ISTJ: {
            title: "<h2>당신은 ISTJ : 루틴 마스터 서퍼 🗂️🌊</h2>",
            summary: "꾸준함으로 실력을 증명하는 타입.",
            interpretation: ["기본기와 반복 훈련을 가장 신뢰합니다.", "작은 개선을 쌓아 확실한 변화를 만듭니다.", "안전과 효율을 동시에 챙기는 현실형 서퍼입니다."],
            pros: ["성실하고 안정적인 루틴", "디테일 관리 능력이 뛰어남", "재현 가능한 퍼포먼스", "책임감이 강함"],
            cons: ["변화 대응이 느릴 수 있음", "새 시도를 주저할 수 있음", "유연성이 부족해 보일 수 있음"],
            match: "서핑 메이트",
            first: { title: "ENTP : 트릭 실험실 서퍼 ⚡", points: ["새로운 관점을 제공", "변화 적응력을 높임", "즐거운 도전을 유도"] },
            second: { title: "ENFP : 바이브 폭발 서퍼 🌈", points: ["현장 에너지를 보완", "과한 긴장을 완화", "다양한 경험 폭을 확장"] }
        },
        ISFJ: {
            title: "<h2>당신은 ISFJ : 세이프 가디언 서퍼 🛟💙</h2>",
            summary: "안전과 배려로 팀을 지키는 타입.",
            interpretation: ["현장 리스크를 먼저 읽고 모두를 챙깁니다.", "작은 변화도 놓치지 않는 세심함이 강점입니다.", "안정적인 분위기 속에서 실력이 꾸준히 오릅니다."],
            pros: ["안전 감각이 뛰어남", "팀 케어 능력이 우수함", "꾸준한 실행력이 높음", "신뢰를 잘 쌓음"],
            cons: ["자기 욕구를 뒤로 미룰 수 있음", "새 환경에서 긴장할 수 있음", "과한 책임감으로 피로 누적"],
            match: "서핑 메이트",
            first: { title: "ESTP : 파도 액션 스타터 서퍼 🏄", points: ["실전 자신감을 높임", "즉흥 대응력을 강화", "도전 반경을 넓혀줌"] },
            second: { title: "ENTP : 트릭 실험실 서퍼 🌀", points: ["고정 루틴에 신선함 추가", "아이디어 폭 확장", "새로운 재미를 제공"] }
        },
        ESTJ: {
            title: "<h2>당신은 ESTJ : 타임어택 매니저 서퍼 ⏱️📋</h2>",
            summary: "관리력으로 성장을 가속하는 타입.",
            interpretation: ["목표, 일정, 실행을 빠르게 구조화합니다.", "실행 체크가 분명해 팀 전체 효율도 올라갑니다.", "결과를 만드는 운영형 서퍼의 강점을 보입니다."],
            pros: ["운영/관리 능력이 탁월함", "실행 속도와 완수율이 높음", "책임감 있는 리딩", "현실적인 판단이 빠름"],
            cons: ["완급 조절이 어려울 수 있음", "느린 페이스를 답답해할 수 있음", "유연한 실험을 놓치기 쉬움"],
            match: "서핑 메이트",
            first: { title: "ISFP : 감성 글라이더 서퍼 🫧", points: ["여유와 감각을 더해줌", "강한 통제를 완화", "현재 순간 몰입을 강화"] },
            second: { title: "INFP : 무드 파도 시인 서퍼 🎧", points: ["감정적 공감 폭 확장", "목표의 의미를 보완", "팀 분위기를 부드럽게 조정"] }
        },
        ESFJ: {
            title: "<h2>당신은 ESFJ : 선셋 케어메이트 서퍼 🌅🤗</h2>",
            summary: "모두가 즐거운 세션을 만드는 타입.",
            interpretation: ["함께의 온도를 중요하게 생각하는 팀 플레이어입니다.", "현장 분위기를 세심하게 조율해 안정감을 만듭니다.", "관계 중심이지만 실행력도 꾸준히 유지합니다."],
            pros: ["팀워크 형성 능력이 뛰어남", "소통이 부드럽고 빠름", "배려와 실행을 함께 챙김", "현장 분위기 관리에 강함"],
            cons: ["평가에 민감해질 수 있음", "과한 배려로 에너지 소모", "우선순위를 타인에게 맞출 수 있음"],
            match: "서핑 메이트",
            first: { title: "INTP : 파도 연구소 서퍼 🧪", points: ["분석 기반 시각을 보완", "의사결정 객관성 강화", "기술 개선 포인트를 명확화"] },
            second: { title: "INTJ : 전략 라인 설계 서퍼 📊", points: ["장기 전략을 정돈", "우선순위 설정을 지원", "실행 체계를 탄탄하게 보강"] }
        },
        ISTP: {
            title: "<h2>당신은 ISTP : 실전 테크니션 서퍼 🔧🌊</h2>",
            summary: "말보다 기술로 증명하는 타입.",
            interpretation: ["현장에서 몸으로 배우고 바로 적용합니다.", "위기 상황에서도 침착하게 대응합니다.", "간결하고 정확한 피드백으로 실력을 끌어올립니다."],
            pros: ["실전 대처 능력이 뛰어남", "기술 습득이 빠름", "문제 해결이 현실적", "침착함이 강점"],
            cons: ["감정 표현이 적어 거리감이 생길 수 있음", "장기 계획을 미루기 쉬움", "반복 루틴을 지루해할 수 있음"],
            match: "서핑 메이트",
            first: { title: "ENFJ : 크루 부스터 서퍼 🤝", points: ["소통 연결을 강화", "팀 호흡을 부드럽게 조정", "정서적 회복력을 보완"] },
            second: { title: "ESFJ : 선셋 케어메이트 서퍼 🌅", points: ["생활 리듬을 안정화", "협업 스트레스를 완화", "지속 가능한 페이스 구축"] }
        },
        ISFP: {
            title: "<h2>당신은 ISFP : 감성 글라이더 서퍼 🫧🎨</h2>",
            summary: "느낌 좋은 라인을 예술처럼 타는 타입.",
            interpretation: ["현재 순간의 감각을 섬세하게 읽어냅니다.", "스타일과 무드가 분명해 개성이 강하게 드러납니다.", "무리하지 않는 자연스러운 성장이 특징입니다."],
            pros: ["감각적 표현이 뛰어남", "현장 몰입도가 높음", "유연한 대응이 가능", "개성 있는 스타일 구축"],
            cons: ["체계적 기록이 부족할 수 있음", "컨디션에 영향을 크게 받을 수 있음", "목표 설정이 느슨해질 수 있음"],
            match: "서핑 메이트",
            first: { title: "ESTJ : 타임어택 매니저 서퍼 ⏱️", points: ["루틴과 목표를 보완", "실행 일정을 구체화", "성장 추적을 도와줌"] },
            second: { title: "ENTJ : 스웰 프로젝트 리더 서퍼 🚀", points: ["도전 범위를 확장", "성과 지표를 선명화", "실행 추진력을 강화"] }
        },
        ESTP: {
            title: "<h2>당신은 ESTP : 파도 액션 스타터 서퍼 🏄🔥</h2>",
            summary: "현장에서 바로 터지는 실전형.",
            interpretation: ["상황 판단이 빠르고 행동 전환이 즉각적입니다.", "변수 많은 세션에서 오히려 강해지는 타입입니다.", "도전적이고 과감한 플레이로 흐름을 이끕니다."],
            pros: ["순발력과 담력이 좋음", "실전 적응력이 매우 높음", "현장 분위기를 살림", "결정이 빠름"],
            cons: ["리스크를 과소평가할 수 있음", "세밀한 계획이 부족할 수 있음", "반복 훈련을 건너뛸 수 있음"],
            match: "서핑 메이트",
            first: { title: "ISFJ : 세이프 가디언 서퍼 🛟", points: ["안전 밸런스를 보완", "페이스 조절을 지원", "안정적 성장 기반 제공"] },
            second: { title: "INFJ : 감각 큐레이터 서퍼 🔮", points: ["깊이 있는 복기를 도와줌", "감정 소진을 조절", "플레이 의미를 확장"] }
        },
        ESFP: {
            title: "<h2>당신은 ESFP : 비치 페스티벌러 서퍼 🎉🌞</h2>",
            summary: "바다를 축제로 만드는 분위기 메이커.",
            interpretation: ["사람과 파도, 음악이 만나면 에너지가 최고조가 됩니다.", "즉흥적인 센스로 현장 분위기를 끌어올립니다.", "즐기는 힘이 강해서 회복 탄력성이 높습니다."],
            pros: ["친화력과 현장 에너지가 높음", "적응이 빠르고 유연함", "팀 사기를 끌어올림", "스트레스 회복이 빠름"],
            cons: ["장기 계획이 약해질 수 있음", "집중 유지가 흔들릴 수 있음", "흥미 중심 선택이 늘어날 수 있음"],
            match: "서핑 메이트",
            first: { title: "INTJ : 전략 라인 설계 서퍼 📊", points: ["계획적 성장 구조 보완", "우선순위 설정 지원", "성과 추적 습관 형성"] },
            second: { title: "ISTJ : 루틴 마스터 서퍼 🗂️", points: ["지속 루틴을 안정화", "기본기 누적을 강화", "실수 반복을 줄여줌"] }
        }
    };

    MBTI_RESULT_TYPES.forEach((mbti) => {
        const item = templates[mbti];
        if (!item) {
            return;
        }
        settings[mbti].title = item.title;
        settings[mbti].content = buildContent(
            item.title,
            item.summary,
            item.interpretation,
            item.pros,
            item.cons,
            item.first,
            item.second
        );
    });

    return settings;
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

async function ensureSurfingMbtiTest() {
    if (!isAuthReady) {
        return;
    }

    const seedQuestions = getSurfingSeedQuestions();
    if (seedQuestions.length !== 15) {
        return;
    }

    try {
        const existing = await db.collection("tests").where("seedKey", "==", SURFING_TEST_SEED_KEY).limit(1).get();
        if (!existing.empty) {
            return;
        }

        const seedResultSettings = createSurfingSeedResultSettings();
        const mbtiDescriptions = MBTI_RESULT_TYPES.reduce((acc, mbti) => {
            const content = String(seedResultSettings[mbti] && seedResultSettings[mbti].content || "").trim();
            if (content) {
                acc[mbti] = content;
            }
            return acc;
        }, {});

        await db.collection("tests").add({
            seedKey: SURFING_TEST_SEED_KEY,
            title: "서핑 MBTI 테스트",
            cardTitle: "서핑 MBTI 테스트",
            navTitle: "나는 어떤 서퍼일까?",
            isRecommended: true,
            viewCount: 0,
            thumbnail: "",
            resultSettings: seedResultSettings,
            questions: seedQuestions,
            mbtiDescriptions,
            isPublished: true,
            createdById: ADMIN_ID,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("서핑 MBTI 테스트 자동 등록 실패:", error);
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
            await ensureSurfingMbtiTest();
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
