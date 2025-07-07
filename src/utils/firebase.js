// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // ✅ Add this

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr9812AaloaZJ8coIIPmXht3v1vg-yoh8",
  authDomain: "chatapp-ai-23.firebaseapp.com",
  projectId: "chatapp-ai-23",
  storageBucket: "chatapp-ai-23.firebasestorage.app",
  messagingSenderId: "829835177694",
  appId: "1:829835177694:web:8de3df6878df5857145c4f",
  measurementId: "G-3C7M8C9CNW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Auth
export const auth = getAuth(app);

// (Optional) Initialize Firebase Analytics
const analytics = getAnalytics(app);
