<script setup lang="ts">
import { onMounted, computed, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import VueApexCharts from "vue3-apexcharts";
import { useDashboardStore } from "~/stores/dashboard";
import { truckStatusOptions } from "~/composables/useFleetStatus";
import { incidentSeverityOptions } from "~/composables/useIncidentStatus";
import { useAlertSocket } from "~/composables/useAlertSocket";
import { useIncidentSocket } from "~/composables/useIncidentSocket";

definePageMeta({ layout: "admin" });
useHead({ title: "Dashboard" });

const dashboardStore = useDashboardStore();
const { overview, loading } = storeToRefs(dashboardStore);

const TRUCK_HEX: Record<string, string> = {
  available: "#4CAF50",
  on_trip: "#1E88E5",
  stopped: "#FB8C00",
  workshop: "#00ACC1",
  out_of_service: "#E53935",
};
const ALERT_HEX: Record<string, string> = {
  red: "#F44336",
  orange: "#FF9800",
  yellow: "#FFC107",
  green: "#4CAF50",
};

const totalTrucks = computed(() =>
  Object.values(overview.value?.trucksByStatus ?? {}).reduce((a, b) => a + b, 0),
);

const truckChart = computed(() => {
  const data = overview.value?.trucksByStatus ?? {};
  const present = truckStatusOptions.filter((o) => (data[o.value] ?? 0) > 0);
  return {
    series: present.map((o) => data[o.value]),
    options: {
      labels: present.map((o) => o.label),
      colors: present.map((o) => TRUCK_HEX[o.value]),
      legend: { position: "bottom" },
      chart: { type: "donut" },
    },
  };
});

const alertChart = computed(() => {
  const data = overview.value?.alerts?.byLevel ?? {};
  const levels = ["red", "orange", "yellow", "green"].filter((l) => (data[l] ?? 0) > 0);
  return {
    series: levels.map((l) => data[l]),
    options: {
      labels: levels.map((l) => l.toUpperCase()),
      colors: levels.map((l) => ALERT_HEX[l]),
      legend: { position: "bottom" },
      chart: { type: "donut" },
    },
  };
});

const money = (n?: number) => `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;

const sevCount = (v: string) => overview.value?.incidents?.bySeverity?.[v] ?? 0;

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
    <h1 class="text-h5 font-weight-bold mb-4">Panel gerencial</h1>

    <div v-if="loading && !overview" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="overview">
      <!-- KPIs -->
      <v-row dense class="mb-2">
        <v-col cols="6" md="3">
          <v-card color="primary" variant="tonal" class="pa-3">
            <div class="text-caption">Camiones</div>
            <div class="text-h5 font-weight-bold">{{ totalTrucks }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="error" variant="tonal" class="pa-3">
            <div class="text-caption">Incidentes abiertos</div>
            <div class="text-h5 font-weight-bold">{{ overview.incidents.open }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="success" variant="tonal" class="pa-3">
            <div class="text-caption">Gastos del día</div>
            <div class="text-h6 font-weight-bold">{{ money(overview.todayExpenses) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="warning" variant="tonal" class="pa-3">
            <div class="text-caption">Alertas activas</div>
            <div class="text-h5 font-weight-bold">{{ overview.alerts.active }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="info" variant="tonal" class="pa-3">
            <div class="text-caption">Viajes demorados</div>
            <div class="text-h5 font-weight-bold">{{ overview.delayedTrips }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="secondary" variant="tonal" class="pa-3">
            <div class="text-caption">Mant. próximos</div>
            <div class="text-h5 font-weight-bold">{{ overview.upcomingMaintenance }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card variant="tonal" class="pa-3">
            <div class="text-caption">Choferes con novedades</div>
            <div class="text-h5 font-weight-bold">{{ overview.driversWithNews }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Gráficos -->
      <v-row dense>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Flota por estado</div>
            <ClientOnly>
              <VueApexCharts
                v-if="truckChart.series.length"
                type="donut"
                height="260"
                :options="truckChart.options"
                :series="truckChart.series"
              />
              <p v-else class="text-caption text-medium-emphasis">Sin datos.</p>
            </ClientOnly>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Alertas por nivel</div>
            <ClientOnly>
              <VueApexCharts
                v-if="alertChart.series.length"
                type="donut"
                height="260"
                :options="alertChart.options"
                :series="alertChart.series"
              />
              <p v-else class="text-caption text-medium-emphasis">Sin alertas activas.</p>
            </ClientOnly>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Incidentes por severidad</div>
            <div class="d-flex flex-column ga-2 mt-2">
              <div
                v-for="s in incidentSeverityOptions"
                :key="s.value"
                class="d-flex align-center justify-space-between"
              >
                <v-chip :color="s.color" size="small" label>{{ s.label }}</v-chip>
                <span class="font-weight-bold">{{ sevCount(s.value) }}</span>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
