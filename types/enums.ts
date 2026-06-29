export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISPATCHER = 'dispatcher',
  MAINTENANCE = 'maintenance',
  DRIVER = 'driver',
  HR = 'hr',
  AUDITOR = 'auditor',
}

export type Priority = 'baja' | 'normal' | 'alta' | 'urgente'

export interface Snackbar {
  color: string
  timeout?: number
  message: string
}

export interface Pagination {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: Pagination
}
