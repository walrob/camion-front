// Tipos base del dominio de flota. Cada fase amplía estos tipos.
import type { Employee } from "~/types/hr"

export type TruckStatus =
  | 'available'
  | 'on_trip'
  | 'stopped'
  | 'workshop'
  | 'out_of_service'

export type TrailerStatus =
  | 'available'
  | 'in_use'
  | 'workshop'
  | 'out_of_service'

export type DriverStatus = 'active' | 'on_trip' | 'inactive'

export type TripStatus = 'assigned' | 'in_progress' | 'finished' | 'canceled'

export interface Audit {
  id: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface Fleet extends Audit {
  name: string
  code: string
  notes?: string
  isActive?: boolean
}

export interface Truck extends Audit {
  plate: string
  internalNumber?: string
  brand?: string
  model?: string
  year?: number
  type?: string
  loadCapacityKg?: number
  currentOdometerKm?: number
  engineHours?: number
  status: TruckStatus
  fleetId?: string | null
  fleet?: Fleet | null
}

export interface Trailer extends Audit {
  plate: string
  type?: string
  loadCapacityKg?: number
  status: TrailerStatus
  isActive?: boolean
}

export interface Driver extends Audit {
  // Un chofer ES un empleado de RRHH: el dato personal (nombre, documento,
  // teléfono, email) vive en `employee`, no acá. Driver solo guarda lo operativo.
  employeeId: string
  employee?: Employee
  licenseNumber?: string
  licenseType?: string
  licenseExpiry?: string
  status: DriverStatus
  notes?: string
}

export interface Trip extends Audit {
  code: string
  truckId: string
  trailerId?: string | null
  driverId: string
  clientId?: string | null
  origin: string
  destination: string
  cargoDescription?: string
  plannedStartAt?: string
  plannedEndAt?: string
  startedAt?: string | null
  finishedAt?: string | null
  startOdometerKm?: number | null
  endOdometerKm?: number | null
  distanceKm?: number | null
  status: TripStatus
  notes?: string
}
