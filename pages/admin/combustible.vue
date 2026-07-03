<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import ResponsiveTable from "~/components/ResponsiveTable.vue";
import { useFuelStore } from "~/stores/fuel";

const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher", "maintenance", "auditor"],
});
useHead({ title: "Combustible" });

const store = useFuelStore();
const { report, loading, truckOptions, driverOptions, fleetOptions } =
  storeToRefs(store);

// Paleta suave de gráficos (tintes claros y armónicos, no la saturación de la UI).
const { chartHex: hex } = useChartColors();

const money = (n?: number) => `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;
const num = (n?: number | null) =>
  n == null ? "s/d" : Number(n).toLocaleString("es-AR");

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

// Eje compacto en miles de pesos ("$250k") para evitar montos con muchos ceros.
const moneyK = (v: any) => {
  const n = Number(v) || 0;
  return `$${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}k`;
};

const barOptions = (color: string, categories: string[], asMoney = false) => ({
  chart: { type: "bar" as const, fontFamily: "inherit", toolbar: { show: false } },
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
          <v-text-field v-model="store.filters.from" label="Desde" type="date" />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field v-model="store.filters.to" label="Hasta" type="date" />
        </v-col>
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            color="primary"
            prepend-icon="mdi-filter-check-outline"
            :loading="loading"
            @click="store.getReport()"
          >
            Aplicar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

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
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-2 font-weight-bold">
                Rendimiento por camión (km/l)
                <span class="text-caption text-medium-emphasis font-weight-regular">(Top 10)</span>
              </div>
              <v-spacer />
              <v-btn
                v-if="kmRows.length > TOP"
                size="small"
                variant="text"
                color="primary"
                append-icon="mdi-arrow-expand"
                @click="openDetail('kmPerLiter')"
              >
                Ver todos
              </v-btn>
            </div>
            <ClientOnly>
              <VueApexCharts
                v-if="kmPerLiterByTruck.series[0].data.length"
                type="bar"
                height="300"
                :options="kmPerLiterByTruck.options"
                :series="kmPerLiterByTruck.series"
              />
              <p v-else class="text-caption text-medium-emphasis">
                Sin datos suficientes (se necesitan cargas con tanque lleno y odómetro).
              </p>
            </ClientOnly>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-2 font-weight-bold">
                Gasto por camión
                <span class="text-caption text-medium-emphasis font-weight-regular">(Top 10 · en miles $)</span>
              </div>
              <v-spacer />
              <v-btn
                v-if="costRows.length > TOP"
                size="small"
                variant="text"
                color="error"
                append-icon="mdi-arrow-expand"
                @click="openDetail('cost')"
              >
                Ver todos
              </v-btn>
            </div>
            <ClientOnly>
              <VueApexCharts
                v-if="costByTruck.series[0].data.length"
                type="bar"
                height="300"
                :options="costByTruck.options"
                :series="costByTruck.series"
              />
              <p v-else class="text-caption text-medium-emphasis">
                Sin datos en el período.
              </p>
            </ClientOnly>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabla por camión -->
      <v-card border flat rounded="lg" class="pa-4 mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-2">Detalle por camión</div>
        <ResponsiveTable
          :headers="truckHeaders"
          :items="report.byTruck"
          :items-per-page="10"
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
    <v-dialog v-model="detailOpen" max-width="920" scrollable>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pe-2">
          <span class="text-subtitle-1 font-weight-bold">
            {{ detailChart.title }}
            <span class="text-caption text-medium-emphasis font-weight-regular">
              (todos)
            </span>
          </span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="detailOpen = false" />
        </v-card-title>
        <v-divider />
        <v-card-text style="max-height: 70vh">
          <ClientOnly v-if="detailChart.series[0].data.length">
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
