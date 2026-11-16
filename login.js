import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const submitButton = loginForm.querySelector("button[type='submit']");

loginForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const buttonLabel = submitButton.querySelector("span");

    errorMsg.hidden = true;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    buttonLabel.textContent = "Memeriksa akun...";
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Jika berhasil, arahkan ke halaman admin
        window.location.href = "admin.html";
    } catch (error) {
        console.error("Login gagal:", error.code);
        errorMsg.textContent = "Email atau password salah. Silakan coba lagi.";
        errorMsg.hidden = false;
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        buttonLabel.textContent = "Masuk ke dashboard";
    }
});
