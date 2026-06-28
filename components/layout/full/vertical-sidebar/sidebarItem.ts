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
} from 'vue-tabler-icons'
import { Role } from '~/types/enums'

export interface menu {
  header?: string
  title?: string
  icon?: any
  to?: string
  chip?: string
  chipColor?: string
  chipVariant?: string
  chipIcon?: string
  children?: menu[]
  disabled?: boolean
  type?: string
  subCaption?: string
  external?: boolean
  roles?: string[]
  plan?: string
}

// Menú del backoffice de flota. Cada fase agrega sus ítems (viajes, incidentes,
// alertas, mantenimiento, documentos, RRHH, indicadores).
const sidebarItem: menu[] = [
  { header: 'Principal' },
  {
    title: 'Panel',
    icon: LayoutDashboardIcon,
    to: '/',
    external: false,
  },

  { header: 'Operación' },
  {
    title: 'Viajes',
    icon: RouteIcon,
    to: '/admin/viajes',
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.AUDITOR],
  },
  {
    title: 'Incidentes',
    icon: AlertTriangleIcon,
    to: '/admin/incidentes',
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.MAINTENANCE],
  },
  {
    title: 'Alertas',
    icon: BellIcon,
    to: '/admin/alertas',
    roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.HR],
  },
  {
    title: 'Liquidaciones',
    icon: ReceiptIcon,
    to: '/admin/liquidaciones',
    roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR],
  },
  {
    title: 'Flota',
    icon: TruckIcon,
    to: '/admin/flota',
    roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.MAINTENANCE],
  },
  {
    title: 'Mantenimiento',
    icon: ToolIcon,
    to: '/admin/mantenimiento',
    roles: [Role.ADMIN, Role.MAINTENANCE, Role.MANAGER],
  },
  {
    title: 'Choferes',
    icon: UsersIcon,
    to: '/admin/choferes',
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.HR],
  },
  {
    title: 'Documentos',
    icon: FileTextIcon,
    to: '/admin/documentos',
    roles: [Role.ADMIN, Role.MAINTENANCE, Role.DISPATCHER, Role.MANAGER],
  },
  {
    title: 'RRHH',
    icon: IdIcon,
    to: '/admin/rrhh',
    roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.DISPATCHER],
  },
  {
    title: 'Indicadores',
    icon: ChartBarIcon,
    to: '/admin/indicadores',
    roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR],
  },
]

export default sidebarItem
