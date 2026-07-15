import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQimdGIIOu-blPbtU63MrGPpMbDwMAgGw",
    authDomain: "pokemmo-tool.firebaseapp.com",
    databaseURL: "https://pokemmo-tool-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pokemmo-tool",
    storageBucket: "pokemmo-tool.firebasestorage.app",
    messagingSenderId: "873669256817",
    appId: "1:873669256817:web:702da03a997cd809355dd0",
    measurementId: "G-ZV2HPTFDJ5"
};

const ADMIN_EMAIL = "diegoasti13@gmail.com";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

window.firebaseShowcaseRef = ref(db, "showcaseData");
window.firebaseRef = ref;
window.firebaseDb = db;
window.firebaseSet = set;
window.firebaseOnValue = onValue;
window.currentUser = null;
window.isAdmin = false;
window.firebaseReady = true;
document.dispatchEvent(new CustomEvent("firebase-ready"));

function applyAuthState(user) {
    window.currentUser = user;
    window.isAdmin = Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);

    // El acceso puede completarse antes de que otros scripts procesen el evento.
    // Actualizamos la puerta visual aquí mismo para no obligar a recargar la página.
    const gate = document.getElementById('auth-gate');
    const appShell = document.getElementById('app-shell');
    if (gate && appShell) {
        gate.hidden = Boolean(user);
        appShell.hidden = !user;
    }

    document.dispatchEvent(new CustomEvent("auth-state-changed", { detail: user }));
}

window.signInWithGoogle = async () => {
    const credential = await signInWithPopup(auth, provider);
    applyAuthState(credential.user);
    return credential;
};

window.signInWithEmail = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    applyAuthState(credential.user);
    return credential;
};

window.registerWithEmail = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    applyAuthState(auth.currentUser);
};

window.signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("No se pudo cerrar la sesión:", error);
    }
};

onAuthStateChanged(auth, (user) => {
    applyAuthState(user);
});
