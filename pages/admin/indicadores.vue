<script setup lang="ts">
import { Feature } from "~/types/plan";
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import ReportFilters from "~/components/shared/ReportFilters.vue";
import TableExcelActions from "~/components/shared/TableExcelActions.vue";
import ChartCard from "~/components/dashboard/ChartCard.vue";
import ChartDetailDialog from "~/components/dashboard/ChartDetailDialog.vue";
import { onMounted, computed, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  useIndicatorStore,
  bucketOptions,
  type EfficiencyRow,
} from "~/stores/indicator";
import { useCatalogStore, CATALOG } from "~/stores/catalog";

definePageMeta({
  feature: Feature.INDICATORS,
  layout: "admin",
  roles: ["admin", "manager", "auditor"],
});
useHead({ title: "Indicadores" });

const store = useIndicatorStore();
const { summary, loading, truckOptions, driverOptions, fleetOptions } =
  storeToRefs(store);

const { money, moneyFixed, num } = useFormatters();
const { limite } = useFeatures();
const { barOptions } = useBarChart();
const { lineOptions, stackedOptions } = useTrendChart();
const { chartHex } = useChartColors();
const { expenseType } = useTripStatus();
const catalogs = useCatalogStore();

// ───────────────────────────── KPIs ─────────────────────────────
//
// Cada KPI viaja con su variación contra el período anterior de igual duración
// (`summary.previous`, que el backend deja en null cuando ese período queda
// fuera de lo que retiene el plan). Un costo por km sin comparación no dice si
// hay que hacer algo: es sólo un número.

/** Variación %; `undefined` cuando no hay base con la que comparar. */
const variacion = (actual?: number | null, anterior?: number | null) => {
  if (anterior == null || !anterior || actual == null) return undefined;
  return Number((((actual - anterior) / anterior) * 100).toFixed(1));
};

const kpis = computed(() => {
  const s = summary.value;
  if (!s) return [];
  const p = s.previous;
  return [
    {
      label: "Gasto por km",
      value: moneyFixed(s.costPerKm),
      icon: "mdi-cash",
      tone: "primary",
      delta: variacion(s.costPerKm, p?.costPerKm),
      deltaGoodWhenUp: false,
    },
    {
      label: "Rendimiento (l/100km)",
      value: s.fuelEfficiency,
      icon: "mdi-gas-station-outline",
      tone: "info",
      delta: variacion(s.fuelEfficiency, p?.fuelEfficiency),
      // Menos litros cada 100 km es mejor rendimiento.
      deltaGoodWhenUp: false,
    },
    {
      label: "Gastos totales",
      value: money(s.totalExpenses),
      icon: "mdi-cash-multiple",
      tone: "success",
      delta: variacion(s.totalExpenses, p?.totalExpenses),
      deltaGoodWhenUp: false,
    },
    {
      label: "Distancia (km)",
      value: num(s.totalDistanceKm),
      icon: "mdi-map-marker-distance",
      tone: "secondary",
      delta: variacion(s.totalDistanceKm, p?.totalDistanceKm),
    },
    {
      label: "Costos extraordinarios",
      value: money(s.extraordinaryCosts),
      icon: "mdi-alert-octagon-outline",
      tone: "error",
      delta: variacion(s.extraordinaryCosts, p?.extraordinaryCosts),
      deltaGoodWhenUp: false,
    },
    {
      label: "Resol. incidentes (h)",
      value: s.incidentResolutionAvgHours,
      icon: "mdi-timer-sand",
      tone: "warning",
      delta: variacion(
        s.incidentResolutionAvgHours,
        p?.incidentResolutionAvgHours,
      ),
      deltaGoodWhenUp: false,
    },
    {
      label: "Disponibilidad flota",
      value: `${s.fleetAvailabilityPct}%`,
      icon: "mdi-truck-check-outline",
      tone: "primary",
      // Es la foto de hoy, no un acumulado del período: no lleva variación.
    },
  ];
});

const deltaHint = "vs. período previo";

// ─────────────────────── Evolución del costo por km ───────────────────────

