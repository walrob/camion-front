import {
  LayoutDashboardIcon,
  TruckIcon,
  UsersIcon,
  UserPlusIcon,
  IdIcon,
  RouteIcon,
  ReceiptIcon,
  AlertTriangleIcon,
  BellIcon,
  ToolIcon,
  FileTextIcon,
  ChartBarIcon,
  MessageIcon,
  GasStationIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  HelpIcon,
  SettingsIcon,
} from "vue-tabler-icons";
import { Role } from "~/types/enums";
import { Feature } from "~/types/plan";

export interface menu {
  header?: string;
  title?: string;
  icon?: any;
  to?: string;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
  external?: boolean;
  roles?: string[];
  /**
   * Feature del plan que habilita el ítem. Si el plan no la incluye, el ítem
   * NO se oculta: se muestra en gris con candado y linkea a la pantalla de
   * upgrade. Es una decisión comercial explícita (MODELO-COMERCIAL §6.2): el
   * cliente tiene que ver todos los días lo que le falta.
   */
  feature?: Feature;
}

// Menú del backoffice de flota, agrupado por dominio de uso diario:
// Inicio (resumen), Operación (viajes en vivo), Flota (activos),
// Personal (choferes/RRHH) y Administración (finanzas y compliance).
const sidebarItem: menu[] = [
  { header: "Inicio" },
  {
    title: "Panel",
    icon: LayoutDashboardIcon,
    to: "/admin",
    external: false,
  },
  {
    title: "Indicadores",
    icon: ChartBarIcon,
    to: "/admin/indicadores",
    feature: Feature.INDICATORS,
    roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR],
  },

  { header: "Operación" },
  {
    title: "Viajes",
    icon: RouteIcon,
    to: "/admin/viajes",
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.AUDITOR],
  },
  {
    title: "Incidentes",
    icon: AlertTriangleIcon,
    to: "/admin/incidentes",
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.MAINTENANCE],
  },
  {
    title: "Alertas",
    icon: BellIcon,
    to: "/admin/alertas",
    roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.HR],
  },
  {
    title: "Mensajes",
    icon: MessageIcon,
    to: "/admin/mensajes",
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER],
  },

  { header: "Flota" },
  {
    title: "Flota",
    icon: TruckIcon,
    to: "/admin/flota",
    roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.MAINTENANCE],
  },
  {
    title: "Mantenimiento",
    icon: ToolIcon,
    to: "/admin/mantenimiento",
    feature: Feature.MAINTENANCE,
    roles: [Role.ADMIN, Role.MAINTENANCE, Role.MANAGER],
  },
  {
    title: "Combustible",
    icon: GasStationIcon,
    to: "/admin/combustible",
    feature: Feature.FUEL,
    roles: [
      Role.ADMIN,
      Role.MANAGER,
      Role.DISPATCHER,
      Role.MAINTENANCE,
      Role.AUDITOR,
    ],
  },
  {
    title: "Documentos",
    icon: FileTextIcon,
    to: "/admin/documentos",
    roles: [Role.ADMIN, Role.MAINTENANCE, Role.DISPATCHER, Role.MANAGER],
  },

  { header: "Personal" },
  {
    title: "RRHH",
    icon: IdIcon,
    to: "/admin/rrhh",
    feature: Feature.HR_BASIC,
    roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.DISPATCHER],
  },
  {
    title: "Choferes",
    icon: UsersIcon,
    to: "/admin/choferes",
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.HR],
  },
  {
    // Accesos de gente sin legajo (contador, despachante tercerizado, auditor).
    // El personal en relación de dependencia entra por RRHH.
    title: "Equipo",
    icon: UserPlusIcon,
    to: "/admin/equipo",
    roles: [Role.ADMIN, Role.MANAGER],
  },

  { header: "Administración" },
  {
    title: "Rendiciones",
    icon: ReceiptIcon,
    to: "/admin/liquidaciones",
    feature: Feature.SETTLEMENTS,
    roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR],
  },
  {
    title: "Planillas OEA",
    icon: ClipboardCheckIcon,
    to: "/admin/oea",
    feature: Feature.OEA,
    roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.AUDITOR],
  },

  { header: "Cuenta" },
  {
    // La suscripción a CamioNex, no la plata de los viajes: por eso va en su
    // propia sección y no en Administración.
    //
    // Sin feature: nunca se bloquea por plan — es la pantalla donde se paga, y
    // sigue accesible incluso con la cuenta suspendida (lista blanca del
    // `AccountStatusGuard`). Los roles son los de `GET billing/quote`, que es lo
    // que la pantalla necesita para cargar.
    title: "Mi plan",
    icon: CreditCardIcon,
    to: "/estado-plan",
    roles: [Role.ADMIN, Role.MANAGER],
  },
  {
    // Ajustes de operación: qué exige el sistema antes de que salga un camión,
    // si una rendición cerrada se puede reabrir, etc. Sólo `admin` porque
    // cambian el comportamiento para toda la empresa, choferes incluidos.
    title: "Configuración",
    icon: SettingsIcon,
    to: "/configuracion",
    feature: Feature.SETTINGS,
    roles: [Role.ADMIN],
  },

  { header: "Ayuda" },
  {
    // Sin `roles` ni `feature`: el manual lo lee cualquiera, con cualquier plan.
    // Va último a propósito — es consulta, no operación —, pero visible todos
    // los días: un manual que hay que pedir por email no lo abre nadie.
    title: "Manual de Usuario",
    icon: HelpIcon,
    to: "/manual-usuario",
    external: false,
  },
];

export default sidebarItem;
