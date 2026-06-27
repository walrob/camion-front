import { ref } from 'vue'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy?: number | null
}

/**
 * Geolocalización por GPS del celular del chofer.
 * Usa la Web Geolocation API (compatible con PWA y webview de Capacitor).
 * No bloquea el flujo si el usuario deniega el permiso: resuelve null.
 *
 * Patrón reutilizado de components/form/AddressWithGeo.vue. Se puede sumar
 * @capacitor/geolocation como fallback nativo cuando se instale el plugin.
 */
export const useGeolocation = () => {
  const lat = ref<number | null>(null)
  const lng = ref<number | null>(null)
  const accuracy = ref<number | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const getPosition = (): Promise<GeoPosition | null> => {
    return new Promise((resolve) => {
      if (!import.meta.client || !('geolocation' in navigator)) {
        error.value = 'Geolocalización no disponible en este dispositivo.'
        resolve(null)
        return
      }

      loading.value = true
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lat.value = position.coords.latitude
          lng.value = position.coords.longitude
          accuracy.value = position.coords.accuracy
          error.value = null
          loading.value = false
          resolve({ lat: lat.value, lng: lng.value, accuracy: accuracy.value })
        },
        (err) => {
          error.value = err.message
          loading.value = false
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      )
    })
  }

  return { lat, lng, accuracy, error, loading, getPosition }
}
