<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { useTripStatus } from "~/composables/useTripStatus";
import OdometerDialog from "~/components/trip/OdometerDialog.vue";
import EmptyState from "~/components/shared/EmptyState.vue";

definePageMeta({
  layout: "driver",
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

// La pantalla de inicio es la única que saluda por nombre: es lo que hace que la
// app se sienta del chofer y no un panel genérico. El subtítulo resume la jornada.
const auth = useAuth();
useDriverPage(() => ({
  title: auth.name ? `Hola, ${auth.name.split(" ")[0]}` : "Mis viajes",
  subtitle: activeTrips.value.length
    ? `Tenés ${activeTrips.value.length} viaje${activeTrips.value.length > 1 ? "s" : ""} en curso`
    : "No tenés viajes activos",
}));

const quickLinks = [
  {
    title: "Combustible",
    icon: "mdi-gas-station",
    to: "/chofer/combustible",
    tone: "warning",
  },
  {
    title: "Planilla OEA",
    icon: "mdi-shield-check-outline",
    to: "/chofer/oea",
    tone: "secondary",
  },
];

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
    <!-- Accesos rápidos: quedan sobre el corte del hero, como en las apps de
         referencia, y son lo primero que alcanza el pulgar. -->
    <div class="quick-grid mb-5">
      <v-card
        v-for="q in quickLinks"
        :key="q.to"
        :to="q.to"
        border
        flat
        rounded="lg"
        class="pa-3 quick-card"
        :style="{ '--tone': `var(--v-theme-${q.tone})` }"
      >
        <div class="d-flex align-center ga-3">
          <v-avatar rounded="lg" size="40" class="quick-card__icon">
            <v-icon :color="q.tone" size="22">{{ q.icon }}</v-icon>
          </v-avatar>
          <span class="text-body-2 font-weight-bold">{{ q.title }}</span>
        </div>
      </v-card>
    </div>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <EmptyState
        v-if="!activeTrips.length"
        icon="mdi-truck-check-outline"
        text="No tenés viajes activos."
      />

      <v-card
        v-for="t in activeTrips"
        :key="t.id"
        class="mb-4 trip-card"
        rounded="lg"
        border
        flat
        @click="goDetail(t.id)"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-1 font-weight-bold">{{ t.code }}</span>
            <v-chip :color="tripStatus(t.status).color" size="small" label>
              {{ tripStatus(t.status).label }}
            </v-chip>
          </div>

          <!-- Ruta como mini-línea de tiempo: en un vistazo se lee de dónde sale
               y a dónde va, sin depender de la flecha en medio de una frase. -->
          <div class="route">
            <div class="route__row">
              <span class="route__dot route__dot--from" />
              <span class="text-body-2 font-weight-medium">{{ t.origin }}</span>
            </div>
            <div class="route__row">
              <span class="route__dot route__dot--to" />
              <span class="text-body-2 font-weight-medium">
                {{ t.destination }}
              </span>
            </div>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap mt-3">
            <v-chip
              v-if="t.truck?.plate"
              size="x-small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-truck-outline"
            >
              {{ t.truck.plate }}
            </v-chip>
            <span
              v-if="t.cargoDescription"
              class="text-caption text-medium-emphasis text-truncate"
            >
              {{ t.cargoDescription }}
            </span>
          </div>

          <div class="d-flex ga-2 mt-4" @click.stop>
            <v-btn
              v-if="t.status === 'assigned'"
              color="primary"
              class="flex-grow-1"
              prepend-icon="mdi-play"
              @click="openStart(t.id, t.truck?.currentOdometerKm)"
            >
              Iniciar
            </v-btn>
            <v-btn
              v-if="t.status === 'in_progress'"
              color="success"
              class="flex-grow-1"
              prepend-icon="mdi-flag-checkered"
              @click="openFinish(t.id, t.startOdometerKm)"
            >
              Finalizar
            </v-btn>
            <v-btn
              variant="tonal"
              prepend-icon="mdi-notebook"
              @click="goDetail(t.id)"
            >
              Bitácora
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <template v-if="pastTrips.length">
        <p class="text-subtitle-2 font-weight-bold mt-6 mb-3">Historial</p>
        <v-card
          v-for="t in pastTrips"
          :key="t.id"
          class="mb-2"
          border
          flat
          rounded="lg"
          @click="goDetail(t.id)"
        >
          <v-card-text class="py-3 d-flex align-center ga-3">
            <v-avatar
              rounded="lg"
              size="36"
              :color="tripStatus(t.status).color"
              variant="tonal"
            >
              <v-icon size="18">mdi-map-marker-path</v-icon>
            </v-avatar>
            <div class="min-w-0 flex-grow-1">
              <div class="text-body-2 font-weight-bold">{{ t.code }}</div>
              <div class="text-caption text-truncate">
                {{ t.origin }} → {{ t.destination }}
              </div>
            </div>
            <v-chip :color="tripStatus(t.status).color" size="x-small" label>
              {{ tripStatus(t.status).label }}
            </v-chip>
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

<style scoped lang="scss">
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-card__icon {
  background: rgba(var(--tone), 0.14);
}

// Feedback táctil: en mobile no hay hover, así que el "hundido" al tocar es la
// única señal de que la tarjeta es pulsable.
.trip-card,
.quick-card {
  transition: transform 0.12s ease;

  &:active {
    transform: scale(0.985);
  }
}

// Ruta origen → destino como línea de tiempo vertical.
.route {
  position: relative;
  padding-left: 4px;

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 26px;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: 0 0 auto;

    &--from {
      background: rgb(var(--v-theme-primary));
    }

    &--to {
      background: transparent;
      border: 2px solid rgb(var(--v-theme-success));
    }
  }

  // El tramo punteado que une los dos puntos.
  &__row:first-child::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 20px;
    height: 12px;
    border-left: 2px dotted rgb(var(--v-theme-borderColor));
  }
}
</style>
