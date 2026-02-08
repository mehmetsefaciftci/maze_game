import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function upsertUser(uid: string) {
  await setDoc(
    doc(db, "users", uid),
    {
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      currentLevel: 1,
      completedLevels: [],
    },
    { merge: true }
  );
}
