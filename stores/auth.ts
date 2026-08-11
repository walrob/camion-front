import { defineStore } from 'pinia'
import type { User } from '~/types/project'
import {
  persistGet,
  persistRemove,
  persistSet,
} from '~/composables/usePersist'
import { Role } from '~/types/enums'
import type { Company, PlanLimits } from '~/types/plan'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    expiresAt: null as Date | null,
    user: null as User | null,
    loading: false,
    lastUserEmail: '' as string,

    // ── Situación comercial de la empresa ──────────────────────────────────
    // No sale del token: el JWT dura un día y dejaría el plan congelado. Se
    // refresca contra `GET /auth/session`, que es la fuente de verdad.
    company: null as Company | null,
    plan: null as { code: string; name: string } | null,
    features: [] as string[],
    limits: null as PlanLimits | null,
    /** Consumo y tope de almacenamiento, para avisar antes de chocar el límite. */
    storage: null as {
      usedBytes: number
      maxGb: number | null
      siguienteEscalonGb: number | null
    } | null,
    /** Momento de la última lectura de la sesión, para no pedirla en cada ruta. */
    sessionFetchedAt: null as number | null,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === Role.ADMIN,
    isManager: (state) => state.user?.role === Role.MANAGER,
    isDispatcher: (state) => state.user?.role === Role.DISPATCHER,
    isMaintenance: (state) => state.user?.role === Role.MAINTENANCE,
    isDriver: (state) => state.user?.role === Role.DRIVER,
    isHr: (state) => state.user?.role === Role.HR,
    isAuditor: (state) => state.user?.role === Role.AUDITOR,
    /** Cuenta demo de solo lectura: no puede modificar datos (lo bloquea el backend). */
    isDemo: (state) => !!state.user?.isDemo,

    /**
     * ¿El plan de la empresa incluye esta funcionalidad?
     *
     * Sirve para la experiencia de usuario (mostrar el candado, no romper la
     * pantalla). El control real lo hace el backend: acá no se decide nada de
     * seguridad.
     */
    hasFeature: (state) => (feature: string) => state.features.includes(feature),
  },

  actions: {
    async setAuth(token: string, expiresAt: string, user: any) {
      this.token = token
      this.expiresAt = new Date(expiresAt)
      this.user = user

      await persistSet('token', token)
      await persistSet('expiresAt', expiresAt)
      await persistSet('user', JSON.stringify(user))
    },

    async updateAuth(user: any) {
      this.user = user
      await persistSet('user', JSON.stringify(user))
    },

    async clearAuth() {
      this.token = null
      this.expiresAt = null
      this.user = null
      this.company = null
      this.plan = null
      this.features = []
      this.limits = null
      this.storage = null
      this.sessionFetchedAt = null
      await persistRemove('token')
      await persistRemove('expiresAt')
      await persistRemove('user')
      await persistRemove('session')
    },

    /**
     * Trae plan, features y límites vigentes.
     *
     * `force` fuerza la lectura; si no, se respeta una ventana de 60 segundos
     * para no pedirlo en cada navegación. Ese número acompaña a la caché del
     * backend: no tiene sentido preguntar más seguido de lo que él recalcula.
     */
    async fetchSession(force = false) {
      if (!this.token) return
      const FRESCO_MS = 60_000
      if (
        !force &&
        this.sessionFetchedAt &&
        Date.now() - this.sessionFetchedAt < FRESCO_MS
      ) {
        return
      }

      try {
        const { get } = useApi()
        const data: any = await get('auth/session')
        this.company = data?.company ?? null
        this.plan = data?.plan ?? null
        this.features = data?.features ?? []
        this.limits = data?.limits ?? null
        this.storage = data?.storage ?? null
        this.sessionFetchedAt = Date.now()
        await persistSet(
          'session',
          JSON.stringify({
            company: this.company,
            plan: this.plan,
            features: this.features,
            limits: this.limits,
          }),
        )
      } catch {
        // Si falla, se sigue con lo último conocido: es preferible una pantalla
        // desactualizada a dejar al usuario sin menú. El backend igual bloquea
        // lo que no corresponda.
      }
    },

    async logout() {
      await this.clearAuth()
    },

    async loadAuth() {
      const now = new Date()
      const token = await persistGet('token')
      const expiresAt = await persistGet('expiresAt')
      const userStr = await persistGet('user')

      if (!token || !expiresAt) return
      const expDate = new Date(expiresAt)
      if (now > expDate) {
        await this.clearAuth()
        return
      }
      this.token = token
      this.expiresAt = expDate
      this.user = userStr ? JSON.parse(userStr) : null

      // Se rehidrata lo último conocido para que el menú no parpadee mientras
      // llega la sesión fresca.
      const sessionStr = await persistGet('session')
      if (sessionStr) {
        try {
          const s = JSON.parse(sessionStr)
          this.company = s.company ?? null
          this.plan = s.plan ?? null
          this.features = s.features ?? []
          this.limits = s.limits ?? null
        } catch {
          // Persistencia corrupta: se ignora y se pide de nuevo.
        }
      }
    },

    isLoggedIn() {
      return !!this.token
    },

    async setLastUserEmail(email: string) {
      this.lastUserEmail = email
      await persistSet('lastUserEmail', email)
    },

    async loadLastUserEmail() {
      const email = await persistGet('lastUserEmail')
      this.lastUserEmail = email || ''
      return email || ''
    },
  },
})
