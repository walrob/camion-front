<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { BellRingingIcon } from "vue-tabler-icons";
import { useAlertStore, type Alert } from "~/stores/alert";
import { useAlertStatus } from "~/composables/useAlertStatus";
import { useAlertSocket } from "~/composables/useAlertSocket";
import { useGeneralStore } from "~/stores/general";

const router = useRouter();
const alertStore = useAlertStore();
const general = useGeneralStore();
const { sorted, activeCount } = storeToRefs(alertStore);
const { alertLevel } = useAlertStatus();

// Hasta 8 alertas activas (no resueltas) en el desplegable; el resto en la página.
const items = computed(() =>
  sorted.value.filter((a) => a.status !== "resolved").slice(0, 8),
);

// Feedback háptico/sonoro para alertas rojas (críticas).
const notifyRed = (alert: Alert) => {
  if (typeof navigator !== "undefined" && navigator.vibrate)
    navigator.vibrate([200, 100, 200]);
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* el navegador puede bloquear audio sin interacción previa */
  }
  general.setSnackbar({
    color: "error",
    timeout: 8000,
    message: `🔴 ${alert.title}`,
  });
};

// Conexión única al canal de alertas durante toda la sesión del backoffice.
const socket = useAlertSocket(
  (alert) => {
    alertStore.upsert(alert);
    alertStore.getCount();
    if (alert.level === "red") notifyRed(alert);
  },
  (alert) => alertStore.upsert(alert),
);

onMounted(() => {
  alertStore.getAlerts();
  alertStore.getCount();
  socket.connect();
});
onBeforeUnmount(() => socket.disconnect());

const fmtAgo = (d?: string) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

// Cada alerta lleva a la sección de origen.
const SOURCE_ROUTE: Record<string, string> = {
  incident: "/admin/incidentes",
  maintenance: "/admin/mantenimiento",
  document: "/admin/documentos",
  truck_idle: "/admin/flota",
  expense: "/admin/liquidaciones",
  employment: "/admin/rrhh",
};

const openAlert = (alert: Alert) => {
  if (alert.status === "new") alertStore.setStatus(alert.id, "seen");
  router.push(SOURCE_ROUTE[alert.sourceType] ?? "/admin/alertas");
};
</script>

<template>
  <v-menu :close-on-content-click="false" offset="8">
    <template #activator="{ props }">
      <v-btn
        icon
        variant="text"
        class="custom-hover-primary mx-1 text-muted"
        aria-label="Notificaciones"
        v-bind="props"
      >
        <v-badge
          :content="activeCount"
          :model-value="activeCount > 0"
          color="error"
          offset-x="-2"
          offset-y="-2"
        >
          <BellRingingIcon stroke-width="1.5" size="22" />
        </v-badge>
      </v-btn>
    </template>

    <v-sheet rounded="lg" width="360" elevation="10" class="mt-1">
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <span class="text-subtitle-2 font-weight-bold">Notificaciones</span>
        <v-chip v-if="activeCount" color="error" size="x-small" variant="flat">
          {{ activeCount }} activas
        </v-chip>
      </div>
      <v-divider />

      <v-list
        v-if="items.length"
        class="py-0"
        density="compact"
        max-height="380"
        style="overflow-y: auto"
      >
        <template v-for="a in items" :key="a.id">
          <v-list-item :value="a.id" class="py-2" @click="openAlert(a)">
            <template #prepend>
              <v-icon :color="alertLevel(a.level).color" size="14" class="mt-1"
                >mdi-circle</v-icon
              >
            </template>
            <v-list-item-title class="font-weight-medium text-body-2">
              {{ a.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ a.message }}
            </v-list-item-subtitle>
            <template #append>
              <span class="text-caption text-medium-emphasis">{{
                fmtAgo(a.createdAt)
              }}</span>
            </template>
          </v-list-item>
          <v-divider />
        </template>
      </v-list>

      <div
        v-else
        class="text-center text-body-2 text-medium-emphasis py-8 px-4"
      >
        <v-icon size="28" class="mb-2 d-block mx-auto"
          >mdi-bell-check-outline</v-icon
        >
        Sin alertas activas
      </div>

      <v-btn
        block
        variant="text"
        color="primary"
        class="rounded-0 text-none"
        to="/admin/alertas"
      >
        Ver todas las alertas
      </v-btn>
    </v-sheet>
  </v-menu>
</template>
