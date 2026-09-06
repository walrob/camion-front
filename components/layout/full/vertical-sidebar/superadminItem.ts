import {
  LayoutDashboardIcon,
  BuildingIcon,
  TagsIcon,
  ReceiptIcon,
  CreditCardIcon,
  ClipboardTextIcon,
} from "vue-tabler-icons";
import type { menu } from "./sidebarItem";

/**
 * Menú del panel de plataforma.
 *
 * Misma forma que `sidebarItem.ts` y se dibuja con los mismos `NavGroup` /
 * `NavItem`: quien opera la plataforma no tiene por qué aprender una segunda
 * interfaz.
 *
 * Lo que no lleva es `roles` ni `feature`. Acá no hay plan que gatear ni rol
 * que filtrar —entra sólo `superadmin` y ve todo—, así que el candado y el
 * upsell de `NavItem` quedan inertes por no declarar `feature`.
 *
 * Agrupado por para qué se entra: mirar cómo va el negocio, cobrarlo, y
 * después poder reconstruir qué se hizo.
 */
const superadminItems: menu[] = [
  { header: "Plataforma" },
  {
    title: "Tablero",
    icon: LayoutDashboardIcon,
    to: "/superadmin",
    // Exacto: sin esto queda encendido en todas las pantallas de abajo, porque
    // `/superadmin` es prefijo de todas.
    exact: true,
  },
  { title: "Empresas", icon: BuildingIcon, to: "/superadmin/empresas" },

  { header: "Facturación" },
  { title: "Planes", icon: TagsIcon, to: "/superadmin/planes" },
  { title: "Cobranzas", icon: ReceiptIcon, to: "/superadmin/cobranzas" },
  { title: "Pagos", icon: CreditCardIcon, to: "/superadmin/pagos" },

  { header: "Control" },
  { title: "Auditoría", icon: ClipboardTextIcon, to: "/superadmin/auditoria" },
];

export default superadminItems;
