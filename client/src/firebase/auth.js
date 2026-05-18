import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "learningo-c9ac4.firebaseapp.com",
  projectId: "learningo-c9ac4",
  storageBucket: "learningo-c9ac4.firebasestorage.app",
  messagingSenderId: "428251024384",
  appId: "1:428251024384:web:861cdc66cf33b1b4389ce5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();