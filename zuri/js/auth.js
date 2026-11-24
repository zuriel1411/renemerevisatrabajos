import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, signOut, GoogleAuthProvider, signInWithPopup,
  signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber,
  getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const statusBox = $("status");
let mode = "login";
let confirmation = null;
let recaptcha = null;
let recaptchaReady = false;
let auth = null;
let busy = false;

function showStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status show ${type}`;
}
function clearStatus() { statusBox.textContent = ""; statusBox.className = "status"; }
function setBusy(value) {
  busy = value;
  document.querySelectorAll("button").forEach(button => { button.disabled = value; });
  document.querySelector(".layout").classList.toggle("busy", value);
  if (!value) {
    $("tabLogin").disabled = false;
    $("tabRegister").disabled = false;
  }
}
function friendlyError(error) {
  const messages = {
    "auth/invalid-email": "El correo no tiene un formato válido.",
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Intenta iniciar sesión.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con esos datos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Se alcanzó el límite de intentos. Espera un momento y vuelve a intentarlo.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
    "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication.",
    "auth/operation-not-allowed": "Este método de acceso todavía no está habilitado en Firebase Console.",
    "auth/invalid-phone-number": "El número no es válido. Incluye el código de país, por ejemplo +52.",
    "auth/too-many-requests": "Se alcanzó el límite de solicitudes. Espera antes de intentarlo de nuevo.",
    "auth/captcha-check-failed": "No se pudo validar reCAPTCHA. Recarga la página e inténtalo otra vez.",
    "auth/invalid-verification-code": "El código SMS no es correcto.",
    "auth/code-expired": "El código SMS venció. Solicita uno nuevo.",
    "auth/network-request-failed": "No hay conexión o el navegador bloqueó la solicitud. Revisa tu internet."
  };
  return messages[error?.code] || `No se pudo completar el acceso (${error?.code || "error"}). Revisa la configuración de Firebase.`;
}
function setMode(next) {
  if (busy) return;
  mode = next;
  clearStatus();
  $("tabLogin").classList.toggle("active", mode === "login");
  $("tabRegister").classList.toggle("active", mode === "register");
  $("tabLogin").setAttribute("aria-selected", String(mode === "login"));
  $("tabRegister").setAttribute("aria-selected", String(mode === "register"));
  $("formTitle").textContent = mode === "login" ? "Iniciar sesión" : "Crear cuenta";
  $("formSubtitle").textContent = mode === "login" ? "Ingresa con tu correo y contraseña." : "Registra tu correo para crear tu cuenta.";
  $("emailSubmit").innerHTML = mode === "login" ? 'Iniciar sesión <i class="bi bi-arrow-right"></i>' : 'Crear cuenta <i class="bi bi-arrow-right"></i>';
  $("emailHint").textContent = mode === "login"
    ? "En el inicio de sesión se exige que tu correo ya esté verificado."
    : "Firebase enviará un enlace de verificación a tu correo después del registro.";
  $("phoneTitle").textContent = mode === "login" ? "Iniciar con celular" : "Registrarse con celular";
  $("phoneDescription").textContent = mode === "login"
    ? "Escribe tu número. Firebase enviará un código SMS para comprobar que tienes acceso a ese celular."
    : "Escribe tu número. Firebase enviará un código SMS para verificarlo y crear tu cuenta.";
  confirmation = null;
  $("codeArea").classList.add("hidden");
}
$("tabLogin").addEventListener("click", () => setMode("login"));
$("tabRegister").addEventListener("click", () => setMode("register"));
$("togglePassword").addEventListener("click", () => {
  const input = $("password");
  const visible = input.type === "password";
  input.type = visible ? "text" : "password";
  $("togglePassword").innerHTML = visible ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  $("togglePassword").setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
});

const configured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY" && firebaseConfig.projectId && firebaseConfig.projectId !== "TU_PROJECT_ID";
if (!configured) {
  showStatus("Firebase aún no está configurado. Abre js/firebase-config.js, agrega la configuración real de tu proyecto y habilita Email/Password, Google, Teléfono y acceso anónimo en Authentication.", "error");
  ["emailSubmit", "googleBtn", "phoneBtn", "guestBtn", "sendSms", "verifySms"].forEach(id => { $(id).disabled = true; });
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.languageCode = "es";

    $("emailForm").addEventListener("submit", async event => {
      event.preventDefault();
      if (busy) return;
      clearStatus();
      const email = $("email").value.trim();
      const password = $("password").value;
      if (!email || !password) { showStatus("Completa tu correo y contraseña.", "error"); return; }
      if (password.length < 6) { showStatus("La contraseña debe tener al menos 6 caracteres.", "error"); return; }
      setBusy(true);
      try {
        if (mode === "register") {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(result.user);
          await signOut(auth);
          showStatus("Registro iniciado correctamente. Te enviamos un enlace de verificación; confirma tu correo antes de iniciar sesión.", "ok");
          $("password").value = "";
        } else {
          const result = await signInWithEmailAndPassword(auth, email, password);
          if (!result.user.emailVerified) {
            await sendEmailVerification(result.user);
            await signOut(auth);
            showStatus("Tu correo todavía no está verificado. Te enviamos un nuevo enlace. Confírmalo y vuelve a iniciar sesión.", "error");
            return;
          }
          showStatus("Inicio de sesión correcto. Ya puedes continuar al menú.", "ok");
          addContinueButton();
        }
      } catch (error) { showStatus(friendlyError(error), "error"); }
      finally { setBusy(false); }
    });

    $("googleBtn").addEventListener("click", async () => {
      if (busy) return;
      clearStatus(); setBusy(true);
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        showStatus("Sesión iniciada con Google correctamente.", "ok");
        addContinueButton();
      } catch (error) { showStatus(friendlyError(error), "error"); }
      finally { setBusy(false); }
    });

    $("guestBtn").addEventListener("click", async () => {
      if (busy) return;
      clearStatus(); setBusy(true);
      try {
        await signInAnonymously(auth);
        showStatus("Entraste como invitado. Esta sesión no tiene correo ni teléfono vinculado y puede no ser recuperable.", "ok");
        addContinueButton();
      } catch (error) { showStatus(friendlyError(error), "error"); }
      finally { setBusy(false); }
    });

    async function prepareRecaptcha() {
      if (recaptcha && recaptchaReady) return;
      if (recaptcha) {
        try { recaptcha.clear(); } catch (_) {}
        recaptcha = null;
        recaptchaReady = false;
      }
      $("recaptcha-container").innerHTML = "";
      recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => clearStatus(),
        "expired-callback": () => showStatus("La verificación expiró. Marca nuevamente la casilla de reCAPTCHA.", "error")
      });
      await recaptcha.render();
      recaptchaReady = true;
    }

    $("phoneBtn").addEventListener("click", async () => {
      clearStatus();
      const panel = $("phonePanel");
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) {
        showStatus("Completa el número con código de país y realiza la verificación reCAPTCHA antes de enviar el SMS.", "info");
        $("phone").focus();
        try {
          await prepareRecaptcha();
        } catch (error) {
          showStatus(friendlyError(error), "error");
          if (recaptcha) { try { recaptcha.clear(); } catch (_) {} }
          recaptcha = null;
          recaptchaReady = false;
        }
      }
    });

    $("sendSms").addEventListener("click", async () => {
      if (busy) return;
      clearStatus();
      const phone = $("phone").value.replace(/[\s()-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        showStatus("Escribe un número válido en formato internacional, por ejemplo +525512345678.", "error"); return;
      }
      setBusy(true);
      try {
        await prepareRecaptcha();
        confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
        $("codeArea").classList.remove("hidden");
        showStatus(mode === "register" ? "Código enviado. Confirma el SMS para verificar tu número y crear la cuenta." : "Código enviado. Confirma el SMS para iniciar sesión.", "ok");
      } catch (error) {
        showStatus(friendlyError(error), "error");
        if (recaptcha) { try { recaptcha.clear(); } catch (_) {} recaptcha = null; }
        recaptchaReady = false;
        $("recaptcha-container").innerHTML = "";
      } finally { setBusy(false); }
    });

    $("verifySms").addEventListener("click", async () => {
      if (busy) return;
      clearStatus();
      if (!confirmation) { showStatus("Primero solicita un código SMS.", "error"); return; }
      const code = $("smsCode").value.trim();
      if (!/^\d{6}$/.test(code)) { showStatus("Escribe el código de 6 dígitos que recibiste.", "error"); return; }
      setBusy(true);
      try {
        const credential = await confirmation.confirm(code);
        const details = getAdditionalUserInfo(credential);
        if (mode === "login" && details?.isNewUser) {
          await signOut(auth);
          showStatus("Este número todavía no tiene una cuenta. Cambia a Crear cuenta para registrarlo.", "error");
          confirmation = null;
          return;
        }
        if (mode === "register" && !details?.isNewUser) {
          showStatus("Este número ya tenía una cuenta. Se inició sesión correctamente.", "ok");
        } else {
          showStatus(mode === "register" ? "Número verificado y cuenta creada correctamente." : "Número verificado. Inicio de sesión correcto.", "ok");
        }
        addContinueButton();
        confirmation = null;
      } catch (error) { showStatus(friendlyError(error), "error"); }
      finally { setBusy(false); }
    });
  } catch (error) {
    showStatus(`No se pudo inicializar Firebase (${error.message}). Revisa js/firebase-config.js.`, "error");
  }
}

function addContinueButton() {
  let button = $("continueMenu");
  if (!button) {
    button = document.createElement("a");
    button.id = "continueMenu";
    button.href = "index.html";
    button.className = "primary text-decoration-none mt-3";
    button.innerHTML = 'Continuar al menú <i class="bi bi-arrow-right"></i>';
    $("status").insertAdjacentElement("afterend", button);
  }
}