const trendChart = computed(() => {
  const puntos = store.series;
  // Todos los buckets en null es "no hubo viajes cerrados", no una línea en
  // cero: la card muestra su estado vacío en vez de un gráfico plano.
  const hayDatos = puntos.some((p) => p.costPerKm !== null);
  return {
    series: hayDatos
      ? [{ name: "Costo por km", data: puntos.map((p) => p.costPerKm) }]
      : [],
    options: {
      ...lineOptions(
        puntos.map((p) => p.period),
        { color: "primary", decimals: 2, bucket: store.seriesBucket },
      ),
      tooltip: {
        // El costo por km se entiende con su denominador al lado: una punta de
        // $900 sobre 300 km es otra cosa que la misma punta sobre 12.000.
        y: {
          formatter: (v: number, opts: any) => {
            const p = puntos[opts?.dataPointIndex ?? 0];
            if (v == null || !p) return "Sin viajes cerrados";
            return `${moneyFixed(v)} · ${num(p.distanceKm)} km · ${num(p.trips)} viajes`;
          },
        },
      },
    },
  };
});

// ─────────────────────── Composición del gasto ───────────────────────

const typeChart = computed(() => {
  const { periods, series } = store.byType;
  return {
    series: series.map((s) => ({
      name: expenseType(s.key).label,
      data: s.data,
    })),
    options: stackedOptions(
      periods,
      series.map((s) => expenseType(s.key).color),
      { bucket: store.seriesBucket },
    ),
  };
});

// ─────────────── Cortes normalizados por kilómetro ───────────────
//
// Estos dos gráficos son los que permiten comparar: el gasto absoluto ordena
// por actividad —el camión que más viajó gastó más— y el costo por km ordena
// por eficiencia, que es lo que se decide.

/** Barra horizontal de costo por km con la línea del promedio de la flota. */
const costPerKmChart = (rows: EfficiencyRow[], color: string, etiqueta: (r: EfficiencyRow) => string) => {
  const promedio = summary.value?.costPerKm ?? 0;
  return {
    series: [{ name: "Costo por km", data: rows.map((r) => r.costPerKm) }],
    options: {
      ...barOptions(color, rows.map(etiqueta)),
      xaxis: {
        categories: rows.map(etiqueta),
        labels: { formatter: (v: unknown) => moneyFixed(Number(v)) },
      },
      // La referencia es la mitad del gráfico: sin el promedio, "alto" y "bajo"
      // los pone el ojo contra la barra más larga, que siempre existe.
      annotations: promedio
        ? {
            xaxis: [
              {
                x: promedio,
                borderColor: chartHex("grey"),
                strokeDashArray: 4,
                label: {
                  text: `Promedio ${moneyFixed(promedio)}`,
                  position: "top",
                  style: {
                    fontSize: "11px",
                    background: "transparent",
                    color: chartHex("grey"),
                  },
                },
              },
            ],
          }
        : {},
      tooltip: {
        y: {
          formatter: (v: number, opts: any) => {
            const r = rows[opts?.dataPointIndex ?? 0];
            if (!r) return moneyFixed(v);
            const consumo = r.fuelEfficiency
              ? ` · ${r.fuelEfficiency} l/100km`
              : "";
            return `${moneyFixed(v)} · ${num(r.distanceKm)} km${consumo}`;
          },
        },
      },
    },
  };
};

// Sin kilómetros no hay costo por km: un camión que estuvo todo el período en
// taller tiene gasto y ningún recorrido, y meterlo en el ranking con un cero lo
// mostraría como el más eficiente de la flota.
const truckEfficiency = computed(() =>
  store.efficiency.filter((r) => r.costPerKm !== null).slice(0, 10),
);

const efficiencyChart = computed(() =>
  costPerKmChart(truckEfficiency.value, "warning", (r) => r.key ?? "-"),
);

/** Etiqueta de la clasificación de ruta, según el catálogo de la empresa. */
const rutaLabel = (key: string | null) =>
  key
    ? catalogs.resolver(CATALOG.TRIP_CLASSIFICATION, key).label
    : "Sin clasificar";

const routeRows = computed(() =>
  store.routes.filter((r) => r.costPerKm !== null),
);

const routeChart = computed(() =>
  costPerKmChart(routeRows.value, "info", (r) => rutaLabel(r.key)),
);

// ─────────────────── Gasto absoluto (top 10, sin normalizar) ───────────────────

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

const cambiarBucket = (v: any) => {
  store.bucket = v ?? null;
  store.getTrends();
};

onMounted(async () => {
  // Los rótulos de las rutas salen del catálogo de la empresa; sin él el
  // gráfico mostraría las claves crudas. `load` no repite el pedido si ya está.
  catalogs.load();
  await store.loadOptions();
  store.getAll();
});
</script>

