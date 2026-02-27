import { Timestamp } from "firebase-admin/firestore";

type FirestoreDate = Timestamp | string;

export function toIsoString(value: FirestoreDate | null | undefined): string {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toDate().toISOString();
}

export function fromIsoString(value: string): Timestamp {
  return Timestamp.fromDate(new Date(value));
}

