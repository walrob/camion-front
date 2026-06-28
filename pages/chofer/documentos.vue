<script setup lang="ts">
import { onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentStore } from "~/stores/document";
import { useTripStore } from "~/stores/trip";
import { useDocumentStatus } from "~/composables/useDocumentStatus";

definePageMeta({ layout: "driver", middleware: "auth" });
useHead({ title: "Documentos" });

const store = useDocumentStore();
const tripStore = useTripStore();
const { myDocuments, loading } = storeToRefs(store);
const { myTrips } = storeToRefs(tripStore);
const { documentCategory, documentStatus, ownerType } = useDocumentStatus();

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
      <v-card v-for="d in myDocuments" :key="d.id" variant="outlined" class="mb-2">
        <v-card-text class="py-2 d-flex align-center ga-3">
          <v-icon :color="documentStatus(d.status).color" size="28">mdi-file-document</v-icon>
          <div class="flex-grow-1">
            <div class="font-weight-bold">{{ documentCategory(d.category).label }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ ownerType(d.ownerType).label }} · Vence: {{ d.expiryDate || "-" }}
            </div>
          </div>
          <v-chip :color="documentStatus(d.status).color" size="x-small" label class="mr-1">
            {{ documentStatus(d.status).label }}
          </v-chip>
          <v-btn
            v-if="d.fileKey"
            icon="mdi-file-eye"
            size="small"
            variant="text"
            @click="store.openFile(d.id)"
          />
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
