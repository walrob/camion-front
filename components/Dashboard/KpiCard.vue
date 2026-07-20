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
  }>(),
  { tone: "primary", deltaGoodWhenUp: true },
);

const deltaClass = computed(() => {
  if (props.delta === undefined) return "";
  const up = props.delta >= 0;
  return up === props.deltaGoodWhenUp ? "text-success" : "text-error";
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
    <div class="d-flex align-center justify-space-between">
      <div style="min-width: 0">
        <div class="text-caption text-medium-emphasis text-truncate">
          {{ label }}
        </div>
        <div class="text-h5 font-weight-bold mt-1">{{ value }}</div>
        <div
          v-if="delta !== undefined"
          class="text-caption mt-1 d-flex align-center"
          :class="deltaClass"
        >
          <v-icon size="14" class="mr-1">
            {{ delta >= 0 ? "mdi-trending-up" : "mdi-trending-down" }}
          </v-icon>
          {{ Math.abs(delta) }}%
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

  &__icon {
    background: rgba(var(--tone), 0.12);
    transition: transform 0.25s ease;
  }

  &:hover &__icon {
    transform: scale(1.08);
  }
}
</style>
