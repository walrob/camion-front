/**
 * Una sola URL por página: con `www` y sin barra final.
 *
 * Google trataba `https://camionex.com.ar/` y `https://www.camionex.com.ar/`
 * como dos sitios que responden 200 con el mismo contenido, y lo mismo con
 * `/rendicion-de-viajes` y `/rendicion-de-viajes/`. El `canonical` de cada
 * página le dice cuál preferir, pero es una sugerencia; el 301 es una orden y
 * además concentra en una sola URL los enlaces entrantes que apunten a la otra.
 *
 * Es un plugin con el hook `request` y no un `server/middleware` porque las
 * páginas públicas están pre-renderizadas y Nitro las sirve desde el handler
 * estático, que corre **antes** que cualquier middleware: con un middleware
 * el 301 nunca llegaba a ejecutarse para las páginas que más importan. El hook
 * `request` es lo único que corre antes de ese handler.
 *
 * Corre en Nitro, detrás de nginx, así que actúa como red de seguridad: lo
 * correcto es que nginx redirija `camionex.com.ar` → `www.camionex.com.ar` antes
 * de llegar acá (ver docs/SEO.md §3). Si nginx no reenvía el `Host` original,
 * la parte del host no se activa y la de la barra final sigue funcionando.
 *
 * Duplica `SITIO.origen` de `composables/useSeoSitio.ts`: el servidor de Nitro
 * no tiene los auto-imports de Nuxt. Si cambia el dominio, cambia acá también.
 */

const HOST_CANONICO = "www.camionex.com.ar";
const HOST_SIN_WWW = "camionex.com.ar";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    // Sólo navegación. Un POST redirigido pierde el cuerpo, y no hay nada que
    // ganar redirigiéndolo.
    if (event.method !== "GET" && event.method !== "HEAD") return;

    const host = getRequestHost(event, { xForwardedHost: true });
    const url = getRequestURL(event, {
      xForwardedHost: true,
      xForwardedProto: true,
    });

    const hostEquivocado = host === HOST_SIN_WWW;
    // La raíz es `/` y se queda así; el resto pierde toda barra final.
    const conBarraFinal =
      url.pathname.length > 1 && url.pathname.endsWith("/");

    if (!hostEquivocado && !conBarraFinal) return;

    const pathname = conBarraFinal
      ? url.pathname.replace(/\/+$/, "")
      : url.pathname;
    const hostFinal = hostEquivocado ? HOST_CANONICO : host;
    // En producción siempre https, aunque nginx no reenvíe `X-Forwarded-Proto`:
    // redirigir a `http://www...` obligaría a un segundo salto hasta https.
    const protocolo = hostFinal.endsWith(HOST_SIN_WWW) ? "https:" : url.protocol;

    // Después de este hook, h3 igual ejecuta la primera capa de la app, que es
    // la de `routeRules`, y esa capa aplica `setHeaders` con las cabeceras de
    // la regla que matchee (`X-Robots-Tag` en las rutas privadas). Sobre una
    // respuesta ya enviada eso tira ERR_HTTP_HEADERS_SENT y ensucia el log en
    // cada `/admin/` sin www. Nitro cachea las reglas resueltas en este campo
    // del contexto; dejarlo vacío hace que esa capa no tenga nada que aplicar.
    event.context._nitro = { ...event.context._nitro, routeRules: {} };

    return sendRedirect(
      event,
      `${protocolo}//${hostFinal}${pathname}${url.search}`,
      301,
    );
  });
});
