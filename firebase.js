
// Import fungsi yang diperlukan dari SDK Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyCNehY1hAuiOSnoi90PKLIK5-InZ0b_CDs",
  authDomain: "msm-asyrof-bus.firebaseapp.com",
  projectId: "msm-asyrof-bus",
  storageBucket: "msm-asyrof-bus.firebasestorage.app",
  messagingSenderId: "707482209131",
  appId: "1:707482209131:web:23e1e11505bb9024e29a2e"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor Firestore dan Auth agar bisa dipakai di file JS lain
export const db = getFirestore(app);
export const auth = getAuth(app);
