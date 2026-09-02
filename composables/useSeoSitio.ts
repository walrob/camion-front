import type { MaybeRefOrGetter } from "vue";

import { CONTACTO } from "~/composables/useContacto";

/**
 * Identidad pública del sitio y utilidades de SEO.
 *
 * Vive en un solo lugar porque el dominio y la marca aparecen repartidos entre
 * el `head` global, el canonical de cada página, los datos estructurados, el
 * sitemap y las tarjetas para compartir. Si mañana cambia el dominio, no puede
 * quedar una URL vieja escondida en un JSON-LD.
 *
 * ⚠️ `public/robots.txt` y `public/sitemap.xml` son archivos estáticos y NO
 * leen de acá: si cambia `origen`, hay que actualizarlos a mano.
 */
export const SITIO = {
  /** Marca comercial, tal cual se escribe. */
  marca: "CamioNex",
  /** Razón social que opera el servicio. */
  operador: "NorthAr Consulting",
  /**
   * Origen canónico, sin barra final. Con `www` porque es lo que resuelve el
   * DNS y lo que está declarado en el sitemap: elegir una sola variante evita
   * que Google reparta la autoridad entre dos hosts.
   */
  origen: "https://www.camionex.com.ar",
  /** Tarjeta para compartir. Absoluta: WhatsApp y LinkedIn ignoran las relativas. */
  imagenSocial: "/og-camionex.png",
  /** Idioma y país al que apunta el producto. */
  locale: "es_AR",
} as const;

/** Convierte una ruta interna en URL absoluta y canónica. */
export function urlAbsoluta(ruta: string): string {
  if (/^https?:\/\//.test(ruta)) return ruta;
  const limpia = ruta.split("?")[0].split("#")[0];
  // Se quita la barra final salvo en la raíz: `/planes` y `/planes/` son la
  // misma página, y declarar dos canonical distintos es contenido duplicado.
  const sinBarra =
    limpia.length > 1 && limpia.endsWith("/") ? limpia.slice(0, -1) : limpia;
  return `${SITIO.origen}${sinBarra.startsWith("/") ? sinBarra : `/${sinBarra}`}`;
}

/**
 * Declara el canonical y el `og:url` de la página actual.
 *
 * Google usa el canonical para decidir cuál URL indexa cuando llega por varias
 * (con `utm_`, con barra final, por http). Sin él, cada variante compite contra
 * sí misma.
 */
export function useCanonical(ruta?: string) {
  const route = useRoute();
  const url = computed(() => urlAbsoluta(ruta ?? route.path));

  useHead({
    link: [{ rel: "canonical", href: url }],
    meta: [{ property: "og:url", content: url }],
  });

  return url;
}

/**
 * Inserta un bloque JSON-LD de datos estructurados en el `head`.
 *
 * Acepta un objeto, un `computed` o una función: los datos de la landing
 * dependen de los precios, que llegan de la API después de montar, y el marcado
 * tiene que seguirlos. Si el JSON-LD declara un precio y la página muestra otro,
 * Google descarta el marcado por inconsistente.
 */
export function useDatosEstructurados(
  datos: MaybeRefOrGetter<Record<string, unknown>>,
) {
  useHead({
    script: [
      {
        type: "application/ld+json",
        // `innerHTML` y no `children`: es lo que useHead serializa dentro del
        // <script> sin escapar las comillas del JSON.
        innerHTML: computed(() => JSON.stringify(toValue(datos))),
      },
    ],
  });
}

/**
 * La organización detrás del producto.
 *
 * `sameAs` es lo que le permite a Google unir el sitio con los perfiles de
 * LinkedIn e Instagram y tratarlos como una sola entidad.
 */
export function organizacionJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${SITIO.origen}/#organizacion`,
    name: SITIO.marca,
    legalName: SITIO.operador,
    url: SITIO.origen,
    logo: `${SITIO.origen}/android-chrome-512x512.png`,
    email: CONTACTO.email,
    telephone: `+${CONTACTO.whatsapp}`,
    areaServed: { "@type": "Country", name: "Argentina" },
    sameAs: [CONTACTO.linkedin, CONTACTO.instagram],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: CONTACTO.email,
        telephone: `+${CONTACTO.whatsapp}`,
        availableLanguage: ["es"],
      },
    ],
  };
}

/** Migas de pan: le dan a Google la jerarquía del sitio bajo el título. */
export function migasJsonLd(items: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nombre,
      item: urlAbsoluta(it.ruta),
    })),
  };
}
