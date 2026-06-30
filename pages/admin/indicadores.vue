<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import { onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTheme } from "vuetify";
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

// Colores de gráficos desde la paleta de marca (igual que el dashboard).
const theme = useTheme();
const hex = (name: string) =>
  (theme.current.value.colors as Record<string, string>)[name] || name;

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

const barOptions = (color: string, categories: string[]) => ({
  chart: {
    type: "bar" as const,
    fontFamily: "inherit",
    toolbar: { show: false },
  },
  xaxis: { categories },
  colors: [hex(color)],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
  dataLabels: { enabled: false },
  grid: { borderColor: "rgba(0,0,0,0.06)" },
});

const barByTruck = computed(() => {
  const data = summary.value?.expenseByTruck ?? [];
  return {
    series: [{ name: "Gasto", data: data.map((d: any) => d.total) }],
    options: barOptions(
      "primary",
      data.map((d: any) => d.key),
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
    ),
  };
});

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
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Gasto por camión
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
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Gasto por chofer
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
  </div>
</template>
