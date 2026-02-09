import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7YTOSSyQrAlg8Ser5M7PyZC479FYHfA4",
  authDomain: "mazegame-207db.firebaseapp.com",
  projectId: "mazegame-207db",
  storageBucket: "mazegame-207db.firebasestorage.app",
  messagingSenderId: "758706611904",
  appId: "1:758706611904:web:3a31daa0c94b5f1abeaf25",
  measurementId: "G-R77GG8GL1L",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