<template>
  <div>
    <PageHeader
      title="Indicadores"
      subtitle="KPIs operativos con filtros y exportación"
    >
      <template #actions>
        <TableExcelActions
          export-url="indicators/export/"
          export-name="indicadores.xlsx"
          :export-params="store.cleanParams()"
        />
      </template>
    </PageHeader>

    <ReportFilters
      :filters="store.filters"
      :truck-options="truckOptions"
      :driver-options="driverOptions"
      :fleet-options="fleetOptions"
      show-fleet
      @apply="store.getAll()"
    />

    <!--
      Riesgo R4.1: si el plan recorta el histórico, los totales de abajo cubren
      menos de lo pedido. Mostrarlo es obligatorio: un "gasto total" que en
      realidad es el de los últimos 6 meses, sin aclararlo, es un dato erróneo.
    -->
    <v-alert
      v-if="summary?.coverage?.truncatedByPlan"
      variant="tonal"
      density="compact"
      color="warning"
      class="mb-3"
      rounded="lg"
    >
      <div class="d-flex align-center flex-wrap ga-2">
        <v-icon size="18">mdi-alert-outline</v-icon>
        <span class="text-body-2">
          Estos números cubren desde el
          <strong>{{ summary.coverage.from }}</strong
          >: tu plan muestra los últimos
          {{ limite("retentionMonths") }} meses. Los datos anteriores siguen
          guardados.
        </span>
        <v-spacer />
        <v-btn size="small" variant="text" color="warning" to="/upgrade/indicators">
          Ampliar histórico
        </v-btn>
      </div>
    </v-alert>

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
            :delta="k.delta"
            :delta-good-when-up="k.deltaGoodWhenUp ?? true"
            :delta-hint="deltaHint"
          />
        </v-col>
      </v-row>

      <!-- Tendencia y composición: el "hacia dónde" y el "de qué está hecho" -->
      <v-row dense>
        <v-col cols="12" md="6">
          <ChartCard
            title="Costo por km"
            caption="(evolución del período)"
            type="line"
            :height="300"
            :series="trendChart.series"
            :options="trendChart.options"
            empty-text="Sin viajes cerrados con distancia en el período."
            empty-icon="mdi-chart-line"
          >
            <template #actions>
              <!-- El paso lo elige el backend según la ventana; esto lo fuerza. -->
              <v-select
                :model-value="store.bucket"
                :items="bucketOptions"
                density="compact"
                variant="plain"
                hide-details
                class="text-caption mr-2"
                style="max-width: 92px"
                @update:model-value="cambiarBucket"
              />
            </template>
          </ChartCard>
        </v-col>

        <v-col cols="12" md="6">
          <ChartCard
            title="Composición del gasto"
            caption="(por rubro)"
            :height="300"
            :series="typeChart.series"
            :options="typeChart.options"
            empty-text="Sin gastos en el período."
            empty-icon="mdi-chart-bar-stacked"
          />
        </v-col>
      </v-row>

      <!-- Normalizado por kilómetro: lo comparable entre unidades y rutas -->
      <v-row dense>
        <v-col cols="12" md="6">
          <ChartCard
            title="Costo por km por camión"
            caption="(Top 10 · comparable entre unidades)"
            expand-color="warning"
            :series="efficiencyChart.series"
            :options="efficiencyChart.options"
            empty-text="Sin kilómetros registrados en el período."
            empty-icon="mdi-truck-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <ChartCard
            title="Costo por km por ruta"
            caption="(clasificación del viaje)"
            expand-color="info"
            :series="routeChart.series"
            :options="routeChart.options"
            empty-text="Sin viajes clasificados con distancia en el período."
            empty-icon="mdi-map-marker-path"
          />
        </v-col>
      </v-row>

      <!-- Gasto absoluto: sirve para saber dónde está la plata, no para comparar -->
      <v-row dense>
        <v-col cols="12" md="6">
          <ChartCard
            title="Gasto por camión"
            caption="(Top 10 · total del período, en miles $)"
            :series="barByTruck.series"
            :options="barByTruck.options"
            :has-full-detail="barByTruck.series[0].data.length >= 10"
            @expand-full="openDetail('truck')"
          />
        </v-col>
        <v-col cols="12" md="6">
          <ChartCard
            title="Gasto por chofer"
            caption="(Top 10 · total del período, en miles $)"
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
