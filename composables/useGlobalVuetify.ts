import { getCurrentInstance } from "vue";

export function useGlobalVuetify() {
  // Si estamos en un componente
  const internalInstance = getCurrentInstance();
  if (internalInstance) {
    // @ts-ignore
    return internalInstance.appContext.config.globalProperties.$vuetify;
  }

  // Si estamos fuera de un componente (por ejemplo, en un store)
  // @ts-ignore
  return (globalThis as any).$nuxt?._vueApp?.config?.globalProperties?.$vuetify;
}
