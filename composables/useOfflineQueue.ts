import { ref } from "vue";

// Cola local de acciones pendientes de sincronizar (offline-first del chofer).
// Persistida en localStorage; cada ítem usa un clientId idempotente.
const KEY = "fleetlog_offline_queue";
const pendingCount = ref(0);

export interface QueuedTripLog {
  clientId: string;
  payload: Record<string, any>;
  photoDataUrl?: string;
}

const read = (): QueuedTripLog[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const write = (items: QueuedTripLog[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  pendingCount.value = items.length;
};

export const useOfflineQueue = () => {
  const refresh = () => {
    pendingCount.value = read().length;
  };

  const enqueue = (item: QueuedTripLog) => {
    const items = read();
    items.push(item);
    write(items);
  };

  const remove = (clientId: string) => {
    write(read().filter((i) => i.clientId !== clientId));
  };

  return { pendingCount, refresh, enqueue, remove, read };
};

// Utilidades de conversión de archivos para guardar/recuperar fotos offline.
export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const dataUrlToFile = (dataUrl: string, name: string): File => {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: mime });
};
