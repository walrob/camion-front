import { io, type Socket } from "socket.io-client";

/**
 * Ruta HTTP por la que socket.io hace el handshake.
 *
 * Tiene que ser **idéntica** a `RUTA_SOCKET_IO` del backend
 * (`src/common/tenant/tenant.gateway.ts`). El default de socket.io es
 * `/socket.io`, que en producción nunca llega al backend: nginx enruta por
 * prefijo y sólo `/api/` apunta ahí, así que el handshake cae en el frontend y
 * responde 404. Colgada de `/api` viaja por la misma regla que el resto de la
 * API.
 */
export const RUTA_SOCKET_IO = "/api/socket.io";

/**
 * Conecta a un namespace del backend con el JWT de la sesión.
 *
 * Esto estaba repetido en los tres composables de tiempo real, con la ruta y
 * los transportes escritos a mano en cada uno. Como los tres comparten un único
 * servidor de socket.io, alcanzaba con que uno quedara desincronizado para que
 * ese namespace dejara de conectar sin que nada más diera señales.
 *
 * **No se fija `transports` a propósito.** Antes era `["websocket"]` a secas,
 * que exige que el proxy reenvíe la cabecera `Upgrade`: si no lo hace, la
 * conexión no se establece y no hay reintento que la salve. Con el default,
 * socket.io arranca por long-polling —HTTP común, que cualquier proxy deja
 * pasar— y sube a WebSocket recién cuando comprueba que se puede. Anda en los
 * dos escenarios, con y sin cabeceras de upgrade en nginx.
 */
export const crearSocket = (
  namespace: string,
  token: string | null,
): Socket => {
  const config = useRuntimeConfig();
  const base = (config.public.apiBaseUrl as string) || "";
  // El host del socket es el de la API sin el prefijo: socket.io no cuelga del
  // versionado de la API, sino de `RUTA_SOCKET_IO`.
  const host = base.replace(/\/api\/v1\/?$/, "");

  return io(`${host}${namespace}`, {
    path: RUTA_SOCKET_IO,
    auth: { token },
  });
};
