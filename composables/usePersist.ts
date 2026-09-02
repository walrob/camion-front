import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

/**
 * Almacenamiento persistente (web o mobile).
 *
 * ⚠️ Las tres funciones son **no-op en el servidor**. Desde que las páginas
 * públicas se renderizan en el servidor (`ssr: true` en nuxt.config.ts), el
 * middleware global corre también ahí y llama a `loadAuth()`. Sin esta guarda,
 * `localStorage` no existe y el pre-renderizado de la landing se cae en el build.
 *
 * En el servidor no hay sesión que leer —ni debería haberla: la sesión vive en
 * el dispositivo—, así que devolver `null` es la respuesta correcta y no una
 * excepción. El middleware la interpreta como "visitante anónimo", que es
 * exactamente lo que un buscador es.
 */

/** ¿Estamos en el navegador (o en la app nativa)? */
const enCliente = () => import.meta.client;

/** Guarda un valor en almacenamiento persistente. */
export async function persistSet(key: string, value: string) {
  if (!enCliente()) return;
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

/** Obtiene un valor desde almacenamiento persistente. */
export async function persistGet(key: string): Promise<string | null> {
  if (!enCliente()) return null;
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value || null;
  }
  return localStorage.getItem(key);
}

/** Elimina un valor de almacenamiento persistente. */
export async function persistRemove(key: string) {
  if (!enCliente()) return;
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}
