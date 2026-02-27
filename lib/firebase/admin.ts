import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const apps = getApps();

const hasRequiredEnv =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (!hasRequiredEnv) {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase Admin initialisé en mode limité : variables FIREBASE_* manquantes dans l'environnement."
  );
}

const app =
  apps[0] ??
  (hasRequiredEnv
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n")
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      })
    : initializeApp());

export const adminAuth = hasRequiredEnv ? getAuth(app) : (null as any);
export const adminDb = hasRequiredEnv ? getFirestore(app) : (null as any);

