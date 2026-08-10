export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  isTemplateDark?: boolean
  /** Cuenta demo de solo lectura (ver/descargar; el backend bloquea escrituras). */
  isDemo?: boolean
}

export interface UserProfile {
  name: string
  phone?: string
  birthDate?: string
}

/**
 * Domicilio con geolocalización opcional. Lo usan el alta de usuario
 * (`AuthRegisterForm`) y el selector de dirección con mapa (`FormAddressWithGeo`).
 */
export interface UserAddress {
  id: string
  street: string
  city: string
  province: string
  isDefault: boolean
  latitude?: number
  longitude?: number
}
