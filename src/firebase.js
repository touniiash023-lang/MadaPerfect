// src/firebase.js
// Firebase modular SDK v9
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ---- Remplace cette configuration par la tienne (depuis Firebase console) ----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
// ------------------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
