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
