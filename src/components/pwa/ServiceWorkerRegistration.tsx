"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        logger.warn("Service Worker registration failed", { error });
      });
    }
  }, []);

  return null;
}
