import { Capacitor } from '@capacitor/core'

/**
 * Arranque dentro de la app instalada.
 *
 * Desde que `/` es la landing pública, hay dos formas de que la app del chofer
 * abra una página de marketing en lugar del sistema:
 *
 *  1. **PWA instalada**: arranca en `start_url`. Se corrigió en
 *     `public/site.webmanifest` (`/chofer`), pero el manifest **queda cacheado**
 *     en los dispositivos que ya la instalaron, así que el arreglo no llega
 *     solo a quien ya la tiene.
 *  2. **App nativa (Capacitor)**: hoy no hay proyecto nativo en el repositorio
 *     —sólo se usa `@capacitor/preferences` como almacenamiento—, pero el día
 *     que se compile, el webview arranca en la raíz.
 *
 * Este plugin cubre los dos casos desde el cliente, que es lo único que
 * funciona para un manifest ya cacheado.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()

  /** ¿Se está ejecutando dentro de la app y no en una pestaña del navegador? */
  const enModoApp = (): boolean => {
    if (Capacitor.isNativePlatform()) return true

    // PWA instalada: el navegador la abre sin barra de direcciones.
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // Safari en iOS no soporta display-mode y usa esta propiedad.
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true
    )
  }

  router.beforeEach((to) => {
    if (to.path !== '/') return
    if (!enModoApp()) return

    // Dentro de la app, la landing no tiene sentido: se va al sistema. El
    // middleware de autenticación resuelve después si corresponde login.
    return '/chofer'
  })
})
