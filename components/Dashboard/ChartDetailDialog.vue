<script setup lang="ts">
// Modal "Ver todos": el mismo gráfico de barras del tablero pero con la lista
// completa (según filtro) y alto dinámico. Soporta estado de carga propio para
// los detalles que se piden al backend al abrir (ej. Indicadores).
const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

const model = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    title: string;
    caption?: string;
    series: any[];
    options: any;
    height?: number;
    loading?: boolean;
    emptyText?: string;
  }>(),
  { height: 360, emptyText: "Sin datos en el período." },
);
</script>

<template>
  <v-dialog v-model="model" max-width="920" scrollable>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center pe-2">
        <span class="text-subtitle-1 font-weight-bold">
          {{ title }}
          <span
            v-if="caption"
            class="text-caption text-medium-emphasis font-weight-regular"
          >
            {{ caption }}
          </span>
        </span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="model = false" />
      </v-card-title>
      <v-divider />
      <v-card-text style="max-height: 70vh">
        <div
          v-if="loading"
          class="d-flex justify-center align-center"
          style="min-height: 240px"
        >
          <v-progress-circular indeterminate color="primary" />
        </div>
        <ClientOnly v-else-if="series[0]?.data?.length">
          <VueApexCharts
            type="bar"
            :height="height"
            :options="options"
            :series="series"
          />
        </ClientOnly>
        <p v-else class="text-caption text-medium-emphasis py-8 text-center">
          {{ emptyText }}
        </p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
