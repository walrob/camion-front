import { defineStore } from 'pinia'
import type { User } from '~/types/project'
import {
  persistGet,
  persistRemove,
  persistSet,
} from '~/composables/usePersist'
import { Role } from '~/types/enums'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    expiresAt: null as Date | null,
    user: null as User | null,
    loading: false,
    lastUserEmail: '' as string,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === Role.ADMIN,
    isManager: (state) => state.user?.role === Role.MANAGER,
    isDispatcher: (state) => state.user?.role === Role.DISPATCHER,
    isMaintenance: (state) => state.user?.role === Role.MAINTENANCE,
    isDriver: (state) => state.user?.role === Role.DRIVER,
    isHr: (state) => state.user?.role === Role.HR,
    isAuditor: (state) => state.user?.role === Role.AUDITOR,
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
      await persistRemove('token')
      await persistRemove('expiresAt')
      await persistRemove('user')
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
