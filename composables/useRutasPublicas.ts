/**
 * Qué rutas se pueden ver sin sesión.
 *
 * Vive aparte del middleware para poder testearlo: es la pieza donde un error
 * no rompe una pantalla sino que **deja todo el sistema abierto**.
 *
 * ⚠️ La trampa: la raíz `/` NO puede compararse con `startsWith`, porque
 * `'/admin'.startsWith('/')` es `true` y con eso **toda la aplicación pasaría a
 * ser pública**. La raíz se compara por igualdad exacta y el resto por prefijo.
 */

/** Rutas públicas que se comparan por igualdad exacta. */
export const RUTAS_PUBLICAS_EXACTAS = [
  '/', // landing — NUNCA por prefijo
] as const

/** Rutas públicas que se comparan por prefijo (incluyen sus subrutas). */
export const RUTAS_PUBLICAS_POR_PREFIJO = [
  '/planes',
  '/contacto',
  '/para-transportistas',
  '/politica-de-privacidad',
  '/terminos-y-condiciones',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  // Confirmación de la casilla: la usa quien todavía no puede iniciar sesión,
  // que es exactamente lo que este link viene a destrabar.
  '/auth/verify-email',
  // Alta de empresa y aceptación de invitación: las usa gente que todavía no
  // tiene cuenta, así que por definición no pueden exigir sesión.
  '/auth/registro-empresa',
  '/invite',
] as const

/** ¿Esta ruta se puede ver sin haber iniciado sesión? */
export function esRutaPublica(path: string): boolean {
  // Se normaliza la barra final para que `/planes/` y `/planes` sean lo mismo.
  const limpio =
    path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if ((RUTAS_PUBLICAS_EXACTAS as readonly string[]).includes(limpio)) {
    return true
  }

  return (RUTAS_PUBLICAS_POR_PREFIJO as readonly string[]).some(
    (r) => limpio === r || limpio.startsWith(`${r}/`),
  )
}
