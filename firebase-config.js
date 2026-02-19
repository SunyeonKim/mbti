(function initFirebase() {
    const decodedApiKey = "AIzaSyBQWaEiX73jZ0E_jzVwaVXvrcr0DfpZ-_E";

    const firebaseConfig = {
        apiKey: decodedApiKey,
        authDomain: "namu-23d3b.firebaseapp.com",
        projectId: "namu-23d3b",
        storageBucket: "namu-23d3b.firebasestorage.app",
        messagingSenderId: "1038810127268",
        appId: "1:1038810127268:web:db9557db07fb123723bf31",
        measurementId: "G-DEQLP1MTH9"
    };

    const isConfigured = Object.values(firebaseConfig).every((value) => (
        typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_")
    ));

    let db = null;
    let auth = null;

    try {
        if (typeof firebase !== "undefined") {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            if (typeof firebase.auth === "function") {
                auth = firebase.auth();
            }
            db = firebase.firestore();
        }
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
    }

    window.firebaseServices = {
        db,
        auth,
        isConfigured
    };
})();
