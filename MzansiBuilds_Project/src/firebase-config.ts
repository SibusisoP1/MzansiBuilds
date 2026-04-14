import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvzqUndfvZ-tmHOoIn3Pv2RgbvlbmqVfI",
  authDomain: "mzansibuilds-31558.firebaseapp.com",
  projectId: "mzansibuilds-31558",
  storageBucket: "mzansibuilds-31558.firebasestorage.app",
  messagingSenderId: "1009697177180",
  appId: "1:1009697177180:web:d519b4d890b1779833f099",
  measurementId: "G-GXW6PV8ZRW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;
