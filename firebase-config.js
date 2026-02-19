(function initFirebase() {
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
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
