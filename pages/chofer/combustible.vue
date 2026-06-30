<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useFuelStore } from "~/stores/fuel";
import { useTripStore } from "~/stores/trip";
import { useFuelStatus } from "~/composables/useFuelStatus";
import FuelLoadDialog from "~/components/fuel/FuelLoadDialog.vue";

definePageMeta({ layout: "driver" });
useHead({ title: "Combustible" });

const store = useFuelStore();
const tripStore = useTripStore();
const { myLoads, loading } = storeToRefs(store);
const { myTrips } = storeToRefs(tripStore);
const { fuelType } = useFuelStatus();

const dialog = ref(false);

// El camión y viaje activo se derivan del viaje en curso o asignado del chofer.
const activeTrip = computed(
  () =>
    myTrips.value.find((t) => t.status === "in_progress") ||
    myTrips.value.find((t) => t.status === "assigned"),
);
const activeTruckId = computed(() => activeTrip.value?.truckId ?? null);

const money = (n?: number) => `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-AR") : "-";

onMounted(async () => {
  await tripStore.getMyTrips();
  await store.getMine();
});
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <h1 class="text-h6 font-weight-bold">Combustible</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-gas-station"
        :disabled="!activeTruckId"
        @click="dialog = true"
      >
        Cargar
      </v-btn>
    </div>

    <v-alert
      v-if="!activeTruckId"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Necesitás un viaje activo o asignado para registrar una carga.
    </v-alert>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!myLoads.length" class="text-body-2 text-medium-emphasis">
        Todavía no registraste cargas.
      </p>

      <v-card
        v-for="l in myLoads"
        :key="l.id"
        variant="outlined"
        class="mb-2"
      >
        <v-card-text class="py-2 d-flex align-center ga-3">
          <v-icon :color="fuelType(l.fuelType).color" size="28">
            {{ fuelType(l.fuelType).icon }}
          </v-icon>
          <div class="flex-grow-1">
            <div class="font-weight-bold">
              {{ Number(l.liters).toLocaleString("es-AR") }} L
              <span class="text-medium-emphasis font-weight-regular">
                · {{ money(l.totalAmount) }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ l.truck?.plate || "-" }} · {{ fmtDate(l.occurredAt) }}
              <span v-if="l.odometerKm"> · {{ l.odometerKm.toLocaleString("es-AR") }} km</span>
            </div>
          </div>
          <v-chip v-if="l.fullTank" size="x-small" color="primary" label>
            Tanque lleno
          </v-chip>
        </v-card-text>
      </v-card>
    </template>

    <FuelLoadDialog
      v-model="dialog"
      :truck-id="activeTruckId"
      :trip-id="activeTrip?.id"
      @saved="store.getMine()"
    />
  </div>
</template>
