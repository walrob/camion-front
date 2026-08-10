/**
 * Vocabulario del gating por plan. Espejo de `common/enums/feature.enum.ts` del
 * backend: si se agrega una feature allá, va acá también.
 *
 * Se usa para la experiencia de usuario (candados, pantallas de upsell). El
 * control real vive en el backend.
 */
export enum Feature {
  // Base: en todos los planes
  FLEET = 'fleet',
  DOCUMENTS = 'documents',
  ALERTS = 'alerts',
  TRIPS = 'trips',
  CHECKLISTS = 'checklists',
  MESSAGES = 'messages',
  INCIDENTS = 'incidents',
  DRIVER_APP = 'driver_app',

  // Operación
  TRIP_LOG = 'trip_log',
  SETTLEMENTS = 'settlements',
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  OEA = 'oea',
  INCIDENTS_KANBAN = 'incidents_kanban',
  HR_BASIC = 'hr_basic',
  EXPORT_EXCEL = 'export_excel',

  // Gestión
  FUEL_RANKING = 'fuel_ranking',
  INDICATORS = 'indicators',
  HR_FULL = 'hr_full',
  ALERT_THRESHOLDS = 'alert_thresholds',
  AUDITOR_ROLE = 'auditor_role',
  SCHEDULED_REPORTS = 'scheduled_reports',

  // Corporate y add-ons
  API = 'api',
  MULTI_COMPANY = 'multi_company',
  SSO = 'sso',
  SANDBOX = 'sandbox',
  WHITE_LABEL = 'white_label',
}

export interface PlanLimits {
  retentionMonths: number | null
  storageGb: number | null
  alertRules: number | null
  maintenancePlans: number | null
  roles: string[]
}

export interface Company {
  id: string
  name: string
  slug: string
  status: 'trial' | 'active' | 'defaulter' | 'blocked' | 'cancelled'
  trialEndsAt?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
}

/**
 * Cómo se le explica cada funcionalidad a alguien que todavía no la tiene.
 * Es material de venta, no documentación técnica: por eso vive junto al front.
 */
export const FEATURE_INFO: Record<
  string,
  { titulo: string; plan: string; pitch: string; detalle: string[] }
> = {
  [Feature.SETTLEMENTS]: {
    titulo: 'Rendiciones',
    plan: 'Operación',
    pitch:
      'Dejá de discutir la plata del viaje. La rendición se arma sola con lo que cargó el chofer.',
    detalle: [
      'Se genera automáticamente desde la bitácora del viaje',
      'Gastos menos adelantos, con el neto a rendir calculado',
      'PDF firmable como comprobante definitivo',
    ],
  },
  [Feature.TRIP_LOG]: {
    titulo: 'Bitácora en ruta',
    plan: 'Operación',
    pitch:
      'Cada gasto del viaje cargado desde el celular, con la foto del ticket.',
    detalle: [
      'Combustible, peajes, viáticos, adelantos y multas',
      'Comprobante fotográfico por movimiento',
      'Funciona sin señal y sincroniza al recuperar conexión',
    ],
  },
  [Feature.FUEL]: {
    titulo: 'Combustible',
    plan: 'Operación',
    pitch: 'Cuánto consume cada camión y cada chofer, alineado con los km.',
    detalle: ['km/l, l/100 km y costo por km', 'Carga desde la app con foto del ticket'],
  },
  [Feature.MAINTENANCE]: {
    titulo: 'Mantenimiento',
    plan: 'Operación',
    pitch: 'El sistema te avisa antes de que el camión llegue al service.',
    detalle: [
      'Planes preventivos por km, horas o fecha',
      'Órdenes de trabajo con costos y adjuntos',
      'Comprobante en PDF para el taller',
    ],
  },
  [Feature.OEA]: {
    titulo: 'Planillas OEA',
    plan: 'Operación',
    pitch: 'La inspección de los 7 puntos AFIP firmada y lista para mostrar.',
    detalle: ['Fotos por ítem y precintos', 'Firma digital del chofer'],
  },
  [Feature.INCIDENTS_KANBAN]: {
    titulo: 'Tablero de incidentes',
    plan: 'Operación',
    pitch: 'Los problemas de la ruta ordenados por estado, en vivo.',
    detalle: ['Kanban con responsable y severidad', 'Línea de tiempo y comentarios'],
  },
  [Feature.INDICATORS]: {
    titulo: 'Indicadores',
    plan: 'Gestión',
    pitch: 'El número que hoy no tenés: cuánto te cuesta cada kilómetro.',
    detalle: [
      'Costo por km, rendimiento y costos extraordinarios',
      'Filtros por flota, camión y chofer',
      'Exportación de todos los reportes',
    ],
  },
  [Feature.HR_BASIC]: {
    titulo: 'Legajos',
    plan: 'Operación',
    pitch: 'Los papeles del personal con sus vencimientos, en un solo lugar.',
    detalle: ['Carnet, LiNTI/CNRT, psicofísico y carga peligrosa', 'Aviso antes de que venzan'],
  },
  [Feature.HR_FULL]: {
    titulo: 'Historial laboral',
    plan: 'Gestión',
    pitch:
      'Licencias, suspensiones y reincorporaciones, con el estado calculado solo.',
    detalle: [
      'El sistema bloquea asignar un viaje a alguien de licencia',
      'Panel de quién está fuera de servicio hoy',
    ],
  },
  [Feature.FUEL_RANKING]: {
    titulo: 'Ranking de consumo',
    plan: 'Gestión',
    pitch: 'Qué chofer rinde mejor con el mismo camión.',
    detalle: ['Comparativa por camión y por chofer'],
  },
  [Feature.EXPORT_EXCEL]: {
    titulo: 'Exportación a Excel',
    plan: 'Operación',
    pitch: 'Bajate cualquier listado filtrado para trabajarlo aparte.',
    detalle: ['Viajes, combustible y documentos'],
  },
}
