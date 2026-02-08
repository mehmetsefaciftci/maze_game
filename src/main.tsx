import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ensureGuestAuth } from "./services/auth";
import { upsertUser } from "./services/userStore";

(async () => {
  try {
    const user = await ensureGuestAuth();

    if (!user) {
      throw new Error("Firebase user is null (guest auth failed)");
    }

    await upsertUser(user.uid);
    console.log("✅ Firebase guest uid:", user.uid);
  } catch (e) {
    console.error("❌ Firebase init error:", e);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
