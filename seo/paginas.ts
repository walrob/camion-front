/**
 * Registro de las páginas públicas indexables.
 *
 * Existe porque la misma lista se necesitaba en cuatro lugares que no se
 * hablaban entre sí: las rutas a pre-renderizar (`nuxt.config.ts`), el
 * `sitemap.xml`, los enlaces del pie y las rutas que el middleware deja pasar
 * sin sesión. Mantenerla a mano en cuatro archivos garantizaba que tarde o
 * temprano una página nueva quedara fuera de alguno — y una página que no está
 * en el sitemap, o a la que no llega ningún enlace interno, se rastrea tarde y
 * se posiciona peor.
 *
 * Es un módulo plano, sin imports: `nuxt.config.ts` se evalúa antes de que
 * existan los alias (`~`) y los auto-imports de Nuxt, así que no puede depender
 * de nada del runtime.
 */

export type Frecuencia = "weekly" | "monthly" | "yearly";

export interface PaginaPublica {
  /** Ruta interna, sin barra final salvo la raíz. Es también la canónica. */
  ruta: string;
  /**
   * Última modificación real del **contenido**, no del despliegue. Una fecha
   * que se mueve sola en cada deploy le enseña al buscador a desconfiar de ella.
   */
  lastmod: string;
  changefreq: Frecuencia;
  /** Prioridad relativa dentro del sitio, de 0 a 1. */
  priority: number;
  /**
   * Texto del enlace en el pie. `undefined` en las páginas que ya tienen su
   * lugar ahí (legales) o que no necesitan enlace propio (la raíz).
   */
  enlacePie?: string;
}

/**
 * Páginas servidas por el router de Nuxt. Se pre-renderizan y van al sitemap.
 *
 * El orden importa: es el que se usa para dibujar la columna "Recursos" del pie.
 */
export const PAGINAS_PUBLICAS: PaginaPublica[] = [
  { ruta: "/", lastmod: "2026-09-07", changefreq: "weekly", priority: 1.0 },

  // ── Páginas temáticas ─────────────────────────────────────────────────────
  // Cada una responde una consulta distinta y con su propia intención. No son
  // variantes de la portada: la portada vende el producto, estas explican un
  // problema del rubro. Si repitieran su texto competirían contra ella y las
  // dos bajarían (canibalización).
  {
    ruta: "/control-vencimientos-cnrt",
    lastmod: "2026-09-07",
    changefreq: "monthly",
    priority: 0.9,
    enlacePie: "Control de vencimientos",
  },
  {
    ruta: "/rendicion-de-viajes",
    lastmod: "2026-09-07",
    changefreq: "monthly",
    priority: 0.9,
    enlacePie: "Rendición de viajes",
  },
  {
    ruta: "/costo-por-kilometro",
    lastmod: "2026-09-07",
    changefreq: "monthly",
    priority: 0.9,
    enlacePie: "Costo por kilómetro",
  },

  // ── Legales ───────────────────────────────────────────────────────────────
  // Prioridad baja a propósito: se indexan porque dan señales de confianza
  // (un SaaS sin términos publicados es sospechoso), no porque traigan visitas.
  {
    ruta: "/terminos-y-condiciones",
    lastmod: "2026-09-02",
    changefreq: "yearly",
    priority: 0.3,
  },
  {
    ruta: "/politica-de-privacidad",
    lastmod: "2026-09-02",
    changefreq: "yearly",
    priority: 0.3,
  },
];

/**
 * URL indexables que **no** pasan por el router de Nuxt.
 *
 * El manual se sirve suelto desde `docs/manual-usuario` (ver `publicAssets` en
 * nuxt.config.ts). Es el texto más extenso del sitio y el que responde
 * consultas de cola larga, así que va al sitemap aunque no sea una página Vue.
 */
export const URLS_EXTERNAS_AL_ROUTER: PaginaPublica[] = [
  {
    ruta: "/docs/manual/manual.html",
    lastmod: "2026-09-02",
    changefreq: "monthly",
    priority: 0.6,
  },
];

/** Rutas de Nuxt a pre-renderizar durante el build. */
export const RUTAS_A_PRERRENDERIZAR = PAGINAS_PUBLICAS.map((p) => p.ruta);

/** Todo lo que se declara en el sitemap, en orden de prioridad decreciente. */
export const URLS_DEL_SITEMAP = [
  ...PAGINAS_PUBLICAS,
  ...URLS_EXTERNAS_AL_ROUTER,
].sort((a, b) => b.priority - a.priority);
