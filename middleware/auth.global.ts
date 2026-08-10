import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useAuthStore } from '@/stores/auth'

const publicRoutes = ['/auth/login', '/auth/forgot-password', '/auth/reset-password']

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  await authStore.loadAuth()

  const isPublic = publicRoutes.some((r) => to.path.startsWith(r))
  const userRole = authStore.user?.role || ''
  const isDriver = userRole === 'driver'
  const home = isDriver ? '/chofer' : '/'

  // Si la ruta es pública y el usuario ya está autenticado, redirigir a su home por rol
  if (isPublic && authStore.token) {
    return navigateTo(home)
  }

  // Si la ruta es pública, dejar pasar
  if (isPublic) {
    return
  }

  // Si no está autenticado en ruta privada, redirigir a login
  if (!authStore.token) {
    return navigateTo('/auth/login')
  }

  // Encaminar por rol: el chofer vive en /chofer (app móvil); el resto en el backoffice.
  if (isDriver && !to.path.startsWith('/chofer')) {
    return navigateTo('/chofer')
  }
  if (!isDriver && to.path.startsWith('/chofer')) {
    return navigateTo('/')
  }

  // Si está autenticado, verificar roles requeridos por la página
  const rolesPage = to.meta.roles as string[] | undefined
  if (rolesPage && rolesPage.length > 0) {
    if (!rolesPage.includes(userRole)) {
      return navigateTo(home)
    }
  }

  // Plan de la empresa: se refresca con ventana de 60s, así que un cambio de
  // plan se ve sin volver a entrar.
  await authStore.fetchSession()

  // Funcionalidad exigida por la página. Si el plan no la incluye se va a la
  // pantalla que explica qué incluye y cómo activarla, NO a un 403: el objetivo
  // es vender el upgrade, no dar un error.
  const featurePage = to.meta.feature as string | undefined
  if (featurePage && !authStore.features.includes(featurePage)) {
    return navigateTo(`/upgrade/${featurePage}`)
  }
})
