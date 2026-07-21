<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import ResponsiveTable from "~/components/ResponsiveTable.vue";
import ReportFilters from "~/components/shared/ReportFilters.vue";
import ChartCard from "~/components/dashboard/ChartCard.vue";
import ChartDetailDialog from "~/components/dashboard/ChartDetailDialog.vue";
import { useFuelStore } from "~/stores/fuel";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher", "maintenance", "auditor"],
});
useHead({ title: "Combustible" });

const store = useFuelStore();
const { report, loading, truckOptions, driverOptions, fleetOptions } =
  storeToRefs(store);

const { money, num } = useFormatters();
const { barOptions } = useBarChart();

const kpis = computed(() => {
  const r = report.value;
  if (!r) return [];
  return [
    { label: "Rendimiento (km/l)", value: num(r.fleetKmPerLiter), icon: "mdi-gas-station-outline", tone: "primary" },
    { label: "Consumo (l/100km)", value: num(r.fleetLitersPer100Km), icon: "mdi-fuel", tone: "info" },
    { label: "Costo por km", value: r.fleetCostPerKm == null ? "s/d" : money(r.fleetCostPerKm), icon: "mdi-cash", tone: "warning" },
    { label: "Gasto total", value: money(r.totalCost), icon: "mdi-cash-multiple", tone: "error" },
    { label: "Litros totales", value: num(r.totalLiters), icon: "mdi-water", tone: "secondary" },
    { label: "Km recorridos", value: num(r.totalDistanceKm), icon: "mdi-map-marker-distance", tone: "primary" },
    { label: "Precio prom. litro", value: money(r.avgPricePerLiter), icon: "mdi-tag-outline", tone: "success" },
    { label: "Cargas", value: num(r.loads), icon: "mdi-format-list-numbered", tone: "info" },
  ];
});

// Top N que se muestra en la página; el detalle completo va al modal "Ver todos".
const TOP = 10;

const kmRows = computed(() =>
  (report.value?.byTruck ?? [])
    .filter((t) => t.kmPerLiter != null)
    .slice()
    .sort((a, b) => (b.kmPerLiter as number) - (a.kmPerLiter as number)),
);
const costRows = computed(() =>
  (report.value?.byTruck ?? [])
    .slice()
    .sort((a, b) => b.totalCost - a.totalCost),
);

const kmPerLiterByTruck = computed(() => {
  const data = kmRows.value.slice(0, TOP);
  return {
    series: [{ name: "km/l", data: data.map((d) => d.kmPerLiter) }],
    options: barOptions("primary", data.map((d) => d.plate)),
  };
});

const costByTruck = computed(() => {
  const data = costRows.value.slice(0, TOP);
  return {
    series: [{ name: "Gasto", data: data.map((d) => d.totalCost) }],
    options: barOptions("error", data.map((d) => d.plate), true),
  };
});

// ── Modal "Ver todos": gráfico grande con todos los camiones (según filtro) ──
const detailOpen = ref(false);
const detailKind = ref<"kmPerLiter" | "cost">("cost");

const openDetail = (kind: "kmPerLiter" | "cost") => {
  detailKind.value = kind;
  detailOpen.value = true;
};

const detailChart = computed(() => {
  if (detailKind.value === "kmPerLiter") {
    const d = kmRows.value;
    return {
      title: "Rendimiento por camión (km/l)",
      series: [{ name: "km/l", data: d.map((x) => x.kmPerLiter) }],
      options: barOptions("primary", d.map((x) => x.plate)),
      count: d.length,
    };
  }
  const d = costRows.value;
  return {
    title: "Gasto por camión (en miles $)",
    series: [{ name: "Gasto", data: d.map((x) => x.totalCost) }],
    options: barOptions("error", d.map((x) => x.plate), true),
    count: d.length,
  };
});

// Altura dinámica: ~34px por barra horizontal para que no se apretujen.
const detailHeight = computed(() => Math.max(360, detailChart.value.count * 34));

const truckHeaders = [
  { title: "Camión", value: "plate" },
  { title: "Cargas", value: "loads" },
  { title: "Litros", value: "totalLiters" },
  { title: "Gasto", value: "totalCost" },
  { title: "Km", value: "distanceKm" },
  { title: "km/l", value: "kmPerLiter" },
  { title: "l/100km", value: "litersPer100Km" },
  { title: "$/km", value: "costPerKm" },
  { title: "Km/carga", value: "avgKmBetweenLoads" },
  { title: "Días/carga", value: "avgDaysBetweenLoads" },
];

