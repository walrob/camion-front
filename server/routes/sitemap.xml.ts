import { URLS_DEL_SITEMAP } from "../../seo/paginas";

/**
 * Sitemap generado, no escrito a mano.
 *
 * Antes era `public/sitemap.xml`, un archivo estático. Con tres URL se podía
 * mantener; en cuanto empezaron a sumarse páginas temáticas dejó de ser
 * sostenible, porque nada obligaba a actualizarlo y un sitemap incompleto no
 * da error: simplemente deja páginas sin descubrir.
 *
 * Ahora sale de `seo/paginas.ts`, la misma lista que decide qué se
 * pre-renderiza y qué se enlaza en el pie. Agregar una página al registro la
 * publica en los tres lugares a la vez.
 *
 * La ruta se pre-renderiza en el build (ver `nitro.prerender.routes`), así que
 * en producción se sirve como archivo estático y no ejecuta nada.
 */

/**
 * Duplica `SITIO.origen`. No puede importarlo: `composables/useSeoSitio.ts`
 * usa el alias `~` y los auto-imports de Nuxt, que no existen en el servidor de
 * Nitro. Si cambia acá, cambia también en `nuxt.config.ts`, en ese composable y
 * en `public/robots.txt`.
 */
const ORIGEN = "https://www.camionex.com.ar";

export default defineEventHandler((event) => {
  const urls = URLS_DEL_SITEMAP.map(
    (p) => `  <url>
    <loc>${ORIGEN}${p.ruta === "/" ? "/" : p.ruta}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>
  </url>`,
  ).join("\n");

  // Las URL tienen que coincidir **exactamente** con el `canonical` que declara
  // cada página (con www, sin barra final salvo la raíz): un sitemap que apunta
  // a una variante distinta de la canónica se ignora entero.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  setHeader(event, "content-type", "application/xml; charset=utf-8");
  // Una hora: el sitemap cambia con el despliegue, no entre visitas.
  setHeader(event, "cache-control", "public, max-age=3600");
  return xml;
});
