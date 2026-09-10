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
  /** Cambiar los ajustes de operación de la empresa. Leerlos no se gatea. */
  SETTINGS = 'settings',
  /** Plantilla propia del checklist pre-viaje. */
  CHECKLIST_TEMPLATES = 'checklist_templates',
  /** Editar los catálogos de negocio: tipos de gasto, de incidente, etc. */
  CATALOGS = 'catalogs',

  // Gestión
  FUEL_RANKING = 'fuel_ranking',
  INDICATORS = 'indicators',
  HR_FULL = 'hr_full',
  ALERT_THRESHOLDS = 'alert_thresholds',
  /** Una plantilla de checklist distinta por tipo de unidad. */
  CHECKLIST_BY_TYPE = 'checklist_by_type',
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
  /** Paso pendiente del onboarding guiado. `0` = terminado. */
  onboardingStep?: number

  // ── Datos de facturación ──
  // Son los que la administración usa para emitir el comprobante del abono, y
  // pueden no coincidir con los operativos: se factura a una razón social y un
  // domicilio fiscal que el cliente declara.
  cuit?: string | null
  invoiceName?: string | null
  invoiceCuit?: string | null
  invoiceEmail?: string | null
  invoiceTaxCondition?: string | null
  invoiceAddress?: string | null
  billingDay?: number
}

/**
 * Condición frente al IVA, igual que `TaxCondition` en el backend.
 *
 * Define qué comprobante corresponde: a un responsable inscripto va una factura
 * A y a los demás una B. Sin este dato la administración no puede emitir.
 */
export const TAX_CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'responsable_inscripto', label: 'Responsable inscripto' },
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor final' },
  { value: 'no_alcanzado', label: 'No alcanzado' },
]

export const taxConditionLabel = (v?: string | null): string =>
  TAX_CONDITION_OPTIONS.find((o) => o.value === v)?.label ?? '—'

/** Un período facturado, tal como lo devuelve `GET /billing/subscriptions`. */
export interface BillingPeriod {
  id: string
  periodStart: string
  periodEnd: string
  expiration: string
  amount: number
  status: 'issued' | 'paid' | 'overdue' | 'void'
  isPaid: boolean
  paidAt?: string | null
  isProrated: boolean
  /** Presente sólo si la administración ya cargó el comprobante. */
  invoiceKey?: string | null
  invoiceNumber?: string | null
  invoiceUploadedAt?: string | null
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
  [Feature.SETTINGS]: {
    titulo: 'Configuración de la operación',
    plan: 'Operación',
    pitch: 'Que el sistema se adapte a cómo trabajás, y no al revés.',
    detalle: [
      'Elegí qué se exige antes de que salga un camión',
      'Bloqueá la asignación si hay documentación vencida',
      'Definí si una rendición cerrada se puede reabrir',
      'Tu propio prefijo para el número de viaje',
    ],
  },
  [Feature.CHECKLIST_TEMPLATES]: {
    titulo: 'Checklist a tu medida',
    plan: 'Operación',
    pitch: 'El chofer revisa lo que vos decidís, no una lista genérica.',
    detalle: [
      'Agregá, renombrá y ordená los puntos a revisar',
      'Puntos críticos: si fallan, el camión no sale',
      'Puntos que exigen foto de la falla para poder firmar',
    ],
  },
  [Feature.CATALOGS]: {
    titulo: 'Catálogos a tu medida',
    plan: 'Operación',
    pitch: 'Que las listas del sistema hablen como habla tu operación.',
    detalle: [
      'Tus propios tipos de gasto (balanza, lavadero, estacionamiento)',
      'Marcá cuáles son adelantos: restan solos en la rendición',
      'Tus tipos de incidente, con el nombre que usan tus choferes',
    ],
  },
  [Feature.CHECKLIST_BY_TYPE]: {
    titulo: 'Checklist por tipo de unidad',
    plan: 'Gestión',
    pitch: 'Un tractor con cisterna no se revisa como un furgón.',
    detalle: [
      'Una plantilla distinta por tipo de camión',
      'La general sigue aplicando al resto de la flota',
    ],
  },
}
