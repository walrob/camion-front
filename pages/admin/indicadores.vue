<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import { onMounted, computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useIndicatorStore } from "~/stores/indicator";

// ApexCharts diferido: se carga en un chunk aparte solo al renderizar el gráfico.
const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "auditor"],
});
useHead({ title: "Indicadores" });

const store = useIndicatorStore();
const { summary, loading, truckOptions, driverOptions, fleetOptions } =
  storeToRefs(store);

// Colores de gráficos: paleta suave y armónica del tema (igual que el dashboard).
const { chartHex: hex } = useChartColors();

const money = (n?: number) => `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;
const num = (n?: number) => Number(n ?? 0).toLocaleString("es-AR");

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

// Eje compacto en miles de pesos ("$250k") para evitar montos con muchos ceros.
const moneyK = (v: any) => {
  const n = Number(v) || 0;
  return `$${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}k`;
};

const barOptions = (color: string, categories: string[], asMoney = false) => ({
  chart: {
    type: "bar" as const,
    fontFamily: "inherit",
    toolbar: { show: false },
  },
  xaxis: {
    categories,
    labels: asMoney ? { formatter: moneyK } : {},
  },
  colors: [hex(color)],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
  dataLabels: { enabled: false },
  grid: { borderColor: "rgba(0,0,0,0.06)" },
  tooltip: asMoney ? { y: { formatter: (v: number) => money(v) } } : {},
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

    <!-- Filtros -->
    <v-card border flat rounded="lg" class="pa-3 mb-4">
      <v-row dense align="center">
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="store.filters.fleetId"
            :items="fleetOptions"
            item-title="name"
            item-value="id"
            label="Flota"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.truckId"
            :items="truckOptions"
            item-value="id"
            :item-title="(t: any) => t.plate"
            label="Camión"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.driverId"
            :items="driverOptions"
            item-value="id"
            :item-title="(d: any) => driverName(d)"
            label="Chofer"
            clearable
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field
            v-model="store.filters.from"
            label="Desde"
            type="date"
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field v-model="store.filters.to" label="Hasta" type="date" />
        </v-col>
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            color="primary"
            prepend-icon="mdi-filter-check-outline"
            :loading="loading"
            @click="store.getSummary()"
          >
            Aplicar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

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
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-2 font-weight-bold">
                Gasto por camión
                <span
                  class="text-caption text-medium-emphasis font-weight-regular"
                  >(Top 10 · en miles $)</span
                >
              </div>
              <v-spacer />
              <v-btn
                v-if="barByTruck.series[0].data.length >= 10"
                size="small"
                variant="text"
                color="primary"
                append-icon="mdi-arrow-expand"
                @click="openDetail('truck')"
              >
                Ver todos
              </v-btn>
            </div>
            <ClientOnly>
              <VueApexCharts
                v-if="barByTruck.series[0].data.length"
                type="bar"
                height="300"
                :options="barByTruck.options"
                :series="barByTruck.series"
              />
              <p v-else class="text-caption text-medium-emphasis">
                Sin datos en el período.
              </p>
            </ClientOnly>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-2 font-weight-bold">
                Gasto por chofer
                <span
                  class="text-caption text-medium-emphasis font-weight-regular"
                  >(Top 10 · en miles $)</span
                >
              </div>
              <v-spacer />
              <v-btn
                v-if="barByDriver.series[0].data.length >= 10"
                size="small"
                variant="text"
                color="success"
                append-icon="mdi-arrow-expand"
                @click="openDetail('driver')"
              >
                Ver todos
              </v-btn>
            </div>
            <ClientOnly>
              <VueApexCharts
                v-if="barByDriver.series[0].data.length"
                type="bar"
                height="300"
                :options="barByDriver.options"
                :series="barByDriver.series"
              />
              <p v-else class="text-caption text-medium-emphasis">
                Sin datos en el período.
              </p>
            </ClientOnly>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Modal: detalle completo de gastos (todos los ítems del filtro) -->
    <v-dialog v-model="detailOpen" max-width="920" scrollable>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pe-2">
          <span class="text-subtitle-1 font-weight-bold">
            {{ detailTitle }}
            <span class="text-caption text-medium-emphasis font-weight-regular">
              (todos · en miles $)
            </span>
          </span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="detailOpen = false" />
        </v-card-title>
        <v-divider />
        <v-card-text style="max-height: 70vh">
          <div
            v-if="store.detailLoading"
            class="d-flex justify-center align-center"
            style="min-height: 240px"
          >
            <v-progress-circular indeterminate color="primary" />
          </div>
          <ClientOnly v-else-if="detailChart.series[0].data.length">
            <VueApexCharts
              type="bar"
              :height="detailHeight"
              :options="detailChart.options"
              :series="detailChart.series"
            />
          </ClientOnly>
          <p v-else class="text-caption text-medium-emphasis py-8 text-center">
            Sin datos en el período.
          </p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
