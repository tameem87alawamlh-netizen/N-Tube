import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0zZ8WjtfFTJLIGiB59_Ofj0Zsc_FbbGQ",
  authDomain: "tube-stream-2c45a.firebaseapp.com",
  projectId: "tube-stream-2c45a",
  storageBucket: "tube-stream-2c45a.firebasestorage.app",
  messagingSenderId: "909459265239",
  appId: "1:909459265239:web:9ef94b5f333dbb4d350292",
  measurementId: "G-SYEX6DPJQD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to avoid failure in restricted environments
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Firebase Analytics is not supported in this environment:", err);
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom configuration to prompt account selection if desired
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
export default app;
