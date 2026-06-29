<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
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
const { incidents, loading } = storeToRefs(incidentStore);
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
const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : "");

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
    <PageHeader title="Centro de Incidentes" subtitle="Seguimiento y resolución de incidentes de la flota" />

    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <v-select
        v-model="incidentStore.filterType"
        :items="incidentTypeOptions"
        item-title="label"
        item-value="value"
        label="Tipo"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 220px"
        @update:model-value="incidentStore.getIncidents()"
      />
      <v-select
        v-model="incidentStore.filterSeverity"
        :items="incidentSeverityOptions"
        item-title="label"
        item-value="value"
        label="Severidad"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="incidentStore.getIncidents()"
      />
      <v-chip color="success" size="small" variant="tonal">
        <v-icon start size="14">mdi-circle</v-icon> En vivo
      </v-chip>
    </div>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-row v-else>
      <v-col v-for="col in columns" :key="col.value" cols="12" md="4">
        <div class="d-flex align-center ga-2 mb-2">
          <v-chip :color="col.color" size="small" label>{{ col.label }}</v-chip>
          <span class="text-caption">{{ byStatus(col.value).length }}</span>
        </div>

        <v-card
          v-for="i in byStatus(col.value)"
          :key="i.id"
          variant="outlined"
          class="mb-2"
          @click="open(i)"
        >
          <v-card-text class="py-2">
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon :color="incidentType(i.type).color" size="20">
                {{ incidentType(i.type).icon }}
              </v-icon>
              <span class="font-weight-bold text-body-2">{{ incidentType(i.type).label }}</span>
              <v-spacer />
              <v-chip :color="incidentSeverity(i.severity).color" size="x-small" label>
                {{ incidentSeverity(i.severity).label }}
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ i.code }} · {{ i.truck?.plate }} · {{ fmt(i.createdAt) }}
            </div>
            <div class="text-body-2 text-truncate">{{ i.description }}</div>
            <v-chip
              v-if="!i.assignedToUserId"
              color="warning"
              size="x-small"
              variant="tonal"
              class="mt-1"
            >
              Sin asignar
            </v-chip>
          </v-card-text>
        </v-card>

        <p
          v-if="!byStatus(col.value).length"
          class="text-caption text-medium-emphasis text-center py-4"
        >
          Sin incidentes
        </p>
      </v-col>
    </v-row>

    <IncidentDetailDialog v-model="dialog" :incident-id="selectedId" />
  </div>
</template>
