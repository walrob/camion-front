import type { Socket } from "socket.io-client";
import { crearSocket } from "~/composables/useSocketConexion";

/**
 * Suscripción en vivo al panel de alertas (namespace /alerts del back).
 */
export const useAlertSocket = (
  onNew: (alert: any) => void,
  onUpdate?: (alert: any) => void,
) => {
  let socket: Socket | null = null;

  const connect = () => {
    // El back exige el JWT en el handshake: sin él rechaza la conexión. Es lo
    // que mete al cliente en la sala de su empresa y evita que reciba las
    // alertas de las demás.
    const auth = useAuthStore();
    socket = crearSocket("/alerts", auth.token);
    socket.on("alert:new", (a: any) => onNew(a));
    socket.on("alert:update", (a: any) => onUpdate?.(a));
  };

  const disconnect = () => {
    socket?.disconnect();
    socket = null;
  };

  return { connect, disconnect };
};
