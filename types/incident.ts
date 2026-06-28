import type { Audit, Truck, Driver } from "~/types/fleet";

export interface IncidentEvent {
  id: string;
  at: string;
  userId?: string;
  action: string;
  note?: string;
}

export interface Incident extends Audit {
  code: string;
  tripId?: string | null;
  truckId: string;
  truck?: Truck;
  driverId: string;
  driver?: Driver;
  type: string;
  severity: string;
  status: string;
  assignedToUserId?: string | null;
  lat?: number | null;
  lng?: number | null;
  description: string;
  resolvedAt?: string | null;
  events?: IncidentEvent[];
}
