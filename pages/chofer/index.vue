<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { useTripStatus } from "~/composables/useTripStatus";
import OdometerDialog from "~/components/trip/OdometerDialog.vue";

definePageMeta({
  layout: "driver",
  middleware: "auth",
});

useHead({ title: "Mis viajes" });

const router = useRouter();
const tripStore = useTripStore();
const { myTrips, loading } = storeToRefs(tripStore);
const { tripStatus } = useTripStatus();

const odoDialog = ref(false);
const odoMode = ref<"start" | "finish">("start");
const odoTripId = ref("");
const odoSuggested = ref<number | null>(null);

const activeTrips = computed(() =>
  myTrips.value.filter((t) => t.status === "assigned" || t.status === "in_progress"),
);
const pastTrips = computed(() =>
  myTrips.value.filter((t) => t.status === "finished" || t.status === "canceled"),
);

const openStart = (tripId: string, km?: number | null) => {
  odoMode.value = "start";
  odoTripId.value = tripId;
  odoSuggested.value = km ?? null;
  odoDialog.value = true;
};
const openFinish = (tripId: string, km?: number | null) => {
  odoMode.value = "finish";
  odoTripId.value = tripId;
  odoSuggested.value = km ?? null;
  odoDialog.value = true;
};
const goDetail = (id: string) => router.push(`/chofer/viaje/${id}`);

onMounted(() => tripStore.getMyTrips());
</script>

<template>
  <div>
    <h1 class="text-h6 font-weight-bold mb-3">Mis viajes</h1>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!activeTrips.length" class="text-body-2 text-medium-emphasis">
        No tenés viajes activos.
      </p>

      <v-card
        v-for="t in activeTrips"
        :key="t.id"
        class="mb-3"
        variant="outlined"
        @click="goDetail(t.id)"
      >
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="font-weight-bold">{{ t.code }}</span>
            <v-chip :color="tripStatus(t.status).color" size="small" label>
              {{ tripStatus(t.status).label }}
            </v-chip>
          </div>
          <div class="text-body-2">
            <v-icon size="16">mdi-map-marker-path</v-icon>
            {{ t.origin }} → {{ t.destination }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t.truck?.plate }}<span v-if="t.cargoDescription"> · {{ t.cargoDescription }}</span>
          </div>

          <div class="d-flex ga-2 mt-3" @click.stop>
            <v-btn
              v-if="t.status === 'assigned'"
              color="primary"
              size="small"
              prepend-icon="mdi-play"
              @click="openStart(t.id, t.truck?.currentOdometerKm)"
            >
              Iniciar
            </v-btn>
            <v-btn
              v-if="t.status === 'in_progress'"
              color="success"
              size="small"
              prepend-icon="mdi-flag-checkered"
              @click="openFinish(t.id, t.startOdometerKm)"
            >
              Finalizar
            </v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-notebook" @click="goDetail(t.id)">
              Bitácora
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <template v-if="pastTrips.length">
        <p class="text-subtitle-2 font-weight-bold mt-5 mb-2">Historial</p>
        <v-card
          v-for="t in pastTrips"
          :key="t.id"
          class="mb-2"
          variant="tonal"
          @click="goDetail(t.id)"
        >
          <v-card-text class="py-2">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 font-weight-bold">{{ t.code }}</span>
              <v-chip :color="tripStatus(t.status).color" size="x-small" label>
                {{ tripStatus(t.status).label }}
              </v-chip>
            </div>
            <div class="text-caption">{{ t.origin }} → {{ t.destination }}</div>
          </v-card-text>
        </v-card>
      </template>
    </template>

    <OdometerDialog
      v-model="odoDialog"
      :trip-id="odoTripId"
      :mode="odoMode"
      :suggested-km="odoSuggested"
      @done="tripStore.getMyTrips()"
    />
  </div>
</template>
