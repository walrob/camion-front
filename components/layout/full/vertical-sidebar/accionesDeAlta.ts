import { Role } from "~/types/enums";
import { Feature } from "~/types/plan";

/**
 * Altas frecuentes: las comparten el menú «Crear» del header y el buscador
 * (Ctrl+K), así que no pueden quedar desparejas.
 *
 * Los `roles` son los del endpoint de alta en el back (`@Auth` del `POST`), no
 * los de la pantalla: ofrecer «Nuevo viaje» a un auditor, que entra a Viajes
 * pero no puede crear, sólo le muestra un 403.
 *
 * El `?nuevo=…` lo lee la pantalla de destino (`useAccionDeQuery`): abre el
 * diálogo de alta y se borra de la URL.
 */
export interface AccionDeAlta {
  title: string;
  to: string;
  icon: string;
  roles: Role[];
  /** Si el plan no la incluye, la acción no se ofrece. */
  feature?: Feature;
  /** Otras formas de pedirla: cuentan para encontrarla, no para ordenarla. */
  keywords?: string;
}

export const ACCIONES_DE_ALTA: AccionDeAlta[] = [
  {
    title: "Nuevo viaje",
    to: "/admin/viajes?nuevo=1",
    icon: "mdi-map-marker-path",
    roles: [Role.ADMIN, Role.DISPATCHER],
    keywords: "asignar viaje despachar salida",
  },
  {
    title: "Nuevo camión",
    to: "/admin/flota?tab=trucks&nuevo=camion",
    icon: "mdi-truck-outline",
    roles: [Role.ADMIN, Role.MANAGER],
    keywords: "unidad flota patente",
  },
  {
    title: "Nuevo acoplado",
    to: "/admin/flota?tab=trailers&nuevo=acoplado",
    icon: "mdi-truck-trailer",
    roles: [Role.ADMIN, Role.MANAGER],
    keywords: "semirremolque batea flota patente",
  },
  {
    title: "Nuevo chofer",
    to: "/admin/choferes?nuevo=1",
    icon: "mdi-account-plus-outline",
    roles: [Role.ADMIN, Role.DISPATCHER],
    keywords: "licencia",
  },
  {
    title: "Nuevo empleado",
    to: "/admin/rrhh?nuevo=1",
    icon: "mdi-badge-account-outline",
    roles: [Role.ADMIN, Role.HR],
    feature: Feature.HR_BASIC,
    keywords: "legajo rrhh personal",
  },
  {
    title: "Nuevo documento",
    to: "/admin/documentos?nuevo=1",
    icon: "mdi-file-upload-outline",
    roles: [Role.ADMIN, Role.MAINTENANCE, Role.DISPATCHER],
    keywords: "subir archivo vencimiento seguro vtv",
  },
  {
    title: "Nueva orden de trabajo",
    to: "/admin/mantenimiento?nuevo=orden",
    icon: "mdi-wrench-outline",
    roles: [Role.ADMIN, Role.MAINTENANCE],
    feature: Feature.MAINTENANCE,
    keywords: "ot mantenimiento reparacion",
  },
  {
    title: "Nuevo plan de mantenimiento",
    to: "/admin/mantenimiento?nuevo=plan",
    icon: "mdi-calendar-sync-outline",
    roles: [Role.ADMIN, Role.MAINTENANCE],
    feature: Feature.MAINTENANCE,
    keywords: "preventivo service",
  },
  {
    title: "Generar rendición",
    to: "/admin/liquidaciones?nuevo=1",
    icon: "mdi-file-document-plus-outline",
    roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR],
    feature: Feature.SETTLEMENTS,
    keywords: "liquidacion gastos cierre",
  },
  {
    title: "Invitar a alguien",
    to: "/admin/equipo?nuevo=1",
    icon: "mdi-account-arrow-right-outline",
    roles: [Role.ADMIN],
    keywords: "usuario acceso equipo",
  },
];

/** Acciones que este usuario puede usar con su rol y su plan. */
export function accionesDeAltaVisibles(
  role: string | null | undefined,
  has: (feature: string) => boolean,
): AccionDeAlta[] {
  if (!role) return [];
  return ACCIONES_DE_ALTA.filter(
    (a) =>
      a.roles.includes(role as Role) && (!a.feature || has(a.feature)),
  );
}
