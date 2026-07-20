<script setup lang="ts">
import { onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentStore } from "~/stores/document";
import { useTripStore } from "~/stores/trip";
import { useDocumentStatus } from "~/composables/useDocumentStatus";
import EmptyState from "~/components/shared/EmptyState.vue";

definePageMeta({ layout: "driver" });
useHead({ title: "Documentos" });
useDriverPage({
  title: "Documentos",
  subtitle: "Del camión, el acoplado y los tuyos",
});

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
    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <EmptyState
        v-if="!myDocuments.length"
        icon="mdi-file-document-outline"
        text="No hay documentos disponibles."
      />
      <v-card
        v-for="d in myDocuments"
        :key="d.id"
        rounded="lg"
        border
        flat
        class="mb-3 accent-card"
        :style="`--accent: ${statusHex(d.status)}`"
      >
        <div class="d-flex align-center ga-3 pa-3">
          <v-avatar
            rounded="lg"
            size="44"
            :color="documentStatus(d.status).color"
            variant="tonal"
          >
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
              <span>Vence {{ formatDateLocal(d.expiryDate) || "-" }}</span>
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
