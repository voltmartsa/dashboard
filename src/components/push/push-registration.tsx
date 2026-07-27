"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken } from "@/actions/push";

// Renders nothing — just registers this device for push notifications once,
// on mount, when running inside the installed Android app. No-op in a
// regular browser tab.
export function PushRegistration() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log("[push] Not running in a native app — skipping registration.");
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        console.log("[push] Checking current permission status...");
        let status = await PushNotifications.checkPermissions();
        console.log("[push] checkPermissions() ->", status.receive);

        if (status.receive === "prompt" || status.receive === "prompt-with-rationale") {
          console.log("[push] Requesting permission...");
          status = await PushNotifications.requestPermissions();
          console.log("[push] requestPermissions() ->", status.receive);
        }

        if (status.receive !== "granted") {
          console.log("[push] Permission not granted, stopping. Final status:", status.receive);
          return;
        }
        if (cancelled) return;

        console.log("[push] Permission granted — calling register()...");
        await PushNotifications.register();
        console.log("[push] register() call completed — waiting for 'registration' event...");
      } catch (err) {
        console.error("[push] setup() threw an error:", err);
      }
    }

    const registrationListener = PushNotifications.addListener("registration", (token) => {
      console.log("[push] Got FCM token, length:", token.value.length);
      registerPushToken({ token: token.value, platform: Capacitor.getPlatform() })
        .then(() => console.log("[push] Token saved to server successfully."))
        .catch((err) => console.error("[push] Failed to save token to server:", err));
    });
    const errorListener = PushNotifications.addListener("registrationError", (err) => {
      console.error("[push] registrationError event:", JSON.stringify(err));
    });

    setup();

    return () => {
      cancelled = true;
      registrationListener.then((handle) => handle.remove());
      errorListener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
