import { useEffect } from "react";
import { useFeatures } from "../../hooks/useFeatures";

// Brique "Application mobile (PWA)" : tant que la brique est desactivee,
// aucun manifest ni service worker n'est enregistre (dark launch).
export default function PwaRegistration() {
  const { hasFeature } = useFeatures();
  const active = hasFeature("mobile_pwa");

  useEffect(() => {
    if (!active) return;
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.webmanifest";
      document.head.appendChild(link);
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [active]);

  return null;
}
