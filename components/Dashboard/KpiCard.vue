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
</script>

<template>
  <v-card :to="to" :ripple="!!to" rounded="lg" border flat class="pa-4 h-100">
    <div class="d-flex align-center justify-space-between">
      <div style="min-width: 0">
        <div class="text-caption text-medium-emphasis text-truncate">{{ label }}</div>
        <div class="text-h5 font-weight-bold mt-1">{{ value }}</div>
        <div v-if="delta !== undefined" class="text-caption mt-1 d-flex align-center" :class="deltaClass">
          <v-icon size="14" class="mr-1">
            {{ delta >= 0 ? "mdi-trending-up" : "mdi-trending-down" }}
          </v-icon>
          {{ Math.abs(delta) }}%
        </div>
      </div>
      <v-avatar :color="tone" variant="tonal" rounded="lg" size="44">
        <v-icon :color="tone">{{ icon }}</v-icon>
      </v-avatar>
    </div>
  </v-card>
</template>
