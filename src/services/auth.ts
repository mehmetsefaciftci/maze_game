import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export async function ensureGuestAuth() {
  const current = await FirebaseAuthentication.getCurrentUser();
  if (current.user) return current.user;

  const res = await FirebaseAuthentication.signInAnonymously();
  return res.user;
}