const driverHeaders = [
  { title: "Chofer", value: "driver" },
  { title: "Cargas", value: "loads" },
  { title: "Litros", value: "totalLiters" },
  { title: "Gasto", value: "totalCost" },
  { title: "Km", value: "distanceKm" },
  { title: "km/l", value: "kmPerLiter" },
  { title: "l/100km", value: "litersPer100Km" },
  { title: "$/km", value: "costPerKm" },
  { title: "$/carga", value: "avgCostPerLoad" },
];

onMounted(async () => {
  await store.loadOptions();
  store.getReport();
});
</script>

<template>
  <div>
    <PageHeader
      title="Combustible"
      subtitle="Consumo y gasto por camión y por chofer, alineado con los km"
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
      show-fleet
      @apply="store.getReport()"
    />

    <div v-if="loading && !report" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="report">
      <!-- KPIs -->
      <v-row dense class="mb-2">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
          <KpiCard :label="k.label" :value="k.value" :icon="k.icon" :tone="k.tone" />
        </v-col>
      </v-row>

      <!-- Gráficos -->
      <v-row dense class="mb-2">
        <v-col cols="12" md="6">
          <ChartCard
            title="Rendimiento por camión (km/l)"
            caption="(Top 10)"
            :series="kmPerLiterByTruck.series"
            :options="kmPerLiterByTruck.options"
            :has-full-detail="kmRows.length > TOP"
            empty-text="Sin datos suficientes (se necesitan cargas con tanque lleno y odómetro)."
            @expand-full="openDetail('kmPerLiter')"
          />
        </v-col>
        <v-col cols="12" md="6">
          <ChartCard
            title="Gasto por camión"
            caption="(Top 10 · en miles $)"
            expand-color="error"
            :series="costByTruck.series"
            :options="costByTruck.options"
            :has-full-detail="costRows.length > TOP"
            @expand-full="openDetail('cost')"
          />
        </v-col>
      </v-row>

      <!-- Tabla por camión -->
      <v-card border flat rounded="lg" class="pa-4 mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-2">Detalle por camión</div>
        <ResponsiveTable
          :headers="truckHeaders"
          :items="report.byTruck"
          :items-per-page="10"
          searchable
          search-label="Buscar camión"
          no-data-text="Sin cargas en el período"
        >
          <template #item.totalLiters="{ item }">{{ num(item.totalLiters) }}</template>
          <template #item.totalCost="{ item }">{{ money(item.totalCost) }}</template>
          <template #item.distanceKm="{ item }">{{ num(item.distanceKm) }}</template>
          <template #item.kmPerLiter="{ item }">{{ num(item.kmPerLiter) }}</template>
          <template #item.litersPer100Km="{ item }">{{ num(item.litersPer100Km) }}</template>
          <template #item.costPerKm="{ item }">
            {{ item.costPerKm == null ? "s/d" : money(item.costPerKm) }}
          </template>
          <template #item.avgKmBetweenLoads="{ item }">{{ num(item.avgKmBetweenLoads) }}</template>
          <template #item.avgDaysBetweenLoads="{ item }">{{ num(item.avgDaysBetweenLoads) }}</template>
        </ResponsiveTable>
      </v-card>

      <!-- Tabla por chofer -->
      <v-card border flat rounded="lg" class="pa-4">
        <div class="text-subtitle-2 font-weight-bold mb-2">Detalle por chofer</div>
        <ResponsiveTable
          :headers="driverHeaders"
          :items="report.byDriver"
          :items-per-page="10"
          searchable
          search-label="Buscar chofer"
          no-data-text="Sin cargas en el período"
        >
          <template #item.totalLiters="{ item }">{{ num(item.totalLiters) }}</template>
          <template #item.totalCost="{ item }">{{ money(item.totalCost) }}</template>
          <template #item.distanceKm="{ item }">{{ num(item.distanceKm) }}</template>
          <template #item.kmPerLiter="{ item }">{{ num(item.kmPerLiter) }}</template>
          <template #item.litersPer100Km="{ item }">{{ num(item.litersPer100Km) }}</template>
          <template #item.costPerKm="{ item }">
            {{ item.costPerKm == null ? "s/d" : money(item.costPerKm) }}
          </template>
          <template #item.avgCostPerLoad="{ item }">{{ money(item.avgCostPerLoad) }}</template>
        </ResponsiveTable>
      </v-card>
    </template>

    <!-- Modal: detalle completo del gráfico (todos los camiones del filtro) -->
    <ChartDetailDialog
      v-model="detailOpen"
      :title="detailChart.title"
      caption="(todos)"
      :series="detailChart.series"
      :options="detailChart.options"
      :height="detailHeight"
    />
  </div>
</template>
