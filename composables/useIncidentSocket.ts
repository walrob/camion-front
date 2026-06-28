import { io, type Socket } from "socket.io-client";
import type { Incident } from "~/types/incident";

/**
 * Suscripción en vivo al tablero de incidentes (namespace /incidents del back).
 * Reusa NUXT_BASE_URL quitando el sufijo /api/v1 para apuntar al host del socket.
 */
export const useIncidentSocket = (onChange: (incident: Incident) => void) => {
  let socket: Socket | null = null;

  const connect = () => {
    const config = useRuntimeConfig();
    const base = (config.public.apiBaseUrl as string) || "";
    const host = base.replace(/\/api\/v1\/?$/, "");

    socket = io(`${host}/incidents`, { transports: ["websocket"] });
    socket.on("incident:new", (incident: Incident) => onChange(incident));
    socket.on("incident:update", (incident: Incident) => onChange(incident));
  };

  const disconnect = () => {
    socket?.disconnect();
    socket = null;
  };

  return { connect, disconnect };
};
