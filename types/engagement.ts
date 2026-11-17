/**
 * Emails automáticos de activación y re-enganche (módulo `engagement` del
 * back). Los segmentos y los pasos se definen allá, en `engagement.rules.ts`.
 */

export type EngagementSegment =
  | "unverified"
  | "activation"
  | "first_trip"
  | "inactive";

/** Cómo se lee cada segmento en el panel, y cuándo sale cada paso. */
export const SEGMENTOS: Record<
  EngagementSegment,
  { letra: string; nombre: string; pasos: string[] }
> = {
  unverified: {
    letra: "A",
    nombre: "Correo sin confirmar",
    pasos: ["1 h", "24 h", "3 días"],
  },
  activation: {
    letra: "B",
    nombre: "Sin primer viaje",
    pasos: ["Día 1", "Día 3", "Día 7"],
  },
  first_trip: {
    letra: "C",
    nombre: "Primer viaje",
    pasos: ["Al cargarlo"],
  },
  inactive: {
    letra: "D",
    nombre: "Empresa inactiva",
    pasos: ["7 días", "14 días", "30 días"],
  },
};

/** Qué cuenta como "activación posterior" en cada segmento. */
export const ACTIVACION: Record<EngagementSegment, string> = {
  unverified: "Confirmó el correo",
  activation: "Cargó un viaje",
  first_trip: "Dio la app a un chofer o cargó un vencimiento",
  inactive: "Alguien de la empresa volvió a entrar",
};

export interface EngagementRateRow {
  segment: EngagementSegment;
  step?: number;
  sent: number;
  clicks: number;
  activated: number;
  clickRate: number;
  activationRate: number;
}

export interface EngagementMetrics {
  days: number;
  enabled: boolean;
  dryRun: boolean;
  businessHoursNow: boolean;
  optedOut: number;
  segments: EngagementRateRow[];
  steps: EngagementRateRow[];
}

export interface EngagementPreviewItem {
  userId: string;
  email: string;
  name: string;
  companyName: string;
  segment: EngagementSegment;
  step: number;
  subject: string;
}

export interface EmailOptOut {
  name: string;
  email: string;
  optOut: boolean;
}
