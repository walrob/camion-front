export const useApi = () => {
  const { $api } = useNuxtApp()

  const get = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    try {
      const res = await $api.get(url, { params })
      return res.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error inesperado'
      throw new Error(message)
    }
  }

  const post = async <T>(url: string, body?: any): Promise<T> => {
    try {
      const res = await $api.post(url, body)
      return res.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error inesperado'
      throw new Error(message)
    }
  }

  const patch = async <T>(url: string, body?: any): Promise<T> => {
    try {
      const res = await $api.patch(url, body)
      return res.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error inesperado'
      throw new Error(message)
    }
  }

  const del = async <T>(url: string): Promise<T> => {
    try {
      const res = await $api.delete(url)
      return res.data
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error inesperado'
      throw new Error(message)
    }
  }

  return { get, post, patch, delete: del }
}
