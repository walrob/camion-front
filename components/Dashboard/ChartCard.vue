<script setup lang="ts">
// Card de gráfico de barras de los tableros: título + subtítulo opcional, botón
// "Ver todos" opcional (para abrir el detalle completo) y el gráfico ApexCharts
// —diferido y envuelto en <ClientOnly>— con su mensaje de "sin datos".
const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

withDefaults(
  defineProps<{
    title: string;
    /** Aclaración en gris junto al título, ej. "(Top 10 · en miles $)". */
    caption?: string;
    series: any[];
    options: any;
    height?: number | string;
    /** Muestra el botón "Ver todos". */
    showAll?: boolean;
    seeAllColor?: string;
    emptyText?: string;
  }>(),
  { height: 300, seeAllColor: "primary", emptyText: "Sin datos en el período." },
);

defineEmits<{ seeAll: [] }>();
</script>

<template>
  <v-card border flat rounded="lg" class="pa-4 h-100">
    <div class="d-flex align-center mb-2">
      <div class="text-subtitle-2 font-weight-bold">
        {{ title }}
        <span
          v-if="caption"
          class="text-caption text-medium-emphasis font-weight-regular"
        >
          {{ caption }}
        </span>
      </div>
      <v-spacer />
      <v-btn
        v-if="showAll"
        size="small"
        variant="text"
        :color="seeAllColor"
        append-icon="mdi-arrow-expand"
        @click="$emit('seeAll')"
      >
        Ver todos
      </v-btn>
    </div>
    <ClientOnly>
      <VueApexCharts
        v-if="series[0]?.data?.length"
        type="bar"
        :height="height"
        :options="options"
        :series="series"
      />
      <p v-else class="text-caption text-medium-emphasis">{{ emptyText }}</p>
    </ClientOnly>
  </v-card>
</template>
