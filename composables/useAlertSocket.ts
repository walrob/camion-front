import { io, type Socket } from "socket.io-client";

/**
 * Suscripción en vivo al panel de alertas (namespace /alerts del back).
 */
export const useAlertSocket = (
  onNew: (alert: any) => void,
  onUpdate?: (alert: any) => void,
) => {
  let socket: Socket | null = null;

  const connect = () => {
    const config = useRuntimeConfig();
    const base = (config.public.apiBaseUrl as string) || "";
    const host = base.replace(/\/api\/v1\/?$/, "");
    socket = io(`${host}/alerts`, { transports: ["websocket"] });
    socket.on("alert:new", (a: any) => onNew(a));
    socket.on("alert:update", (a: any) => onUpdate?.(a));
  };

  const disconnect = () => {
    socket?.disconnect();
    socket = null;
  };

  return { connect, disconnect };
};
