// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAubzgWvcVAZRIoYXEn3UoJZAt8fTvLfWw",
  authDomain: "quiz-platform-ids.firebaseapp.com",
  projectId: "quiz-platform-ids",
  storageBucket: "quiz-platform-ids.appspot.com",
  messagingSenderId: "1070214831126",
  appId: "1:1070214831126:web:4db20313e1994f67096937"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);