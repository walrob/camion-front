import type { menu } from "./sidebarItem";

/**
 * Regla de visibilidad del menú lateral, compartida con el buscador (Ctrl+K).
 *
 * Vive acá y no dentro de `Main.vue` / `NavItem.vue` para que las dos puertas
 * de navegación no puedan divergir: si el menú muestra una pantalla, el
 * buscador la ofrece, y con el mismo destino.
 */

/**
 * Ítems que ve un rol. Sólo se filtra por ROL: lo que el plan no incluye
 * **no se oculta**, se muestra con candado (ver `estaBloqueado`). Es una
 * decisión comercial explícita (MODELO-COMERCIAL §6.2): el cliente tiene que
 * ver todos los días lo que le falta.
 *
 * También descarta los headers de secciones que quedaron sin ítems, para no
 * mostrar títulos huérfanos.
 */
export function itemsVisiblesDelMenu(
  items: menu[],
  role: string | null | undefined,
): menu[] {
  if (!role) return [];
  const visibles = items.filter((x) => !x.roles || x.roles.includes(role));
  return visibles.filter((item, i) => {
    if (!item.header) return true;
    const next = visibles[i + 1];
    return !!next && !next.header;
  });
}

/** ¿El plan deja afuera la funcionalidad de este ítem? */
export function estaBloqueado(
  item: Pick<menu, "feature">,
  has: (feature: string) => boolean,
): boolean {
  return !!item.feature && !has(item.feature);
}

/** Destino real: el módulo, o la pantalla de upgrade si está bloqueado. */
export function destinoDelItem(
  item: Pick<menu, "feature" | "to">,
  has: (feature: string) => boolean,
): string | undefined {
  return estaBloqueado(item, has) ? `/upgrade/${item.feature}` : item.to;
}
