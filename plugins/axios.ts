import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useGeneralStore } from "@/stores/general";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const generalStore = useGeneralStore();
  const api = axios.create({
    baseURL: config.public.apiBaseUrl,
    headers: {
      common: {
        ...(axios.defaults.headers.common || {}),
      },
    },
  });

  // REQUEST INTERCEPTOR
  api.interceptors.request.use(
    (config) => {
      // const { $i18n }: any = useNuxtApp();
      const token = authStore.token;
      // config.headers["Accept-Language"] = $i18n.locale.value;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // RESPONSE INTERCEPTOR
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Solo redirigir a login por 401 si el usuario tenía una sesión activa.
      // Si es un guest (sin token), no redirigir para no interrumpir el flujo de compra.
      if (error.response?.status === 401 && authStore.token) {
        // Si lo que venció es una sesión de soporte, se vuelve al superadmin
        // en vez de dejarlo en el login.
        const volverA = (await authStore.tieneSesionDeSoporte())
          ? await authStore.salirDeSoporte()
          : null;
        if (!volverA) await authStore.clearAuth();
        navigateTo(volverA ?? "/auth/login");
      }
      // Sesión de soporte (superadmin viendo a un cliente): mismo caso.
      if (
        error.response?.status === 403 &&
        error.response?.data?.error === "IMPERSONATION_READ_ONLY"
      ) {
        generalStore.setSnackbar({
          color: "info",
          message: "Modo soporte: solo lectura. Esta acción no está disponible.",
        });
      }
      return Promise.reject(error);
    }
  );

  return {
    provide: {
      api,
    },
  };
});
