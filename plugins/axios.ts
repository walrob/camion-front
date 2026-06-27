import axios from "axios";
import { useAuthStore } from "@/stores/auth";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
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
        authStore.clearAuth();
        navigateTo("/auth/login");
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
