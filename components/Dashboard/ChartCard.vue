<script setup lang="ts">
// Card de gráfico de los tableros: título + subtítulo opcional, botón para
// ampliar y el gráfico ApexCharts —diferido y envuelto en <ClientOnly>— con su
// estado de "sin datos".
//
// Ampliar es una acción universal: cualquier gráfico se puede ver en grande.
// Hay dos maneras de resolverla y la card elige sola:
//
//   · Con `has-full-detail`, el gráfico es un recorte (Top N) y el conjunto
//     completo lo tiene el padre: la card emite `expandFull` y el padre abre su
//     propio ChartDetailDialog con los datos que trae del backend.
//   · Sin esa prop, la card abre un modal propio con su misma serie, solo que
//     más grande. No requiere ninguna configuración en el padre.
import { computed, ref } from "vue";
import ChartDetailDialog from "./ChartDetailDialog.vue";
import EmptyState from "~/components/shared/EmptyState.vue";

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

const props = withDefaults(
  defineProps<{
    title: string;
    /** Aclaración en gris junto al título, ej. "(Top 10 · en miles $)". */
    caption?: string;
    series: any[];
    options: any;
    /** Tipo de ApexCharts: bar, donut, line, area… */
    type?: string;
    height?: number | string;
    /** El padre tiene el conjunto completo y abre su propio modal al expandir. */
    hasFullDetail?: boolean;
    /** Color del botón de ampliar (para acompañar el color de la serie). */
    expandColor?: string;
    emptyText?: string;
    emptyIcon?: string;
    /** Alto del gráfico dentro del modal propio. */
    detailHeight?: number;
  }>(),
  {
    type: "bar",
    height: 300,
    expandColor: "primary",
    emptyText: "Sin datos en el período.",
    emptyIcon: "mdi-chart-box-outline",
    detailHeight: 420,
  },
);

const emit = defineEmits<{ expandFull: [] }>();

// Las series vienen con dos formas según el tipo: `[{ data: [...] }]` en barras
// y líneas, y un array plano de números en donut/pie/radial.
const hasData = computed(() => {
  const first = props.series?.[0];
  if (first == null) return false;
  return typeof first === "number" ? true : !!first?.data?.length;
});

const ownDetail = ref(false);

const expand = () => {
  if (props.hasFullDetail) emit("expandFull");
  else ownDetail.value = true;
};
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
      <!--
        El ícono se muestra siempre que haya algo que ampliar. Que el gráfico
        esté recortado o no lo aclara el `caption` ("Top 10"), no este botón:
        acá el significado es uno solo, "verlo en grande".
      -->
      <IconBtn
        v-if="hasData"
        tooltip="Ampliar gráfico"
        icon="mdi-arrow-expand"
        size="small"
        variant="text"
        :color="expandColor"
        @click="expand"
      />
    </div>

    <ClientOnly>
      <VueApexCharts
        v-if="hasData"
        :type="type"
        :height="height"
        :options="options"
        :series="series"
      />
      <EmptyState v-else :icon="emptyIcon" :text="emptyText" />
    </ClientOnly>

    <!-- Modal propio: solo cuando el detalle completo no lo maneja el padre. -->
    <ChartDetailDialog
      v-if="!hasFullDetail"
      v-model="ownDetail"
      :title="title"
      :caption="caption"
      :type="type"
      :series="series"
      :options="options"
      :height="detailHeight"
      :empty-text="emptyText"
    />
  </v-card>
</template>
