export default defineNuxtRouteMiddleware(async (to) => {
  // const origin = window.location.origin;
  // const isMobileApp = false;
  // // origin.startsWith("capacitor://") ||
  // // origin.startsWith("http://localhost") ||
  // // origin.startsWith("https://localhost");
  // const authStore = useAuthStore();
  // await authStore.loadAuth();
  // // Si abre la app sin ruta específica ("/")
  // if (isMobileApp && to.path === "/") {
  //   if (authStore.token) {
  //     // ✅ Está logueado
  //     return navigateTo("/dashboard");
  //   } else {
  //     // 🚪 No logueado
  //     return navigateTo("/auth/login");
  //   }
  // }
});
