// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCng-98T0UgPYf8_fb4Mk1nSp1sQeqLoTo",
  authDomain: "docstamp.firebaseapp.com",
  projectId: "docstamp",
  storageBucket: "docstamp.firebasestorage.app",
  messagingSenderId: "108033905182",
  appId: "1:108033905182:web:291734fb7365224f72540f"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, setDoc, getDoc, collection, addDoc, getDocs };
const provider = new GoogleAuthProvider();

// Функция для логина через окно-попап
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Firebase Auth Error:", error.message);
    throw error;
  }
}

// Функция для выхода (если захочешь добавить кнопку Logout)
export function logout() {
  return signOut(auth);
}

export { onAuthStateChanged };