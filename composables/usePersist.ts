import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

/**
 * Guarda un valor en almacenamiento persistente (web o mobile)
 */
export async function persistSet(key: string, value: string) {
  if (process.client && Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * Obtiene un valor desde almacenamiento persistente
 */
export async function persistGet(key: string): Promise<string | null> {
  if (process.client && Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value || null;
  } else {
    return localStorage.getItem(key);
  }
}

/**
 * Elimina un valor de almacenamiento persistente
 */
export async function persistRemove(key: string) {
  if (process.client && Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}
