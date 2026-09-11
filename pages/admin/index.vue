<script setup lang="ts">
import { onMounted, computed, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import ChartCard from "~/components/dashboard/ChartCard.vue";
import StackedStrip from "~/components/dashboard/StackedStrip.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import {
  useDashboardStore,
  dashboardRangeOptions,
  type DashboardRange,
  type TrendMetric,
} from "~/stores/dashboard";
import { truckStatusOptions } from "~/composables/useFleetStatus";
import { incidentSeverityOptions } from "~/composables/useIncidentStatus";
import { alertLevelOptions } from "~/composables/useAlertStatus";
import { useAlertSocket } from "~/composables/useAlertSocket";
import { useIncidentSocket } from "~/composables/useIncidentSocket";
import { lastNDaysRange } from "~/composables/useDateRange";

definePageMeta({ layout: "admin" });
useHead({ title: "Dashboard" });

const dashboardStore = useDashboardStore();
const { overview, loading, range } = storeToRefs(dashboardStore);

const { money, num } = useFormatters();
const { lineOptions } = useTrendChart();

const totalTrucks = computed(() =>
  Object.values(overview.value?.trucksByStatus ?? {}).reduce(
    (a, b) => a + b,
    0,
  ),
);

// ───────────────────────── KPIs del período ─────────────────────────
//
// La fila de KPIs mide el **período**: cuánto se gastó, cuántos viajes se
// cerraron, cuántos incidentes entraron. Los contadores accionables (alertas,
// incidentes abiertos, demorados, mantenimientos) no están acá a propósito:
// viven en "Requiere atención", con su drill-down. Antes estaban en los dos
// lados y la primera pantalla mostraba los mismos cinco números dos veces.

const dias = computed(() =>
  range.value === "today" ? 1 : range.value === "30d" ? 30 : 7,
);

const deltaHint = computed(() =>
  range.value === "today" ? "vs. ayer" : `vs. ${dias.value} días previos`,
);

/**
 * Variación porcentual contra el período anterior.
 *
 * Con un período anterior en cero no se devuelve nada: la variación contra cero
 * es infinita y "+100 %" sería inventarla. En ese caso la tarjeta muestra sólo
 * el valor, que es lo honesto.
 */
const variacion = (m?: TrendMetric | null) => {
  if (!m || !m.previousValue) return undefined;
  return Number((((m.value - m.previousValue) / m.previousValue) * 100).toFixed(1));
};

const trends = computed(() => overview.value?.trends);

// ───────────────────── Drill-down con filtro ─────────────────────
//
// Cada número del panel lleva a su listado **ya filtrado** con el mismo corte:
// quien hace click en "viajes demorados" quiere ver esos, no todos los viajes.
// El listado lee la query al entrar y la aplica a sus filtros normales, así que
// el usuario limpia el filtro como cualquier otro y ve el resto.

/**
 * El período del panel como `from`/`to` de un listado: hoy y los N-1 días
 * previos, igual que `DashboardService.buildTrends`.
 */
const periodo = computed(() => lastNDaysRange(dias.value - 1));

const disponibilidad = computed(() => {
  const total = totalTrucks.value;
  if (!total) return 0;
  const libres = overview.value?.trucksByStatus?.available ?? 0;
  return Math.round((libres / total) * 100);
});

const kpis = computed(() => {
  const t = trends.value;
  if (!overview.value || !t) return [];
  return [
    {
      label: "Gasto del período",
      // `null` = la bitácora no entra en el plan: candado, no un cero.
      locked: t.expenses === null,
      value: money(t.expenses?.value ?? 0),
      delta: variacion(t.expenses),
      // Gastar más no es una buena noticia: el verde va cuando baja.
      deltaGoodWhenUp: false,
      series: t.expenses?.series,
      icon: "mdi-cash-multiple",
      tone: "success",
      to: t.expenses === null ? "/upgrade/trip_log" : "/admin/liquidaciones",
    },
    {
      label: "Viajes finalizados",
      value: num(t.tripsFinished.value),
      delta: variacion(t.tripsFinished),
      series: t.tripsFinished.series,
      icon: "mdi-check-decagram-outline",
      tone: "primary",
      to: `/admin/viajes?status=finished&from=${periodo.value.from}&to=${periodo.value.to}`,
    },
    {
      label: "Incidentes reportados",
      value: num(t.incidentsReported.value),
      delta: variacion(t.incidentsReported),
      deltaGoodWhenUp: false,
      series: t.incidentsReported.series,
      icon: "mdi-alert-circle-outline",
      tone: "error",
      to: `/admin/incidentes?from=${periodo.value.from}&to=${periodo.value.to}`,
    },
    {
      label: "Disponibilidad de flota",
      value: `${disponibilidad.value}%`,
      // Es la foto de hoy, no un acumulado: no lleva delta ni serie mientras no
      // exista historial de estados de la flota.
      icon: "mdi-truck-check-outline",
      tone: "info",
      to: "/admin/flota?tab=trucks",
    },
  ];
});

