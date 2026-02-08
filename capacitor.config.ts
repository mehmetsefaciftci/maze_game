import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.labyrinth.mazegame",
  appName: "Maze game mobile design",
  webDir: "build",

  // ✅ Android/iOS build’lerinde Capacitor runtime’ı bundle içine eklemek istemiyoruz
  // (genelde önerilen: false)

  // ✅ İstersen geliştirme sırasında Android’de live-reload için açarsın (şimdilik kapalı kalsın)
  // server: {
  //   url: "http://10.0.2.2:3000",
  //   cleartext: true,
  // },
};

export default config;
