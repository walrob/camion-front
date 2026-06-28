import { useOfflineQueue, dataUrlToFile } from "~/composables/useOfflineQueue";

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === "undefined") return;

  const api = (nuxtApp as any).$api;
  const queue = useOfflineQueue();
  queue.refresh();

  let flushing = false;
  const flush = async () => {
    if (flushing || !navigator.onLine || !api) return;
    flushing = true;
    try {
      for (const item of queue.read()) {
        try {
          const resp = await api.post("trip-log/", item.payload);
          if (item.photoDataUrl && resp.data?.id) {
            const file = dataUrlToFile(item.photoDataUrl, "comprobante.jpg");
            const fd = new FormData();
            fd.append("file", file);
            fd.append("entityType", "trip_log_entry");
            fd.append("entityId", resp.data.id);
            await api.post("attachments/upload/", fd);
          }
          queue.remove(item.clientId);
        } catch {
          // Sigue sin conexión o error transitorio: reintentar más tarde.
          break;
        }
      }
    } finally {
      flushing = false;
    }
  };

  window.addEventListener("online", flush);
  if (navigator.onLine) setTimeout(flush, 3000);
});
