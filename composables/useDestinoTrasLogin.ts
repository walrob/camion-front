/**
 * A dónde ir después de iniciar sesión.
 *
 * Quien toca un link de un email ("Cargar mi primer camión") sin la sesión
 * iniciada pasa por el login; después tiene que llegar a donde iba, no al
 * panel. El middleware guarda el destino en `?redirect=` y el login lo usa.
 *
 * Sólo se aceptan rutas **internas**: `//otro-sitio.com` o `/\otro-sitio.com`
 * son URLs de otro dominio para el navegador, y aceptarlas convertiría el
 * login en una redirección abierta —el clásico para phishing: un link de
 * camionex.com.ar que termina en otra página que pide la contraseña—.
 * Tampoco se vuelve a una pantalla de acceso, que dejaría al usuario en loop.
 *
 * Es una función pura, sin Nuxt, para poder testearla
 * (`useDestinoTrasLogin.spec.ts`).
 */
export function destinoTrasLogin(redirect: unknown, porDefecto: string): string {
  if (typeof redirect !== 'string') return porDefecto
  if (!redirect.startsWith('/')) return porDefecto
  if (redirect.startsWith('//') || redirect.startsWith('/\\')) return porDefecto
  if (redirect.startsWith('/auth/') || redirect === '/auth') return porDefecto
  return redirect
}
