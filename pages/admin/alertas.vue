<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useAlertStore } from "~/stores/alert";
import {
  alertLevelOptions,
  alertStatusOptions,
  useAlertStatus,
} from "~/composables/useAlertStatus";
import { useAlertSocket } from "~/composables/useAlertSocket";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  roles: ["admin", "manager", "dispatcher", "hr"],
});
useHead({ title: "Alertas" });

const alertStore = useAlertStore();
const { sorted, loading, activeCount } = storeToRefs(alertStore);
const { alertLevel, alertStatus } = useAlertStatus();

const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : "");
const LEVEL_HEX: Record<string, string> = {
  red: "#F44336",
  orange: "#FF9800",
  yellow: "#FFC107",
  green: "#4CAF50",
};
const levelHex = (level: string) => LEVEL_HEX[level] ?? "#9E9E9E";

const notifyRed = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* noop */
  }
};

const socket = useAlertSocket(
  (alert) => {
    alertStore.upsert(alert);
    alertStore.getCount();
    if (alert.level === "red") notifyRed();
  },
  (alert) => alertStore.upsert(alert),
);

onMounted(() => {
  alertStore.getAlerts();
  alertStore.getCount();
  socket.connect();
});
onBeforeUnmount(() => socket.disconnect());
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-4">
      <h1 class="text-h5 font-weight-bold">Alertas</h1>
      <v-badge v-if="activeCount" :content="activeCount" color="error" inline />
      <v-chip color="success" size="small" variant="tonal" class="ml-2">
        <v-icon start size="14">mdi-circle</v-icon> En vivo
      </v-chip>
    </div>

    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <v-select
        v-model="alertStore.filterLevel"
        :items="alertLevelOptions"
        item-title="label"
        item-value="value"
        label="Nivel"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="alertStore.getAlerts()"
      />
      <v-select
        v-model="alertStore.filterStatus"
        :items="alertStatusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="alertStore.getAlerts()"
      />
    </div>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!sorted.length" class="text-body-2 text-medium-emphasis">
        No hay alertas.
      </p>

      <v-card
        v-for="a in sorted"
        :key="a.id"
        variant="outlined"
        class="mb-2"
        :style="`border-left: 4px solid ${levelHex(a.level)}`"
      >
        <v-card-text class="py-2">
          <div class="d-flex align-center ga-2 mb-1">
            <v-chip :color="alertLevel(a.level).color" size="small" label>
              {{ alertLevel(a.level).label }}
            </v-chip>
            <span class="font-weight-bold">{{ a.title }}</span>
            <v-spacer />
            <v-chip :color="alertStatus(a.status).color" size="x-small" label>
              {{ alertStatus(a.status).label }}
            </v-chip>
          </div>
          <div class="text-body-2">{{ a.message }}</div>
          <div class="text-caption text-medium-emphasis">{{ fmt(a.createdAt) }}</div>

          <div class="d-flex ga-1 mt-2" v-if="a.status !== 'resolved'">
            <v-btn
              v-if="a.status === 'new'"
              size="x-small"
              variant="tonal"
              @click="alertStore.setStatus(a.id, 'seen')"
            >
              Visto
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="warning"
              @click="alertStore.setStatus(a.id, 'acknowledge')"
            >
              Atender
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="success"
              @click="alertStore.setStatus(a.id, 'resolve')"
            >
              Resolver
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
