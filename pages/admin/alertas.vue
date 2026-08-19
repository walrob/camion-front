<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAlertStore } from "~/stores/alert";
import {
  alertLevelOptions,
  alertStatusOptions,
  useAlertStatus,
} from "~/composables/useAlertStatus";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher", "hr"],
});
useHead({ title: "Alertas" });

const alertStore = useAlertStore();
const { sorted, loading, activeCount } = storeToRefs(alertStore);
const { alertLevel, alertStatus } = useAlertStatus();

const { fmtDateTime: fmt } = useFormatters();
const LEVEL_HEX: Record<string, string> = {
  red: "#F44336",
  orange: "#FF9800",
  yellow: "#FFC107",
  green: "#4CAF50",
};
const levelHex = (level: string) => LEVEL_HEX[level] ?? "#9E9E9E";

// Las actualizaciones en vivo llegan por el centro de alertas global del navbar
// (NotificationDD), que alimenta este mismo store. Acá solo cargamos el listado.
onMounted(() => {
  alertStore.getAlerts();
  alertStore.getCount();
});

// ── Reapertura ──────────────────────────────────────────────────────────────
// Una alerta resuelta no vuelve atrás con un click: se reabre con motivo y eso
// queda en la auditoría. RRHH no aparece acá porque no revierte cierres (lo
// rechaza el backend igual).
const auth = useAuthStore();
const puedeReabrir = computed(
  () => auth.isAdmin || auth.isManager || auth.isDispatcher,
);

const reapertura = ref<{ abierto: boolean; id: string; titulo: string }>({
  abierto: false,
  id: "",
  titulo: "",
});
const reabriendo = ref(false);

const pedirReapertura = (a: { id: string; title: string }) => {
  reapertura.value = { abierto: true, id: a.id, titulo: a.title };
};

const confirmarReapertura = async (motivo: string) => {
  reabriendo.value = true;
  const ok = await alertStore.reopen(reapertura.value.id, motivo);
  reabriendo.value = false;
  if (ok) reapertura.value.abierto = false;
};
</script>

<template>
  <div>
    <PageHeader title="Alertas" subtitle="Bandeja priorizada en tiempo real">
      <template #actions>
        <v-badge
          v-if="activeCount"
          :content="activeCount"
          color="error"
          inline
        />
        <v-chip color="success" size="small" variant="tonal">
          <v-icon start size="14">mdi-circle</v-icon> En vivo
        </v-chip>
      </template>
    </PageHeader>

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
      <v-text-field
        v-model="alertStore.filterFrom"
        label="Desde"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 180px"
        @update:model-value="alertStore.getAlerts()"
      />
      <v-text-field
        v-model="alertStore.filterTo"
        label="Hasta"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 180px"
        @update:model-value="alertStore.getAlerts()"
      />
    </div>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <EmptyState
        v-if="!sorted.length"
        icon="mdi-check-circle-outline"
        text="No hay alertas."
      />

      <v-card
        v-for="a in sorted"
        :key="a.id"
        border
        flat
        rounded="lg"
        class="mb-3 accent-card"
        :class="{ 'accent-card--resolved': a.status === 'resolved' }"
        :style="`--accent: ${levelHex(a.level)}`"
      >
        <div class="pa-3">
          <div class="d-flex align-center ga-2">
            <v-avatar rounded="lg" size="40">
              <v-icon :color="alertLevel(a.level).color" size="20"
                >mdi-bell-ring-outline</v-icon
              >
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-center ga-2 flex-wrap">
                <span class="text-subtitle-2 font-weight-bold">{{
                  a.title
                }}</span>
                <v-chip
                  :color="alertLevel(a.level).color"
                  size="x-small"
                  label
                  variant="tonal"
                >
                  {{ alertLevel(a.level).label }}
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ fmt(a.createdAt) }}
              </div>
            </div>
            <v-chip
              :color="alertStatus(a.status).color"
              size="small"
              label
              variant="flat"
            >
              {{ alertStatus(a.status).label }}
            </v-chip>
          </div>

          <div class="text-body-2 mt-2 ms-1">{{ a.message }}</div>

          <div class="d-flex ga-2 mt-3" v-if="a.status !== 'resolved'">
            <v-btn
              v-if="a.status === 'new'"
              size="small"
              variant="tonal"
              @click="alertStore.setStatus(a.id, 'seen')"
            >
              Visto
            </v-btn>
            <v-btn
              v-if="a.status !== 'acknowledged'"
              size="small"
              variant="tonal"
              color="warning"
              @click="alertStore.setStatus(a.id, 'acknowledge')"
            >
              Atender
            </v-btn>
            <v-btn
              v-else
              size="small"
              variant="text"
              color="medium-emphasis"
              @click="alertStore.setStatus(a.id, 'seen')"
            >
              Desatender
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              @click="alertStore.setStatus(a.id, 'resolve')"
            >
              Resolver
            </v-btn>
          </div>

          <div v-else class="d-flex ga-2 mt-3 align-center">
            <v-icon size="15" color="medium-emphasis">
              mdi-lock-check-outline
            </v-icon>
            <span class="text-caption text-medium-emphasis">
              Resuelta. Si el problema sigue, reabrila indicando el motivo.
            </span>
            <v-spacer />
            <v-btn
              v-if="puedeReabrir"
              size="small"
              variant="text"
              prepend-icon="mdi-lock-open-variant-outline"
              @click="pedirReapertura(a)"
            >
              Reabrir
            </v-btn>
          </div>
        </div>
      </v-card>
    </template>

    <ModalReopen
      v-model="reapertura.abierto"
      title="Reabrir alerta"
      :description="reapertura.titulo"
      :loading="reabriendo"
      @confirm="confirmarReapertura"
    />
  </div>
</template>
