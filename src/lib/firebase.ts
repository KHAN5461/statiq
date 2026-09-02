import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Auto-generated Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0078750575",
  appId: "1:648019862426:web:67ebcb9f3513663e495023",
  apiKey: "AIzaSyDn5Opix2OVuONnmDCdky0K18wtU2jjQBI",
  authDomain: "gen-lang-client-0078750575.firebaseapp.com",
  storageBucket: "gen-lang-client-0078750575.firebasestorage.app",
  messagingSenderId: "648019862426",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the specific database initialized for this applet
export const db = getFirestore(app, "ai-studio-karmayogistatiq-ffbe22f0-de82-4b76-8fb8-3e3560e0b36c");
