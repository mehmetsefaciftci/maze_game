import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";

export type UserDoc = {
  displayName?: string;
  currentLevel: number;
  completedLevels: number[]; // şimdilik array
  createdAt?: unknown;
  lastSeenAt?: unknown;
};

export async function ensureUserDoc(uid: string): Promise<UserDoc> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const initial: UserDoc = {
      currentLevel: 1,
      completedLevels: [],
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    return initial;
  }

  // her açılışta lastSeen güncelle
  await updateDoc(ref, { lastSeenAt: serverTimestamp() });

  return snap.data() as UserDoc;
}

export async function setDisplayName(uid: string, displayName: string) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      displayName,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
}
