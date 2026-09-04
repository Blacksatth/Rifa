/**
 * Inicialización del SDK cliente de Firebase.
 *
 * Se usa en componentes React para:
 * - Lecturas en tiempo real de Firestore (onSnapshot)
 * - Autenticación de administradores (Firebase Auth)
 * - Subida de imágenes a Cloudinary (fetch directo, no usa Storage)
 *
 * El guard `getApps().length` previene la doble inicialización durante
 * hot reloads en desarrollo. En producción solo se inicializa una vez.
 *
 * @see docs/decisions/004-firebase-dual-sdk.md para por qué se usa SDK dual
 * @see lib/firebase-admin.ts para el SDK de servidor
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

/**
 * Configuración de Firebase.
 * Estos valores son públicos (se envían al navegador) y no son secretos.
 * Las credenciales secretas (service account) están en firebase-admin.ts.
 */
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

/** Instancia de Firestore para operaciones del cliente */
export const db = getFirestore(app);

/** Instancia de Firebase Auth para login de admins */
export const auth = getAuth(app);

/** Instancia de Firebase Storage (actualmente no se usa directamente) */
export const storage = getStorage(app);