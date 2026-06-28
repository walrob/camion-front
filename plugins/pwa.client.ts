import { setDeferredPrompt, setOnline } from "~/composables/usePwa";

export default defineNuxtPlugin(() => {
  if (typeof window === "undefined") return;

  // Registrar el service worker.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  // Capturar el prompt de instalación (Add to Home Screen).
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  });
  window.addEventListener("appinstalled", () => setDeferredPrompt(null));

  // Estado de conectividad.
  setOnline(navigator.onLine);
  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));
});
