import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { FEATURE_INFO, type Feature } from '@/types/plan'

/**
 * Acceso a lo que el plan de la empresa habilita.
 *
 * **Esto es experiencia de usuario, no seguridad.** Sirve para mostrar candados
 * y pantallas de upsell en lugar de errores. Quien decide de verdad es el
 * backend: un usuario que manipule el store no gana acceso a nada.
 */
export const useFeatures = () => {
  const auth = useAuthStore()
  const { features, plan, limits, company } = storeToRefs(auth)

  /** ¿El plan incluye esta funcionalidad? */
  const has = (feature: Feature | string): boolean =>
    features.value.includes(feature as string)

  /** Material de venta de una funcionalidad que todavía no está incluida. */
  const info = (feature: Feature | string) =>
    FEATURE_INFO[feature as string] ?? null

  /** Límite del plan, con `null` = ilimitado. */
  const limite = (clave: keyof NonNullable<typeof limits.value>) =>
    limits.value ? limits.value[clave] : null

  return { has, info, limite, features, plan, limits, company }
}
