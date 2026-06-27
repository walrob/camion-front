import type { Audit, Truck, Trailer, Driver } from "~/types/fleet";

export interface Trip extends Audit {
  code: string;
  truckId: string;
  truck?: Truck;
  trailerId?: string | null;
  trailer?: Trailer | null;
  driverId: string;
  driver?: Driver;
  clientId?: string | null;
  origin: string;
  destination: string;
  cargoDescription?: string;
  plannedStartAt?: string | null;
  plannedEndAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  startOdometerKm?: number | null;
  endOdometerKm?: number | null;
  distanceKm?: number | null;
  status: string;
  notes?: string;
}

export interface TripLogEntry extends Audit {
  tripId: string;
  type: string;
  amount: number;
  currency: string;
  liters?: number | null;
  odometerKm?: number | null;
  lat?: number | null;
  lng?: number | null;
  occurredAt?: string;
  notes?: string;
}

export interface TripLogSummary {
  byType: Record<string, number>;
  totalExpenses: number;
  totalAdvances: number;
  netToSettle: number;
  count: number;
}

export interface Settlement extends Audit {
  tripId: string;
  trip?: Trip;
  totalsByType?: Record<string, number>;
  totalExpenses: number;
  totalAdvances: number;
  netToSettle: number;
  currency: string;
  status: string;
  pdfKey?: string | null;
}
