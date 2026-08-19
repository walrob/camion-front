import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useAuthStore } from '@/stores/auth'
import { esRutaPublica } from '@/composables/useRutasPublicas'

/**
 * Encaminamiento y control de acceso de todo el front.
 *
 * Orden de decisiones, que importa:
 *
 *   1. Chofer autenticado → siempre a `/chofer`, incluso desde la landing.
 *   2. Ruta pública → pasa sin sesión.
 *   3. Sin sesión en ruta privada → login.
 *   4. Encaminamiento por rol, roles de página, onboarding y plan.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  await authStore.loadAuth()

  const userRole = authStore.user?.role || ''
  const isDriver = userRole === 'driver'
  const isSuperadmin = userRole === 'superadmin'
  const autenticado = !!authStore.token

  // El backoffice ya no vive en `/`: ahí está la landing pública.
  const home = authStore.paginaDeInicio

  const publica = esRutaPublica(to.path)

  // 1) El chofer nunca ve la landing: su app arranca en `/` cuando se instala
  //    como PWA, así que si cae ahí autenticado se lo lleva a su pantalla.
  if (autenticado && isDriver && !to.path.startsWith('/chofer')) {
    return navigateTo('/chofer')
  }

  // 2) Rutas públicas. A diferencia de antes, un usuario autenticado **no** es
  //    expulsado de la landing: puede querer ver precios o compartirla. Sólo se
  //    lo redirige desde las pantallas de acceso, donde quedarse no tiene
  //    sentido.
  if (publica) {
    const esPantallaDeAcceso =
      to.path.startsWith('/auth/') || to.path.startsWith('/invite')
    if (autenticado && esPantallaDeAcceso) {
      return navigateTo(home)
    }
    return
  }

  // 3) Ruta privada sin sesión.
  if (!autenticado) {
    return navigateTo('/auth/login')
  }

  // 4) Encaminamiento por rol.
  if (!isDriver && to.path.startsWith('/chofer')) {
    return navigateTo(home)
  }

  // El panel de plataforma es sólo del superadmin. Esto es comodidad de
  // navegación: el control real lo hace el backend, que responde 403 aunque
  // alguien fuerce la URL o llame a la API directamente.
  if (to.path.startsWith('/superadmin') && !isSuperadmin) {
    return navigateTo(home)
  }
  // Y el superadmin no tiene nada que hacer en el backoffice de un cliente: no
  // es de ninguna empresa.
  if (isSuperadmin && to.path.startsWith('/admin')) {
    return navigateTo('/superadmin')
  }

  const rolesPage = to.meta.roles as string[] | undefined
  if (rolesPage && rolesPage.length > 0 && !rolesPage.includes(userRole)) {
    return navigateTo(home)
  }

  // Plan de la empresa: se refresca con ventana de 60s, así que un cambio de
  // plan se ve sin volver a entrar.
  await authStore.fetchSession()

  // Empresa recién creada: se la lleva por la carga inicial en vez de dejarla
  // frente a un sistema vacío. No aplica al chofer, que entra por invitación a
  // una empresa ya configurada.
  const paso = authStore.company?.onboardingStep ?? 0
  if (paso > 0 && !isDriver && !to.path.startsWith('/initial')) {
    return navigateTo('/initial')
  }

  // Funcionalidad exigida por la página. Si el plan no la incluye se va a la
  // pantalla que explica qué incluye y cómo activarla, NO a un 403: el objetivo
  // es vender el upgrade, no dar un error.
  const featurePage = to.meta.feature as string | undefined
  if (featurePage && !authStore.features.includes(featurePage)) {
    return navigateTo(`/upgrade/${featurePage}`)
  }
})
