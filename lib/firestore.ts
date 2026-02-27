import { adminDb } from "@/lib/firebase/admin";

export const db = adminDb;

export type Db = FirebaseFirestore.Firestore;

