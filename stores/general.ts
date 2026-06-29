import { defineStore } from 'pinia'
import type { Snackbar } from '~/types/enums'
import { extractErrorMessage } from '~/composables/useApiError'

export const useGeneralStore = defineStore('general', {
  state: () => ({
    snackbar: {
      state: false,
      color: 'primary',
      timeout: 4000,
      message: '',
    },
    loading: false,
  }),

  actions: {
    setSnackbar(payload: Snackbar) {
      this.snackbar.state = true
      this.snackbar.message = payload.message
      this.snackbar.color = payload.color || this.snackbar.color
      this.snackbar.timeout = payload.timeout || this.snackbar.timeout
    },

    setErrorSnackbar(error?: any) {
      this.setSnackbar({
        color: 'error',
        message: extractErrorMessage(error),
      })
    },

    setSuccessSnackbar(message?: string) {
      this.setSnackbar({
        color: 'success',
        message: message || 'Operación exitosa',
      })
    },
  },
})
