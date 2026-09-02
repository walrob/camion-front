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
  /** Viático de monto fijo del viaje, cuando la empresa paga así (§6.4). */
  perDiemAmount?: number | null;
  perDiemCurrency?: string | null;
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
  /** Totales por tipo, **en moneda base** (docs/CONFIGURACION.md §7.2). */
  byType: Record<string, number>;
  /** Subtotales en la moneda en que se gastó, para el viaje internacional. */
  byCurrency?: Record<string, number>;
  totalExpenses: number;
  totalAdvances: number;
  netToSettle: number;
  count: number;
  /** Movimientos en otra moneda todavía sin cotización: no suman al total. */
  pendingFx?: number;
  /** Moneda base de la empresa, en la que están los totales. */
  currency?: string;
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
