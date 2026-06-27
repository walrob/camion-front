import { defineNuxtPlugin, useRouter, useRuntimeConfig } from "#app";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const id = config.public.gaMeasurementId;

  if (config.public.gaEnabled && id) {
    // Insertar el script de GA4
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    `;
    document.head.appendChild(script2);

    // Escuchar cambios de ruta en Nuxt
    const router = useRouter();
    router.afterEach((to) => {
      window.gtag?.("event", "page_view", {
        page_path: to.fullPath,
        page_title: document.title,
      });
    });
  }
});
