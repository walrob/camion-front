<script setup lang="ts">
// Modal de gráfico ampliado. Sirve a los dos casos: el gráfico recortado que al
// abrirse trae el conjunto completo desde el backend (por eso el `loading`
// propio) y el que simplemente se ve más grande.
const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

const model = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    title: string;
    caption?: string;
    series: any[];
    options: any;
    /** Tipo de ApexCharts: bar, donut, line, area… */
    type?: string;
    height?: number;
    loading?: boolean;
    emptyText?: string;
  }>(),
  {
    type: "bar",
    height: 360,
    emptyText: "Sin datos en el período.",
  },
);

// Las series vienen con dos formas según el tipo: `[{ data: [...] }]` en barras
// y líneas, y un array plano de números en donut/pie/radial.
const hasData = computed(() => {
  const first = props.series?.[0];
  if (first == null) return false;
  return typeof first === "number" ? true : !!first?.data?.length;
});
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
        <IconBtn
          tooltip="Cerrar"
          icon="mdi-close"
          variant="text"
          @click="model = false"
        />
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
        <ClientOnly v-else-if="hasData">
          <VueApexCharts
            :type="type"
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
