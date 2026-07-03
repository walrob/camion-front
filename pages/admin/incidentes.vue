<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import ErrorState from "~/components/shared/ErrorState.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useTheme } from "vuetify";
import { useIncidentStore } from "~/stores/incident";
import {
  incidentTypeOptions,
  incidentSeverityOptions,
  incidentStatusOptions,
  useIncidentStatus,
} from "~/composables/useIncidentStatus";
import { useIncidentSocket } from "~/composables/useIncidentSocket";
import IncidentDetailDialog from "~/components/incident/IncidentDetailDialog.vue";
import type { Incident } from "~/types/incident";

definePageMeta({
  layout: "admin",
  roles: ["admin", "dispatcher", "manager", "maintenance"],
});
useHead({ title: "Incidentes" });

const incidentStore = useIncidentStore();
const { incidents, loading, error } = storeToRefs(incidentStore);
const { incidentType, incidentSeverity } = useIncidentStatus();

const dialog = ref(false);
const selectedId = ref<string | null>(null);

const columns = incidentStatusOptions;
const byStatus = (status: string) =>
  incidents.value.filter((i) => i.status === status);

const open = (i: Incident) => {
  selectedId.value = i.id;
  dialog.value = true;
};

// Color de la severidad resuelto desde el tema (para el acento de la tarjeta).
const theme = useTheme();
const SEV_FALLBACK: Record<string, string> = { grey: "#94A3B8" };
const sevHex = (sev: string) => {
  const c = incidentSeverity(sev).color;
  return (
    (theme.current.value.colors as Record<string, string>)[c] ||
    SEV_FALLBACK[c] ||
    c
  );
};

const timeAgo = (d?: string) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

const socket = useIncidentSocket((incident) => {
  incidentStore.upsert(incident);
});

onMounted(() => {
  incidentStore.getIncidents();
  socket.connect();
});
onBeforeUnmount(() => socket.disconnect());
</script>

<template>
  <div>
    <PageHeader
      title="Centro de Incidentes"
      subtitle="Seguimiento y resolución de incidentes de la flota"
    >
      <template #actions>
        <v-chip color="success" size="small" variant="tonal">
          <v-icon start size="14">mdi-circle</v-icon> En vivo
        </v-chip>
      </template>
    </PageHeader>

    <!-- Filtros -->
    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <v-select
        v-model="incidentStore.filterType"
        :items="incidentTypeOptions"
        item-title="label"
        item-value="value"
        label="Tipo"
        clearable
        style="min-width: 220px; max-width: 260px"
        @update:model-value="incidentStore.getIncidents()"
      />
      <v-select
        v-model="incidentStore.filterSeverity"
        :items="incidentSeverityOptions"
        item-title="label"
        item-value="value"
        label="Severidad"
        clearable
        style="min-width: 200px; max-width: 240px"
        @update:model-value="incidentStore.getIncidents()"
      />
      <v-text-field
        v-model="incidentStore.filterFrom"
        label="Desde"
        type="date"
        style="min-width: 160px; max-width: 180px"
        @update:model-value="incidentStore.getIncidents()"
      />
      <v-text-field
        v-model="incidentStore.filterTo"
        label="Hasta"
        type="date"
        style="min-width: 160px; max-width: 180px"
        @update:model-value="incidentStore.getIncidents()"
      />
    </div>

    <ErrorState
      v-if="error && !incidents.length"
      @retry="incidentStore.getIncidents()"
    />

    <!-- Tablero por estado -->
    <v-row v-else>
      <v-col v-for="col in columns" :key="col.value" cols="12" md="4">
        <div class="kanban-col">
          <!-- Encabezado de columna -->
          <div class="d-flex align-center ga-2 mb-3">
            <v-icon :color="col.color" size="12">mdi-circle</v-icon>
            <span class="text-subtitle-2 font-weight-bold">{{
              col.label
            }}</span>
            <v-chip size="x-small" variant="tonal" class="ml-1">{{
              byStatus(col.value).length
            }}</v-chip>
          </div>

          <!-- Skeletons -->
          <template v-if="loading && !incidents.length">
            <v-skeleton-loader
              v-for="n in 2"
              :key="n"
              type="article"
              class="mb-2 rounded-lg"
            />
          </template>

          <template v-else>
            <v-card
              v-for="i in byStatus(col.value)"
              :key="i.id"
              border
              flat
              rounded="lg"
              class="incident-card mb-2"
              :style="{ borderLeft: `3px solid ${sevHex(i.severity)}` }"
              @click="open(i)"
            >
              <v-card-text class="py-3">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-avatar
                    :color="incidentType(i.type).color"
                    variant="tonal"
                    size="30"
                    rounded="lg"
                  >
                    <v-icon :color="incidentType(i.type).color" size="18">
                      {{ incidentType(i.type).icon }}
                    </v-icon>
                  </v-avatar>
                  <span class="font-weight-bold text-body-2 text-truncate">
                    {{ incidentType(i.type).label }}
                  </span>
                  <v-spacer />
                  <v-chip
                    :color="incidentSeverity(i.severity).color"
                    size="x-small"
                    label
                  >
                    {{ incidentSeverity(i.severity).label }}
                  </v-chip>
                </div>

                <div class="text-caption text-medium-emphasis mb-1">
                  {{ i.code }} · {{ i.truck?.plate || "—" }} ·
                  {{ timeAgo(i.createdAt) }}
                </div>

                <div class="text-body-2 incident-desc">{{ i.description }}</div>

                <v-chip
                  v-if="!i.assignedToUserId"
                  color="warning"
                  size="x-small"
                  variant="tonal"
                  class="mt-2"
                >
                  <v-icon start size="12">mdi-account-question-outline</v-icon>
                  Sin asignar
                </v-chip>
              </v-card-text>
            </v-card>

            <EmptyState
              v-if="!byStatus(col.value).length"
              size="32"
              icon="mdi-check-circle-outline"
              text="Sin alertas activas."
            />
          </template>
        </div>
      </v-col>
    </v-row>

    <IncidentDetailDialog v-model="dialog" :incident-id="selectedId" />
  </div>
</template>

<style scoped>
.kanban-col {
  background: rgb(var(--v-theme-grey100));
  border: 1px solid rgb(var(--v-theme-borderColor));
  border-radius: 12px;
  padding: 12px;
  height: 100%;
}

.incident-card {
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}
.incident-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.incident-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
