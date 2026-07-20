<script setup lang="ts">
import { onMounted, computed, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import KpiCard from "~/components/dashboard/KpiCard.vue";
import ChartCard from "~/components/dashboard/ChartCard.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import { useDashboardStore } from "~/stores/dashboard";
import { truckStatusOptions } from "~/composables/useFleetStatus";
import { incidentSeverityOptions } from "~/composables/useIncidentStatus";
import { useAlertSocket } from "~/composables/useAlertSocket";
import { useIncidentSocket } from "~/composables/useIncidentSocket";

definePageMeta({ layout: "admin" });
useHead({ title: "Dashboard" });

const dashboardStore = useDashboardStore();
const { overview, loading } = storeToRefs(dashboardStore);

// Colores de gráficos: paleta suave y armónica derivada del tema (tintes más
// claros que la UI, para que los donuts no se vean saturados ni "arcoíris").
const { chartHex: hex } = useChartColors();

const donutBase = {
  legend: { position: "bottom" as const },
  chart: { type: "donut" as const, fontFamily: "inherit" },
  stroke: { width: 0 },
  dataLabels: { enabled: false },
};

const totalTrucks = computed(() =>
  Object.values(overview.value?.trucksByStatus ?? {}).reduce(
    (a, b) => a + b,
    0,
  ),
);

const truckChart = computed(() => {
  const data = overview.value?.trucksByStatus ?? {};
  const present = truckStatusOptions.filter((o) => (data[o.value] ?? 0) > 0);
  return {
    series: present.map((o) => data[o.value]),
    options: {
      ...donutBase,
      labels: present.map((o) => o.label),
      colors: present.map((o) => hex(o.color)),
    },
  };
});

const ALERT_LEVELS = [
  { key: "red", label: "Crítica", color: "error" },
  { key: "orange", label: "Alta", color: "warning" },
  { key: "yellow", label: "Media", color: "amber" },
  { key: "green", label: "Aviso", color: "success" },
];

const alertChart = computed(() => {
  const data = overview.value?.alerts?.byLevel ?? {};
  const present = ALERT_LEVELS.filter((l) => (data[l.key] ?? 0) > 0);
  return {
    series: present.map((l) => data[l.key]),
    options: {
      ...donutBase,
      labels: present.map((l) => l.label),
      colors: present.map((l) => hex(l.color)),
    },
  };
});

const money = (n?: number) => `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;
const sevCount = (v: string) => overview.value?.incidents?.bySeverity?.[v] ?? 0;

// KPIs con drill-down a la sección correspondiente.
const kpis = computed(() => {
  const o = overview.value;
  if (!o) return [];
  return [
    {
      label: "Camiones",
      value: totalTrucks.value,
      icon: "mdi-truck-outline",
      tone: "primary",
      to: "/admin/flota",
    },
    {
      label: "Incidentes abiertos",
      value: o.incidents.open,
      icon: "mdi-alert-circle-outline",
      tone: "error",
      to: "/admin/incidentes",
    },
    {
      label: "Alertas activas",
      value: o.alerts.active,
      icon: "mdi-bell-ring-outline",
      tone: "warning",
      to: "/admin/alertas",
    },
    {
      label: "Viajes demorados",
      value: o.delayedTrips,
      icon: "mdi-clock-alert-outline",
      tone: "info",
      to: "/admin/viajes",
    },
    {
      label: "Gasto del día",
      value: money(o.todayExpenses),
      icon: "mdi-cash-multiple",
      tone: "success",
      to: "/admin/liquidaciones",
    },
    {
      label: "Mant. próximos",
      value: o.upcomingMaintenance,
      icon: "mdi-wrench-clock",
      tone: "secondary",
      to: "/admin/mantenimiento",
    },
    {
      label: "Choferes con novedades",
      value: o.driversWithNews,
      icon: "mdi-account-alert-outline",
      tone: "accent",
      to: "/admin/choferes",
    },
  ];
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
      to: "/admin/alertas",
    },
    {
      label: "mantenimientos próximos",
      count: o.upcomingMaintenance,
      icon: "mdi-wrench",
      tone: "info",
      to: "/admin/mantenimiento",
    },
    {
      label: "viajes demorados",
      count: o.delayedTrips,
      icon: "mdi-clock-alert",
      tone: "warning",
      to: "/admin/viajes",
    },
    {
      label: "choferes con novedades",
      count: o.driversWithNews,
      icon: "mdi-account-alert",
      tone: "accent",
      to: "/admin/choferes",
    },
  ].filter((i) => i.count > 0);
});

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
    />

    <div v-if="loading && !overview" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="overview">
      <!-- KPIs -->
      <v-row dense class="mb-2">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
          <KpiCard
            :label="k.label"
            :value="k.value"
            :icon="k.icon"
            :tone="k.tone"
            :to="k.to"
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

        <!-- Flota por estado -->
        <v-col cols="12" md="4">
          <ChartCard
            title="Flota por estado"
            type="donut"
            :height="260"
            :series="truckChart.series"
            :options="truckChart.options"
            empty-text="Sin datos."
            empty-icon="mdi-truck-outline"
          />
        </v-col>

        <!-- Alertas por nivel -->
        <v-col cols="12" md="4">
          <ChartCard
            title="Alertas por nivel"
            type="donut"
            :height="260"
            :series="alertChart.series"
            :options="alertChart.options"
            expand-color="warning"
            empty-text="Sin alertas activas."
            empty-icon="mdi-check-circle-outline"
          />
        </v-col>
      </v-row>

      <!-- Incidentes por severidad -->
      <v-row dense>
        <v-col cols="12" md="4">
          <v-card border flat rounded="lg" class="pa-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              Incidentes por severidad
            </div>
            <div class="d-flex flex-column ga-2 mt-2">
              <div
                v-for="s in incidentSeverityOptions"
                :key="s.value"
                class="d-flex align-center justify-space-between"
              >
                <v-chip :color="s.color" size="small" label>{{
                  s.label
                }}</v-chip>
                <span class="font-weight-bold">{{ sevCount(s.value) }}</span>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
