// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQ_d8utjf2wj2MgNhrloSBrnZ9Qo8cs",
  authDomain: "madaperfect-11420.firebaseapp.com",
  projectId: "madaperfect-11420",
  storageBucket: "madaperfect-11420.firebasestorage.app",
  messagingSenderId: "812266852874",
  appId: "1:812266852874:web:38622eedae5f1aaf45f3",
  measurementId: "G-V7TSHVRVD1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore database
export const db = getFirestore(app);
