/**
 * Inicialización del SDK Admin de Firebase.
 *
 * Se usa exclusivamente en Server Actions (lib/actions.ts) para ejecutar
 * operaciones que requieren privilegios elevados:
 * - Reservar números (transacción atómica)
 * - Liberar reservas expiradas
 * - Cualquier escritura que bypass las reglas de Firestore
 *
 * Las credenciales se leen de variables de entorno:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 *
 * IMPORTANTE (producción/Vercel): estas variables deben configurarse
 * manualmente en Vercel → Settings → Environment Variables. El archivo
 * `.env.local` está en .gitignore, así que Vercel NO lo recibe. Sin ellas,
 * `cert()` lanza un error que hace fallar todas las Server Actions
 * de reserva (POST 500). Ver docs/decisions/004-firebase-dual-sdk.md.
 *
 * @see docs/decisions/004-firebase-dual-sdk.md
 * @see docs/decisions/001-server-side-reservation-logic.md
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Nombre único para la app admin. Usar un nombre dedicado (en lugar de
// depender de la app por defecto) evita conflictos de inicialización y
// caches entre hot-reloads y diferentes entornos (dev/build/ridge).
const ADMIN_APP_NAME = "rifa-app-admin";

/**
 * Normaliza el valor de `FIREBASE_PRIVATE_KEY`.
 *
 * El service account de Firebase genera la llave con saltos de línea
 * literales `\n`. Según cómo se copie en .env.local o en Vercel, puede
 * llegar como `\n` literales, como saltos de línea reales, o ambos.
 * Esta función los unifica a saltos de línea reales para `cert()`.
 */
function normalizePrivateKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Convierte `\n` literales (backslash + n) a saltos de línea reales.
  return value.replace(/\\n/g, "\n").trim();
}

/**
 * Inicialización perezosa (lazy) de la app admin de Firebase.
 *
 * IMPORTANTE: se inicializa SOLO cuando se llama por primera vez, nunca al
 * importar el módulo. Esto evita que `cert()` y la validación de variables
 * se ejecuten durante `next build` (prerender), donde `process.env` puede
 * no tener las credenciales aunque sí existan en runtime (deploy de Vercel)
 * o en `.env.local` (dev). Ese fue el origen del 500 en producción: el módulo
 * se importaba/ejecutaba en tiempo de build sin credenciales y lanzaba.
 *
 * Se cachea en `cachedDb` y se reutiliza en llamadas subsiguientes.
 */
let cachedDb: ReturnType<typeof getFirestore> | null = null;

export function getAdminDb() {
  if (cachedDb) return cachedDb;

  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  const app =
    existing ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)!,
        }),
      },
      ADMIN_APP_NAME
    );

  cachedDb = getFirestore(app);
  return cachedDb;
}