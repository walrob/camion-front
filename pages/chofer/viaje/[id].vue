<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { useTripLogStore } from "~/stores/tripLog";
import { useTripStatus } from "~/composables/useTripStatus";
import OdometerDialog from "~/components/trip/OdometerDialog.vue";
import ExpenseFormDialog from "~/components/trip/ExpenseFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { TripLogEntry } from "~/types/trip";

definePageMeta({
  layout: "driver",
});

const route = useRoute();
const id = route.params.id as string;

const tripStore = useTripStore();
const tripLogStore = useTripLogStore();
const { trip } = storeToRefs(tripStore);
const { entries, summary, loading } = storeToRefs(tripLogStore);
const { tripStatus, expenseType } = useTripStatus();

useHead({ title: "Viaje" });

const expenseDialog = ref(false);
const odoDialog = ref(false);
const odoMode = ref<"start" | "finish">("start");
const confirm = ref(false);
const toDelete = ref<TripLogEntry | null>(null);

const canEdit = computed(
  () => trip.value?.status === "assigned" || trip.value?.status === "in_progress",
);
const money = (n?: number) => `$ ${Number(n ?? 0).toFixed(2)}`;

const openStart = () => {
  odoMode.value = "start";
  odoDialog.value = true;
};
const openFinish = () => {
  odoMode.value = "finish";
  odoDialog.value = true;
};
const askDelete = (e: TripLogEntry) => {
  toDelete.value = e;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await tripLogStore.deleteEntry(toDelete.value.id, id);
  toDelete.value = null;
};

const reload = async () => {
  await tripStore.getMyTrip(id);
  await tripLogStore.getEntries(id);
};

onMounted(reload);
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-3">
      <v-btn icon="mdi-arrow-left" aria-label="Volver" variant="text" to="/chofer" />
      <h1 class="text-h6 font-weight-bold">{{ trip?.code || "Viaje" }}</h1>
      <v-spacer />
      <v-chip v-if="trip" :color="tripStatus(trip.status).color" size="small" label>
        {{ tripStatus(trip.status).label }}
      </v-chip>
    </div>

    <v-card v-if="trip" variant="outlined" class="mb-4">
      <v-card-text>
        <div class="text-body-2">
          <v-icon size="16">mdi-map-marker-path</v-icon>
          {{ trip.origin }} → {{ trip.destination }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ trip.truck?.plate }}
          <span v-if="trip.cargoDescription"> · {{ trip.cargoDescription }}</span>
        </div>

        <div class="d-flex ga-2 mt-3 flex-wrap">
          <v-btn
            v-if="trip.status === 'assigned'"
            color="indigo"
            size="small"
            variant="tonal"
            prepend-icon="mdi-clipboard-check-outline"
            :to="`/chofer/viaje/${id}/checklist`"
          >
            Checklist
          </v-btn>
          <v-btn
            v-if="trip.status === 'assigned'"
            color="primary"
            size="small"
            prepend-icon="mdi-play"
            @click="openStart"
          >
            Iniciar
          </v-btn>
          <v-btn
            v-if="trip.status === 'in_progress'"
            color="success"
            size="small"
            prepend-icon="mdi-flag-checkered"
            @click="openFinish"
          >
            Finalizar
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Resumen -->
    <v-card v-if="summary" color="primary" variant="tonal" class="mb-3">
      <v-card-text class="d-flex justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-caption">Gastos</div>
          <div class="font-weight-bold">{{ money(summary.totalExpenses) }}</div>
        </div>
        <div>
          <div class="text-caption">Adelantos</div>
          <div class="font-weight-bold">{{ money(summary.totalAdvances) }}</div>
        </div>
        <div>
          <div class="text-caption">Neto a rendir</div>
          <div class="font-weight-bold">{{ money(summary.netToSettle) }}</div>
        </div>
      </v-card-text>
    </v-card>

    <div class="d-flex align-center mb-2">
      <span class="text-subtitle-2 font-weight-bold">Bitácora</span>
      <v-spacer />
    </div>

    <div v-if="loading" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!entries.length" class="text-body-2 text-medium-emphasis">
        Sin gastos registrados.
      </p>
      <v-card v-for="e in entries" :key="e.id" variant="outlined" class="mb-2">
        <v-card-text class="py-2 d-flex align-center ga-3">
          <v-avatar :color="expenseType(e.type).color" size="36">
            <v-icon color="white" size="20">{{ expenseType(e.type).icon }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="d-flex justify-space-between">
              <span class="font-weight-bold">{{ expenseType(e.type).label }}</span>
              <span class="font-weight-bold">{{ money(e.amount) }}</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              <span v-if="e.liters">{{ e.liters }} L · </span>
              <span v-if="e.notes">{{ e.notes }}</span>
            </div>
          </div>
          <v-btn
            v-if="canEdit"
            icon="mdi-delete" aria-label="Eliminar"
            size="x-small"
            variant="text"
            color="error"
            @click="askDelete(e)"
          />
        </v-card-text>
      </v-card>
    </template>

    <!-- FAB para agregar gasto -->
    <v-btn
      v-if="canEdit"
      icon="mdi-plus" aria-label="Agregar"
      color="primary"
      size="large"
      position="fixed"
      location="bottom end"
      class="ma-4"
      style="bottom: 80px"
      @click="expenseDialog = true"
    />

    <ExpenseFormDialog v-model="expenseDialog" :trip-id="id" @saved="reload" />
    <OdometerDialog
      v-model="odoDialog"
      :trip-id="id"
      :mode="odoMode"
      :suggested-km="odoMode === 'start' ? trip?.truck?.currentOdometerKm : trip?.startOdometerKm"
      @done="reload"
    />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar gasto"
      description="<p>¿Eliminar este gasto?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
