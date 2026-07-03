<script setup lang="ts">
import { onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useOeaStore } from "~/stores/oea";
import { useTripStore } from "~/stores/trip";
import { useOea } from "~/composables/useOea";

definePageMeta({ layout: "driver" });
useHead({ title: "Planillas OEA" });

const router = useRouter();
const store = useOeaStore();
const tripStore = useTripStore();
const { myList, loading, saving } = storeToRefs(store);
const { myTrips } = storeToRefs(tripStore);
const { oeaResult } = useOea();

const activeTrip = computed(
  () =>
    myTrips.value.find((t) => t.status === "in_progress") ||
    myTrips.value.find((t) => t.status === "assigned"),
);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("es-AR") : "-";

const startNew = async () => {
  const trip = activeTrip.value;
  if (!trip) return;
  const created = await store.create({
    truckId: trip.truckId,
    tripId: trip.id,
    trailerId: trip.trailerId || undefined,
    origin: trip.origin,
    destination: trip.destination,
    cargoDescription: trip.cargoDescription || undefined,
  });
  if (created) router.push(`/chofer/oea/${created.id}`);
};

onMounted(async () => {
  await tripStore.getMyTrips();
  await store.getMine();
});
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <h1 class="text-h6 font-weight-bold">Planillas OEA</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-clipboard-check-outline"
        :disabled="!activeTrip"
        :loading="saving"
        @click="startNew"
      >
        Nueva
      </v-btn>
    </div>

    <v-alert
      v-if="!activeTrip"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Necesitás un viaje activo o asignado para iniciar una planilla.
    </v-alert>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!myList.length" class="text-body-2 text-medium-emphasis">
        Todavía no registraste planillas.
      </p>

      <v-card
        v-for="p in myList"
        :key="p.id"
        rounded="lg"
        elevation="2"
        class="mb-2"
        @click="router.push(`/chofer/oea/${p.id}`)"
      >
        <v-card-text class="py-2 d-flex align-center ga-3">
          <v-icon size="28" color="primary">mdi-shield-check-outline</v-icon>
          <div class="flex-grow-1">
            <div class="font-weight-bold">
              {{ p.truck?.plate || "-" }}
              <span v-if="p.tripNumber" class="text-medium-emphasis font-weight-regular">
                · Viaje {{ p.tripNumber }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ fmtDate(p.inspectedAt) }}
              <span v-if="p.origin"> · {{ p.origin }} → {{ p.destination }}</span>
            </div>
          </div>
          <v-chip :color="oeaResult(p.result).color" size="x-small" label>
            {{ oeaResult(p.result).label }}
          </v-chip>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
