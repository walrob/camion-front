import {
  LayoutDashboardIcon,
} from 'vue-tabler-icons'

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

// Menú del backoffice de flota. Cada fase agrega sus ítems (flota, choferes,
// viajes, incidentes, alertas, mantenimiento, documentos, RRHH, indicadores).
const sidebarItem: menu[] = [
  { header: 'Principal' },
  {
    title: 'Panel',
    icon: LayoutDashboardIcon,
    to: '/',
    external: false,
  },
]

export default sidebarItem
