/* ────────────────────────────────────────────────────────────
   Firestore helpers — Newsletter subscribers
   ──────────────────────────────────────────────────────────── */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Subscriber {
  email: string;
  name: string;
  listingCount: string;
  subscribedAt: unknown; // Firestore Timestamp
  source: string;
}

const subscribersCol = () => collection(db, "subscribers");

/**
 * Add a subscriber. Uses email as document ID to prevent duplicates.
 * If the email already exists, the document is overwritten (upsert).
 */
export async function addSubscriber(data: {
  email: string;
  name: string;
  listingCount: string;
}): Promise<void> {
  const docId = data.email.toLowerCase().trim();
  await setDoc(doc(db, "subscribers", docId), {
    email: docId,
    name: data.name.trim(),
    listingCount: data.listingCount,
    subscribedAt: serverTimestamp(),
    source: "mini-course",
  });
}

/**
 * Check if an email is already subscribed.
 */
export async function isSubscribed(email: string): Promise<boolean> {
  const q = query(
    subscribersCol(),
    where("email", "==", email.toLowerCase().trim())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
