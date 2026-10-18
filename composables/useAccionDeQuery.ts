import { onMounted, watch } from "vue";

/**
 * Ejecuta una acción pedida por query param (`?nuevo=1`, `?buscar=AB123CD`) y
 * la borra de la URL con `router.replace`, para que recargar o volver atrás no
 * la repita.
 *
 * Además de al montar, vigila la query: si el buscador (Ctrl+K) pide «Nuevo
 * viaje» estando ya en Viajes, la página no se vuelve a montar.
 */
export function useAccionDeQuery(
  param: string,
  ejecutar: (valor: string) => void,
) {
  const route = useRoute();
  const router = useRouter();

  const consumir = () => {
    const valor = route.query[param];
    if (typeof valor !== "string") return;
    const { [param]: _, ...resto } = route.query;
    router.replace({ query: resto });
    ejecutar(valor);
  };

  onMounted(consumir);
  watch(() => route.query[param], (v) => v !== undefined && consumir());
}
