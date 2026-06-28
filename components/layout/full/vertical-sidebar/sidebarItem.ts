import {
  LayoutDashboardIcon,
  TruckIcon,
  UsersIcon,
  IdIcon,
  RouteIcon,
  ReceiptIcon,
  AlertTriangleIcon,
  BellIcon,
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
    title: 'Choferes',
    icon: UsersIcon,
    to: '/admin/choferes',
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.HR],
  },
  {
    title: 'RRHH',
    icon: IdIcon,
    to: '/admin/rrhh',
    roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.DISPATCHER],
  },
]

export default sidebarItem
