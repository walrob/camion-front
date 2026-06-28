import { io, type Socket } from "socket.io-client";

export const useMessageSocket = (onNew: (message: any) => void) => {
  let socket: Socket | null = null;

  const connect = () => {
    const config = useRuntimeConfig();
    const base = (config.public.apiBaseUrl as string) || "";
    const host = base.replace(/\/api\/v1\/?$/, "");
    socket = io(`${host}/messages`, { transports: ["websocket"] });
    socket.on("message:new", (m: any) => onNew(m));
  };

  const disconnect = () => {
    socket?.disconnect();
    socket = null;
  };

  return { connect, disconnect };
};
