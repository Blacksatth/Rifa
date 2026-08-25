import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4tzTEP2HdJ64Kf03KwJHjH87FC8OYt-I",
  authDomain: "rifa-5b354.firebaseapp.com",
  projectId: "rifa-5b354",
  storageBucket: "rifa-5b354.firebasestorage.app",
  messagingSenderId: "1088252815144",
  appId: "1:1088252815144:web:8fd012264a45157cf6921d",
  measurementId: "G-JDFRNC60GB"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);