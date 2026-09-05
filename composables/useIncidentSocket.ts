import type { Socket } from "socket.io-client";
import { crearSocket } from "~/composables/useSocketConexion";
import type { Incident } from "~/types/incident";

/**
 * Suscripción en vivo al tablero de incidentes (namespace /incidents del back).
 * El host y la ruta del handshake los resuelve `crearSocket`.
 */
export const useIncidentSocket = (onChange: (incident: Incident) => void) => {
  let socket: Socket | null = null;

  const connect = () => {
    // El back exige el JWT en el handshake: sin él rechaza la conexión. Es lo
    // que mete al cliente en la sala de su empresa y evita que reciba los
    // incidentes de las demás.
    const auth = useAuthStore();
    socket = crearSocket("/incidents", auth.token);
    socket.on("incident:new", (incident: Incident) => onChange(incident));
    socket.on("incident:update", (incident: Incident) => onChange(incident));
  };

  const disconnect = () => {
    socket?.disconnect();
    socket = null;
  };

  return { connect, disconnect };
};
