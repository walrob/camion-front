export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  isTemplateDark?: boolean
}

export interface UserProfile {
  name: string
  phone?: string
  birthDate?: string
}
