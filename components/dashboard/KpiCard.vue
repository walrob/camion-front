<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    icon: string;
    /** Nombre de color del tema (primary, error, warning, success, info, secondary, accent). */
    tone?: string;
    /** Ruta de drill-down opcional: la card se vuelve clickeable. */
    to?: string;
    /** Variación % vs período anterior (opcional; requiere histórico del backend). */
    delta?: number;
    /** Si subir es "bueno" (verde) o "malo" (rojo). Default: true. */
    deltaGoodWhenUp?: boolean;
    /** Contra qué compara el delta, ej. "vs. 7 días previos". */
    deltaHint?: string;
    /**
     * Serie del período para el sparkline de fondo. Un KPI sin forma no dice si
     * el número viene subiendo o si es un pico aislado: son dos decisiones
     * distintas con el mismo valor.
     */
    series?: number[];
    /**
     * El plan no incluye la métrica. Se muestra un candado en vez del valor: un
     * cero sería un dato falso, no un dato acotado.
     */
    locked?: boolean;
  }>(),
  { tone: "primary", deltaGoodWhenUp: true },
);

const deltaClass = computed(() => {
  if (props.delta === undefined) return "";
  const up = props.delta >= 0;
  return up === props.deltaGoodWhenUp ? "text-success" : "text-error";
});

/**
 * Sparkline en SVG y no con la librería de gráficos: son hasta ocho por
 * pantalla y ninguno necesita ejes, tooltip ni interacción. Montar ocho
 * instancias de ApexCharts para dibujar ocho polilíneas cuesta más que todo el
 * resto del panel junto.
 */
const spark = computed(() => {
  const s = props.series;
  if (!s || s.length < 2 || props.locked) return null;
  const max = Math.max(...s);
  const min = Math.min(...s);
  // Serie plana: la línea va al medio en vez de dividir por cero.
  const rango = max - min || 1;
  const paso = 100 / (s.length - 1);
  const puntos = s.map((v, i) => {
    const x = (i * paso).toFixed(2);
    const y = (22 - ((v - min) / rango) * 18).toFixed(2);
    return `${x},${y}`;
  });
  return { linea: puntos.join(" "), area: `0,24 ${puntos.join(" ")} 100,24` };
});

// El tono se propaga como variable CSS para teñir el velo, la barra superior y
// el ícono con un único color, en vez de repetirlo en cada binding.
const toneVar = computed(() => ({ "--tone": `var(--v-theme-${props.tone})` }));
</script>

<template>
  <v-card
    :to="to"
    :ripple="!!to"
    rounded="lg"
    border
    flat
    class="pa-4 h-100 kpi-card"
    :style="toneVar"
  >
    <!--
      Sparkline al fondo de la tarjeta: la forma del período detrás del número,
      sin robarle lugar al valor ni al delta.
    -->
    <svg
      v-if="spark"
      class="kpi-card__spark"
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon :points="spark.area" :fill="`rgba(var(--tone), 0.12)`" />
      <polyline
        :points="spark.linea"
        fill="none"
        :stroke="`rgb(var(--tone))`"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="d-flex align-center justify-space-between kpi-card__body">
      <div style="min-width: 0">
        <div class="text-caption text-medium-emphasis text-truncate">
          {{ label }}
        </div>
        <div v-if="locked" class="d-flex align-center mt-1">
          <v-icon size="20" color="medium-emphasis" class="mr-1">
            mdi-lock-outline
          </v-icon>
          <span class="text-body-2 text-medium-emphasis">No incluido</span>
        </div>
        <div v-else class="text-h5 font-weight-bold mt-1">{{ value }}</div>
        <div
          v-if="delta !== undefined && !locked"
          class="text-caption mt-1 d-flex align-center"
          :class="deltaClass"
        >
          <v-icon size="14" class="mr-1">
            {{ delta >= 0 ? "mdi-trending-up" : "mdi-trending-down" }}
          </v-icon>
          {{ Math.abs(delta) }}%
          <span v-if="deltaHint" class="text-medium-emphasis ml-1">
            {{ deltaHint }}
          </span>
        </div>
      </div>
      <v-avatar rounded="lg" size="44" class="kpi-card__icon">
        <v-icon :color="tone">{{ icon }}</v-icon>
      </v-avatar>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.kpi-card {
  position: relative;
  overflow: hidden;

  // Velo diagonal del color del KPI: apenas perceptible, pero le da temperatura
  // a la tarjeta y hace que la fila de KPIs se lea como un grupo de colores.
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(var(--tone), 0.07) 0%,
      rgba(var(--tone), 0) 55%
    );
  }

  // Filete superior en el tono, como pestaña de color de la tarjeta.
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      rgb(var(--tone)) 0%,
      rgba(var(--tone), 0.25) 100%
    );
  }

  // El sparkline vive detrás del contenido, pegado al borde inferior.
  &__spark {
    position: absolute;
    inset: auto 0 0 0;
    height: 38px;
    width: 100%;
    opacity: 0.55;
    pointer-events: none;
  }

  &__body {
    position: relative;
    z-index: 1;
  }

  &__icon {
    background: rgba(var(--tone), 0.12);
    transition: transform 0.25s ease;
  }

  &:hover &__icon {
    transform: scale(1.08);
  }
}
</style>
