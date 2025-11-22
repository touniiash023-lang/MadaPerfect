// firebase.js - Replace config with your project's values
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQQ_d8utjf2vj2MqNhrhlosBrnZQ9o8cs",
  authDomain: "madaperfect-11420.firebaseapp.com",
  projectId: "madaperfect-11420",
  storageBucket: "madaperfect-11420.firebasestorage.app",
  messagingSenderId: "812266852874",
  appId: "1:812266852874:web:38622eedeafe51faaf45f3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
