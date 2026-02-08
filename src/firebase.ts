// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7YTOSSyQrAlg8Ser5M7PyZC479FYHfA4",
  authDomain: "mazegame-207db.firebaseapp.com",
  projectId: "mazegame-207db",
  storageBucket: "mazegame-207db.firebasestorage.app",
  messagingSenderId: "758706611904",
  appId: "1:758706611904:web:3a31daa0c94b5f1abeaf25",
  measurementId: "G-R77GG8GL1L"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);