// ───────────────────── Cortes de estado del panel ─────────────────────
//
// Los cuatro responden la misma pregunta —cómo se reparte un total chico entre
// pocas categorías— así que se dibujan igual. La flota estaba en dona: con una
// decena de unidades el ángulo no agregaba nada sobre el largo del tramo, y la
// leyenda de la dona no muestra las cifras, que es lo que se termina leyendo.
// Unificar acá no es cosmética: tres formas distintas para la misma pregunta
// obligan a re-aprender a leer cada tarjeta.

const truckItems = computed(() => {
  const data = overview.value?.trucksByStatus ?? {};
  return truckStatusOptions.map((o) => ({
    label: o.label,
    value: data[o.value] ?? 0,
    color: o.color,
    to: `/admin/flota?tab=trucks&status=${o.value}`,
  }));
});

const alertItems = computed(() => {
  const data = overview.value?.alerts?.byLevel ?? {};
  return alertLevelOptions.map((l) => ({
    label: l.label,
    value: data[l.value] ?? 0,
    color: l.color,
    // Las del panel son las activas: el listado arranca con ese mismo corte.
    to: `/admin/alertas?level=${l.value}&status=active`,
  }));
});

const incidentItems = computed(() => {
  const data = overview.value?.incidents?.bySeverity ?? {};
  // De crítica a baja: la barra se lee en el mismo orden en que se prioriza.
  return [...incidentSeverityOptions].reverse().map((s) => ({
    label: s.label,
    value: data[s.value] ?? 0,
    color: s.color,
    to: `/admin/incidentes?severity=${s.value}`,
  }));
});

const expirationItems = computed(() => {
  const e = overview.value?.expirations;
  // `ventana` es la misma que calcula el backend (`documentExpirations`).
  return [
    { label: "Vencidos", value: e?.expired ?? 0, color: "error", ventana: "expired" },
    { label: "≤ 7 días", value: e?.in7 ?? 0, color: "warning", ventana: "in7" },
    { label: "8 a 30 días", value: e?.in30 ?? 0, color: "amber", ventana: "in30" },
    { label: "31 a 90 días", value: e?.in90 ?? 0, color: "info", ventana: "in90" },
  ].map((i) => ({ ...i, to: `/admin/documentos?tab=expiring&ventana=${i.ventana}` }));
});

// ───────────────────── Evolución del gasto ─────────────────────
//
// La serie llega como números sin fecha —un valor por día, terminando hoy—, así
// que las etiquetas se reconstruyen acá desde el largo del rango.

const expenseChart = computed(() => {
  const serie = trends.value?.expenses?.series ?? [];
  // Con un solo punto no hay evolución que mostrar; la card queda en vacío.
  if (serie.length < 2) return { series: [], options: lineOptions([]) };

  const hoy = new Date();
  const etiquetas = serie.map((_, i) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - (serie.length - 1 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  });

  return {
    series: [{ name: "Gasto", data: serie }],
    options: lineOptions(etiquetas, { color: "success", asMoney: true }),
  };
});

const expenseEmptyText = computed(() => {
  if (trends.value?.expenses === null)
    return "La bitácora de gastos no está incluida en tu plan.";
  if (range.value === "today")
    return "Elegí 7 o 30 días para ver la evolución del gasto.";
  return "Sin gastos registrados en el período.";
});

// Feed accionable "Requiere atención": solo lo que tiene pendientes.
const attention = computed(() => {
  const o = overview.value;
  if (!o) return [];
  return [
    {
      label: "incidentes abiertos",
      count: o.incidents.open,
      icon: "mdi-alert-circle",
      tone: "error",
      to: "/admin/incidentes",
    },
    {
      label: "alertas activas sin resolver",
      count: o.alerts.active,
      icon: "mdi-bell-ring",
      tone: "warning",
      to: "/admin/alertas?status=active",
    },
    {
      label: "mantenimientos próximos",
      count: o.upcomingMaintenance ?? 0,
      icon: "mdi-wrench",
      tone: "info",
      to: "/admin/mantenimiento",
    },
    {
      label: "viajes demorados",
      count: o.delayedTrips,
      icon: "mdi-clock-alert",
      tone: "warning",
      to: "/admin/viajes?status=delayed",
    },
    {
      label: "choferes con novedades",
      count: o.driversWithNews,
      icon: "mdi-account-alert",
      tone: "accent",
      to: "/admin/choferes?withNews=true",
    },
  ].filter((i) => i.count > 0);
});

const cambiarRango = (r: DashboardRange) => dashboardStore.getOverview(r);

