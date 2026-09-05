import type { Socket } from "socket.io-client";
import { crearSocket } from "~/composables/useSocketConexion";

export const useMessageSocket = (onNew: (message: any) => void) => {
  let socket: Socket | null = null;

  const connect = () => {
    // El back exige el JWT en el handshake: sin él rechaza la conexión. Es lo
    // que mete al cliente en la sala de su empresa y evita que reciba los
    // mensajes de las demás.
    const auth = useAuthStore();
    socket = crearSocket("/messages", auth.token);
    socket.on("message:new", (m: any) => onNew(m));
  };

  const disconnect = () => {
    socket?.disconnect();
    socket = null;
  };

  return { connect, disconnect };
};
