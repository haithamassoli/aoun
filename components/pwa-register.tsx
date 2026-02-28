"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // تسجيل الـ Service Worker فشل — يتم تجاهله بصمت
      });
    }
  }, []);

  return null;
}