// Refresco en vivo del panel ante nuevas alertas/incidentes.
const alertSocket = useAlertSocket(() => dashboardStore.getOverview());
const incidentSocket = useIncidentSocket(() => dashboardStore.getOverview());

onMounted(() => {
  dashboardStore.getOverview();
  alertSocket.connect();
  incidentSocket.connect();
});
onBeforeUnmount(() => {
  alertSocket.disconnect();
  incidentSocket.disconnect();
});
</script>

<template>
  <div>
    <PageHeader
      title="Panel gerencial"
      subtitle="Estado operativo de la flota en tiempo real"
    >
      <template #actions>
        <!--
          El rango manda sobre los KPIs del período (valor, variación y
          sparkline). Los contadores de estado —alertas, incidentes abiertos—
          son siempre "ahora": no dependen de esta elección.
        -->
        <v-btn-toggle
          :model-value="range"
          density="compact"
          variant="outlined"
          divided
          mandatory
          @update:model-value="cambiarRango"
        >
          <v-btn
            v-for="r in dashboardRangeOptions"
            :key="r.value"
            :value="r.value"
            size="small"
          >
            {{ r.label }}
          </v-btn>
        </v-btn-toggle>
      </template>
    </PageHeader>

    <div v-if="loading && !overview" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="overview">
      <!-- KPIs del período, con variación y forma -->
      <v-row dense class="mb-2">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
          <KpiCard
            :label="k.label"
            :value="k.value"
            :icon="k.icon"
            :tone="k.tone"
            :to="k.to"
            :delta="k.delta"
            :delta-good-when-up="k.deltaGoodWhenUp ?? true"
            :delta-hint="deltaHint"
            :series="k.series"
            :locked="k.locked"
          />
        </v-col>
      </v-row>

      <v-row dense>
        <!-- Requiere atención -->
        <v-col cols="12" md="4">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <div class="text-subtitle-2 font-weight-bold mb-3">
              Requiere atención
            </div>
            <v-list v-if="attention.length" density="compact" class="py-0">
              <v-list-item
                v-for="a in attention"
                :key="a.label"
                :to="a.to"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar
                    :color="a.tone"
                    variant="tonal"
                    size="34"
                    rounded="lg"
                    class="mr-3"
                  >
                    <v-icon :color="a.tone" size="18">{{ a.icon }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  <span class="font-weight-bold">{{ a.count }}</span>
                  {{ a.label }}
                </v-list-item-title>
                <template #append>
                  <v-icon size="16" color="medium-emphasis"
                    >mdi-chevron-right</v-icon
                  >
                </template>
              </v-list-item>
            </v-list>
            <EmptyState
              v-else
              icon="mdi-check-circle-outline"
              text="Sin pendientes."
            />
          </v-card>
        </v-col>

        <!-- Evolución del gasto del período -->
        <v-col cols="12" md="8">
          <ChartCard
            title="Gasto diario"
            :caption="`(${dias === 1 ? 'hoy' : `últimos ${dias} días`})`"
            type="line"
            :height="280"
            :series="expenseChart.series"
            :options="expenseChart.options"
            expand-color="success"
            :empty-text="expenseEmptyText"
            empty-icon="mdi-chart-line"
          />
        </v-col>
      </v-row>

      <!--
        Banda de composición: cuatro repartos de un total sobre pocas
        categorías, los cuatro con la misma forma y una tarjeta cada uno. La
        fila se lee de un saque porque no hay que aprender a leer cada tarjeta
        por separado.

        `sm="6"` no es un detalle de responsive: en pantallas angostas la banda
        se acomoda sola en 2×2 y sigue siendo una banda, en vez de convertirse
        en cuatro tarjetas apiladas que ya no se comparan entre sí.
      -->
      <v-row dense>
        <v-col cols="12" sm="6" md="3">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <StackedStrip
              title="Flota por estado"
              :items="truckItems"
              empty-text="Sin unidades cargadas."
              empty-icon="mdi-truck-outline"
            />
          </v-card>
        </v-col>

        <!-- Vencimientos documentales: cuándo, no sólo cuántos -->
        <v-col cols="12" sm="6" md="3">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <StackedStrip
              title="Vencimientos a 90 días"
              :items="expirationItems"
              empty-text="Nada por vencer en los próximos 90 días."
              empty-icon="mdi-file-check-outline"
            />
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <StackedStrip
              title="Alertas activas"
              :items="alertItems"
              empty-text="Sin alertas activas."
              empty-icon="mdi-bell-check-outline"
            />
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card border flat rounded="lg" class="pa-4 h-100">
            <StackedStrip
              title="Incidentes abiertos"
              :items="incidentItems"
              empty-text="Sin incidentes abiertos."
              empty-icon="mdi-shield-check-outline"
            />
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
