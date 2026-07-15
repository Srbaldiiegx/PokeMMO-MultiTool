let authMode = 'login';

function setAuthMode(mode) {
    authMode = mode;
    const isRegister = mode === 'register';
    document.getElementById('auth-title').textContent = isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo';
    document.getElementById('auth-description').textContent = isRegister ? 'Guarda y administra tus shinies desde cualquier dispositivo.' : 'Inicia sesión para acceder a tu PokeMMO Toolkit.';
    document.getElementById('auth-name-group').hidden = !isRegister;
    document.getElementById('auth-submit-btn').textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
    document.getElementById('auth-switch-text').textContent = isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?';
    document.getElementById('auth-switch-btn').textContent = isRegister ? 'Inicia sesión' : 'Regístrate';
    document.getElementById('auth-error').textContent = '';
}

function updateAuthUI() {
    const gate = document.getElementById('auth-gate');
    const app = document.getElementById('app-shell');
    const status = document.getElementById('auth-status');
    const user = window.currentUser;
    if (!gate || !app || !status) return;

    gate.hidden = Boolean(user);
    app.hidden = !user;
    if (!user) return;

    document.getElementById('auth-avatar').src = user.photoURL || 'https://play.pokemmo.com/media/sprites/trainer/front/1.png';
    document.getElementById('auth-name').textContent = user.displayName || user.email;
    document.getElementById('auth-role').textContent = window.isAdmin ? 'Administrador' : 'Entrenador';
    document.getElementById('auth-role').classList.toggle('is-admin', window.isAdmin);
}

function getAuthErrorMessage(error) {
    const messages = {
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/email-already-in-use': 'Este correo ya tiene una cuenta.',
        'auth/invalid-email': 'Introduce un correo válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/operation-not-allowed': 'El acceso con correo y contraseña no está activado en Firebase Authentication.',
        'auth/user-disabled': 'Esta cuenta ha sido desactivada.',
        'auth/too-many-requests': 'Se han hecho demasiados intentos. Espera unos minutos antes de probar de nuevo.',
        'auth/network-request-failed': 'No se pudo conectar con Firebase. Comprueba tu conexión e inténtalo de nuevo.',
        'auth/unauthorized-domain': 'Este dominio no está autorizado para iniciar sesión. Añádelo en Firebase Authentication.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el acceso.'
    };
    return messages[error.code] || 'No se pudo completar la operación. Inténtalo otra vez.';
}

document.addEventListener('DOMContentLoaded', () => {
    const submit = document.getElementById('auth-submit-btn');
    const googleButton = document.getElementById('google-login-btn');
    const error = document.getElementById('auth-error');
    const setFirebaseReady = () => {
        submit.disabled = false;
        googleButton.disabled = false;
        error.textContent = '';
    };

    // Los módulos de Firebase se cargan de forma diferida. Evitamos que el
    // usuario envíe el formulario antes de que sus funciones estén disponibles.
    submit.disabled = true;
    googleButton.disabled = true;
    error.textContent = 'Conectando con el servicio de inicio de sesión…';
    if (window.firebaseReady) setFirebaseReady();
    else document.addEventListener('firebase-ready', setFirebaseReady, { once: true });
    window.setTimeout(() => {
        if (!window.firebaseReady) {
            error.textContent = 'No se pudo cargar Firebase. Comprueba que publicas la web mediante HTTPS y que tu red no bloquea www.gstatic.com.';
        }
    }, 10000);

    document.getElementById('auth-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name-input').value.trim();
        error.textContent = '';
        submit.disabled = true;
        submit.textContent = 'Un momento…';
        try {
            if (authMode === 'register') await window.registerWithEmail(name, email, password);
            else await window.signInWithEmail(email, password);
        } catch (authError) {
            error.textContent = getAuthErrorMessage(authError);
        } finally {
            submit.disabled = false;
            submit.textContent = authMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión';
        }
    });

    document.getElementById('google-login-btn').addEventListener('click', async () => {
        try { await window.signInWithGoogle(); }
        catch (authError) { document.getElementById('auth-error').textContent = getAuthErrorMessage(authError); }
    });
    document.getElementById('auth-switch-btn').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
    document.getElementById('logout-btn').addEventListener('click', () => window.signOutUser());
    updateAuthUI();
});

document.addEventListener('auth-state-changed', () => {
    updateAuthUI();
    if (window.renderShowcase) window.renderShowcase();
    if (window.syncSelectOptions) window.syncSelectOptions();
});
