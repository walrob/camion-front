/**
 * Encabezado de la app del chofer.
 *
 * El layout `driver` dibuja un hero con degradado que ocupa todo el ancho y del
 * que cuelga la hoja de contenido. Como el título vive ahí —fuera de la página—
 * cada pantalla lo declara con este composable en vez de renderizar su propio
 * <h1>, y el layout es la única fuente del encabezado.
 *
 * Las acciones de la pantalla (un "Reportar", un "Registrar carga") se envían al
 * hero con <Teleport to="#driver-hero-actions">, así el botón sigue siendo del
 * componente que conoce su lógica.
 */
export interface DriverPageMeta {
  title: string;
  /** Línea de apoyo bajo el título, en el degradado. */
  subtitle?: string;
  /** Ruta del botón "volver". Si se omite, no se muestra (pantalla raíz). */
  back?: string;
}

const EMPTY: DriverPageMeta = { title: "" };

export const useDriverPageState = () =>
  useState<DriverPageMeta>("driver-page", () => ({ ...EMPTY }));

export const useDriverPage = (meta: MaybeRefOrGetter<DriverPageMeta>) => {
  const state = useDriverPageState();

  // `watchEffect` en vez de una asignación suelta: los títulos derivados de datos
  // que llegan por fetch (ej. el código del viaje) se refrescan solos.
  watchEffect(() => {
    state.value = toValue(meta);
  });

  // Sin esto, al volver a una pantalla sin título quedaría el de la anterior.
  onUnmounted(() => {
    state.value = { ...EMPTY };
  });
};
