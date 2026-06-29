<script setup lang="ts">
import { onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import VueApexCharts from "vue3-apexcharts";
import { useIndicatorStore } from "~/stores/indicator";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "auditor"],
});
useHead({ title: "Indicadores" });

const store = useIndicatorStore();
const { summary, loading, truckOptions, driverOptions, fleetOptions } =
  storeToRefs(store);

const money = (n?: number) => `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;

const kpis = computed(() => {
  const s = summary.value;
  if (!s) return [];
  return [
    { label: "Gasto por km", value: money(s.costPerKm), color: "primary" },
    { label: "Rendimiento (l/100km)", value: s.fuelEfficiency, color: "info" },
    { label: "Gastos totales", value: money(s.totalExpenses), color: "success" },
    { label: "Distancia (km)", value: Number(s.totalDistanceKm).toLocaleString("es-AR"), color: "secondary" },
    { label: "Costos extraordinarios", value: money(s.extraordinaryCosts), color: "error" },
    { label: "Resol. incidentes (h)", value: s.incidentResolutionAvgHours, color: "warning" },
    { label: "Disponibilidad flota", value: `${s.fleetAvailabilityPct}%`, color: "primary" },
  ];
});

const barByTruck = computed(() => {
  const data = summary.value?.expenseByTruck ?? [];
  return {
    series: [{ name: "Gasto", data: data.map((d: any) => d.total) }],
    options: {
      chart: { type: "bar" },
      xaxis: { categories: data.map((d: any) => d.key) },
      colors: ["#1E88E5"],
      plotOptions: { bar: { horizontal: true } },
    },
  };
});

const barByDriver = computed(() => {
  const data = summary.value?.expenseByDriver ?? [];
  return {
    series: [{ name: "Gasto", data: data.map((d: any) => d.total) }],
    options: {
      chart: { type: "bar" },
      xaxis: { categories: data.map((d: any) => d.key) },
      colors: ["#43A047" ],
      plotOptions: { bar: { horizontal: true } },
    },
  };
});

onMounted(async () => {
  await store.loadOptions();
  store.getSummary();
});
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Indicadores</h1>
      <v-spacer />
      <v-btn color="success" prepend-icon="mdi-file-excel" @click="store.exportXlsx()">
        Exportar Excel
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-card variant="outlined" class="pa-3 mb-4">
      <v-row dense align="center">
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.fleetId"
            :items="fleetOptions"
            item-title="name"
            item-value="id"
            label="Flota"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.truckId"
            :items="truckOptions"
            item-value="id"
            :item-title="(t: any) => t.plate"
            label="Camión"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.driverId"
            :items="driverOptions"
            item-value="id"
            :item-title="(d: any) => d.user?.name || d.licenseNumber || d.id"
            label="Chofer"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field
            v-model="store.filters.from"
            label="Desde"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field
            v-model="store.filters.to"
            label="Hasta"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="12" class="d-flex justify-end">
          <v-btn color="primary" :loading="loading" @click="store.getSummary()">
            Aplicar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <template v-if="summary">
      <v-row dense class="mb-2">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
          <v-card :color="k.color" variant="tonal" class="pa-3">
            <div class="text-caption">{{ k.label }}</div>
            <div class="text-h6 font-weight-bold">{{ k.value }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Gasto por camión</div>
            <ClientOnly>
              <VueApexCharts
                v-if="barByTruck.series[0].data.length"
                type="bar"
                height="300"
                :options="barByTruck.options"
                :series="barByTruck.series"
              />
              <p v-else class="text-caption text-medium-emphasis">Sin datos.</p>
            </ClientOnly>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Gasto por chofer</div>
            <ClientOnly>
              <VueApexCharts
                v-if="barByDriver.series[0].data.length"
                type="bar"
                height="300"
                :options="barByDriver.options"
                :series="barByDriver.series"
              />
              <p v-else class="text-caption text-medium-emphasis">Sin datos.</p>
            </ClientOnly>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
