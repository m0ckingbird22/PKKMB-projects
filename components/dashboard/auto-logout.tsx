"use client";

import { useEffect, useRef } from "react";

// Ubah angka ini kalau mau durasi idle yang beda
const IDLE_LIMIT_MS = 10 * 60 * 1000; // 5 menit tanpa aktivitas
const CHECK_INTERVAL_MS = 30 * 1000; // cek tiap 30 detik

// Aktivitas apa saja yang dianggap "masih pegang device"
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export function AutoLogout() {
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true }),
    );

    const interval = setInterval(async () => {
      if (Date.now() - lastActivityRef.current < IDLE_LIMIT_MS) return;

      clearInterval(interval);
      // Logout via server supaya semua cookie sb-* pasti terhapus
      window.location.replace("/auth/signout");
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActivity),
      );
      clearInterval(interval);
    };
  }, []);

  return null;
}
