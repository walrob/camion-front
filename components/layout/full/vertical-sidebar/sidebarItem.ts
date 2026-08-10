import {
  LayoutDashboardIcon,
  TruckIcon,
  UsersIcon,
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
    to: "/",
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
];

export default sidebarItem;
