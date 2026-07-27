import type { CapacitorConfig } from "@capacitor/cli";

// Squash is a server-rendered Next.js app (server actions, cookies, Prisma) —
// it can't be statically exported into the app bundle. Instead the native
// WebView loads the live Vercel deployment directly, same as visiting the
// site in a browser, just wrapped in a standalone app shell/icon.
const config: CapacitorConfig = {
  appId: "com.squash.app",
  appName: "Squash",
  webDir: "www",
  server: {
    url: "https://squashsa.vercel.app",
    cleartext: false,
  },
};

export default config;
