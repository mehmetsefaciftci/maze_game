import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
};

/**
 * ✅ Guest (Anonymous) Auth
 * - Kullanıcı varsa devam eder
 * - Yoksa anonymous user oluşturur
 * - App açılışında çağrılmalı
 */
export async function ensureGuestAuth(): Promise<AuthUser> {
  const current = await FirebaseAuthentication.getCurrentUser();

  if (current.user?.uid) {
    return {
      uid: current.user.uid,
      email: current.user.email,
      displayName: current.user.displayName,
      isAnonymous: current.user.isAnonymous,
    };
  }

  const res = await FirebaseAuthentication.signInAnonymously();
  if (!res.user?.uid) {
    throw new Error("Anonymous sign-in failed");
  }

  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: res.user.displayName,
    isAnonymous: true,
  };
}

/**
 * ✅ Google ile BAĞLA (link)
 * - Guest kullanıcıyı Google hesabına bağlar
 * - UID DEĞİŞMEZ ❗ (en kritik nokta)
 * - BUTONA BASILINCA çağırılmalı
 */
export async function linkWithGoogle(): Promise<AuthUser> {
  const current = await FirebaseAuthentication.getCurrentUser();

  // Guest yoksa, normal Google sign-in yap
  if (!current.user) {
    const res = await FirebaseAuthentication.signInWithGoogle();
    if (!res.user?.uid) throw new Error("Google sign-in failed");

    return {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName,
      isAnonymous: false,
    };
  }

  // ✅ Guest → Google bağlama (DOĞRU YOL)
  const res = await FirebaseAuthentication.linkWithGoogle();
  if (!res.user?.uid) throw new Error("Google link failed");

  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: res.user.displayName,
    isAnonymous: false,
  };
}

/**
 * 🔁 Logout (debug / test için)
 * - Production'da genelde KULLANMA
 */
export async function signOut() {
  await FirebaseAuthentication.signOut();
}
