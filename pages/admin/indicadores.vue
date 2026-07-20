<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import ReportFilters from "~/components/shared/ReportFilters.vue";
import ChartCard from "~/components/dashboard/ChartCard.vue";
import ChartDetailDialog from "~/components/dashboard/ChartDetailDialog.vue";
import { onMounted, computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useIndicatorStore } from "~/stores/indicator";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "auditor"],
});
useHead({ title: "Indicadores" });

const store = useIndicatorStore();
const { summary, loading, truckOptions, driverOptions, fleetOptions } =
  storeToRefs(store);

const { money, num } = useFormatters();
const { barOptions } = useBarChart();

const kpis = computed(() => {
  const s = summary.value;
  if (!s) return [];
  return [
    {
      label: "Gasto por km",
      value: money(s.costPerKm),
      icon: "mdi-cash",
      tone: "primary",
    },
    {
      label: "Rendimiento (l/100km)",
      value: s.fuelEfficiency,
      icon: "mdi-gas-station-outline",
      tone: "info",
    },
    {
      label: "Gastos totales",
      value: money(s.totalExpenses),
      icon: "mdi-cash-multiple",
      tone: "success",
    },
    {
      label: "Distancia (km)",
      value: num(s.totalDistanceKm),
      icon: "mdi-map-marker-distance",
      tone: "secondary",
    },
    {
      label: "Costos extraordinarios",
      value: money(s.extraordinaryCosts),
      icon: "mdi-alert-octagon-outline",
      tone: "error",
    },
    {
      label: "Resol. incidentes (h)",
      value: s.incidentResolutionAvgHours,
      icon: "mdi-timer-sand",
      tone: "warning",
    },
    {
      label: "Disponibilidad flota",
      value: `${s.fleetAvailabilityPct}%`,
      icon: "mdi-truck-check-outline",
      tone: "primary",
    },
  ];
});

const barByTruck = computed(() => {
  const data = summary.value?.expenseByTruck ?? [];
  return {
    series: [{ name: "Gasto", data: data.map((d: any) => d.total) }],
    options: barOptions(
      "primary",
      data.map((d: any) => d.key),
      true,
    ),
  };
});

const barByDriver = computed(() => {
  const data = summary.value?.expenseByDriver ?? [];
  return {
    series: [{ name: "Gasto", data: data.map((d: any) => d.total) }],
    options: barOptions(
      "success",
      data.map((d: any) => d.key),
      true,
    ),
  };
});

// ── Modal "Ver todos": gráfico grande con la lista completa (según filtro) ──
const detailOpen = ref(false);
const detailGroup = ref<"truck" | "driver">("truck");

const openDetail = (group: "truck" | "driver") => {
  detailGroup.value = group;
  detailOpen.value = true;
  store.getExpenseDetail(group);
};

const detailTitle = computed(() =>
  detailGroup.value === "truck" ? "Gasto por camión" : "Gasto por chofer",
);

const detailChart = computed(() => {
  const items = store.expenseDetail;
  const color = detailGroup.value === "truck" ? "primary" : "success";
  return {
    series: [{ name: "Gasto", data: items.map((d) => d.total) }],
    options: barOptions(
      color,
      items.map((d) => d.key),
      true,
    ),
  };
});

// Altura dinámica: ~34px por barra horizontal para que no se apretujen.
const detailHeight = computed(() =>
  Math.max(360, store.expenseDetail.length * 34),
);

onMounted(async () => {
  await store.loadOptions();
  store.getSummary();
});
</script>

<template>
  <div>
    <PageHeader
      title="Indicadores"
      subtitle="KPIs operativos con filtros y exportación"
    >
      <template #actions>
        <v-btn
          color="success"
          prepend-icon="mdi-file-excel"
          @click="store.exportXlsx()"
        >
          Exportar Excel
        </v-btn>
      </template>
    </PageHeader>

    <ReportFilters
      :filters="store.filters"
      :truck-options="truckOptions"
      :driver-options="driverOptions"
      :fleet-options="fleetOptions"
      :loading="loading"
      show-fleet
      @apply="store.getSummary()"
    />

    <!-- Carga inicial -->
    <div v-if="loading && !summary" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="summary">
      <!-- KPIs -->
      <v-row dense class="mb-2">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
          <KpiCard
            :label="k.label"
            :value="k.value"
            :icon="k.icon"
            :tone="k.tone"
          />
        </v-col>
      </v-row>

      <!-- Gráficos -->
      <v-row dense>
        <v-col cols="12" md="6">
          <ChartCard
            title="Gasto por camión"
            caption="(Top 10 · en miles $)"
            :series="barByTruck.series"
            :options="barByTruck.options"
            :has-full-detail="barByTruck.series[0].data.length >= 10"
            @expand-full="openDetail('truck')"
          />
        </v-col>
        <v-col cols="12" md="6">
          <ChartCard
            title="Gasto por chofer"
            caption="(Top 10 · en miles $)"
            expand-color="success"
            :series="barByDriver.series"
            :options="barByDriver.options"
            :has-full-detail="barByDriver.series[0].data.length >= 10"
            @expand-full="openDetail('driver')"
          />
        </v-col>
      </v-row>
    </template>

    <!-- Modal: detalle completo de gastos (todos los ítems del filtro) -->
    <ChartDetailDialog
      v-model="detailOpen"
      :title="detailTitle"
      caption="(todos · en miles $)"
      :series="detailChart.series"
      :options="detailChart.options"
      :height="detailHeight"
      :loading="store.detailLoading"
    />
  </div>
</template>
