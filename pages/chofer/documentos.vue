<script setup lang="ts">
import { onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentStore } from "~/stores/document";
import { useTripStore } from "~/stores/trip";
import { useDocumentStatus } from "~/composables/useDocumentStatus";

definePageMeta({ layout: "driver" });
useHead({ title: "Documentos" });

const store = useDocumentStore();
const tripStore = useTripStore();
const { myDocuments, loading } = storeToRefs(store);
const { myTrips } = storeToRefs(tripStore);
const { documentCategory, documentStatus, ownerType } = useDocumentStatus();

const STATUS_HEX: Record<string, string> = {
  valid: "#4CAF50",
  expiring: "#FF9800",
  expired: "#F44336",
};
const statusHex = (s: string) => STATUS_HEX[s] ?? "#9E9E9E";

const activeTruckId = computed(
  () =>
    myTrips.value.find((t) => t.status === "in_progress")?.truckId ||
    myTrips.value.find((t) => t.status === "assigned")?.truckId,
);

onMounted(async () => {
  await tripStore.getMyTrips();
  await store.getMine(activeTruckId.value);
});
</script>

<template>
  <div>
    <h1 class="text-h6 font-weight-bold mb-3">Documentos</h1>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!myDocuments.length" class="text-body-2 text-medium-emphasis">
        No hay documentos disponibles.
      </p>
      <v-card
        v-for="d in myDocuments"
        :key="d.id"
        rounded="lg"
        elevation="2"
        class="mb-3 alert-card"
        :style="`--accent: ${statusHex(d.status)}`"
      >
        <div class="d-flex align-center ga-3 pa-3">
          <v-avatar rounded="lg" size="44">
            <v-icon :color="documentStatus(d.status).color" size="22"
              >mdi-file-document-outline</v-icon
            >
          </v-avatar>
          <div class="flex-grow-1 min-w-0">
            <div class="text-subtitle-2 font-weight-bold">
              {{ documentCategory(d.category).label }}
            </div>
            <div
              class="d-flex align-center ga-1 text-caption text-medium-emphasis mt-1"
            >
              <span>{{ ownerType(d.ownerType).label }}</span>
              <span>·</span>
              <v-icon size="14">mdi-calendar-clock</v-icon>
              <span>Vence {{ d.expiryDate || "-" }}</span>
            </div>
          </div>
          <v-chip
            :color="documentStatus(d.status).color"
            size="small"
            label
            variant="flat"
          >
            {{ documentStatus(d.status).label }}
          </v-chip>
          <v-btn
            v-if="d.fileKey"
            icon="mdi-file-eye"
            aria-label="Ver archivo"
            size="small"
            variant="text"
            @click="store.openFile(d.id)"
          />
        </div>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.alert-card {
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}
.alert-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--accent, #9e9e9e);
}
.alert-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.min-w-0 {
  min-width: 0;
}
</style>
