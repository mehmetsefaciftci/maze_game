import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./services/firebase";

/**
 * users/{uid} dokümanını:
 * - yoksa oluşturur
 * - varsa lastSeenAt günceller
 */
export async function upsertUser(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      currentLevel: 1,
      completedLevels: [],
    });
  } else {
    await updateDoc(ref, {
      lastSeenAt: serverTimestamp(),
    });
  }

  return ref;
}
