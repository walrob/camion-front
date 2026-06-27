<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { tripStatusOptions, useTripStatus } from "~/composables/useTripStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import TripFormDialog from "~/components/trip/TripFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Trip } from "~/types/trip";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  roles: ["admin", "dispatcher", "manager", "auditor"],
});

useHead({ title: "Viajes" });

const tripStore = useTripStore();
const { trips, loading, pagination } = storeToRefs(tripStore);
const { tripStatus } = useTripStatus();

const dialog = ref(false);
const selected = ref<Trip | null>(null);
const confirm = ref(false);
const action = ref<(() => Promise<any>) | null>(null);
const confirmText = ref("");

const headers = [
  { title: "Código", value: "code" },
  { title: "Origen → Destino", value: "route" },
  { title: "Camión", value: "truck.plate" },
  { title: "Chofer", value: "driver.user.name" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions" },
];

const openNew = () => {
  selected.value = null;
  dialog.value = true;
};
const openEdit = (t: Trip) => {
  selected.value = t;
  dialog.value = true;
};
const askCancel = (t: Trip) => {
  confirmText.value = `¿Cancelar el viaje ${t.code}?`;
  action.value = () => tripStore.cancelTrip(t.id);
  confirm.value = true;
};
const askDelete = (t: Trip) => {
  confirmText.value = `¿Eliminar el viaje ${t.code}?`;
  action.value = () => tripStore.deleteTrip(t.id);
  confirm.value = true;
};
const onConfirm = async (payload: { resp: boolean }) => {
  if (payload.resp && action.value) await action.value();
  action.value = null;
};
const changePage = (page: number) => {
  pagination.value.currentPage = page;
  tripStore.getTrips();
};

onMounted(() => tripStore.getTrips());
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Viajes</h1>

    <div class="d-flex flex-wrap ga-2 align-center mb-3">
      <VoiceTextField
        v-model="tripStore.search"
        label="Buscar código / destino"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 260px"
        @update:model-value="tripStore.getTrips()"
      />
      <v-select
        v-model="tripStore.filterStatus"
        :items="tripStatusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="tripStore.getTrips()"
      />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">Nuevo viaje</v-btn>
    </div>

    <ResponsiveTable :headers="headers" :items="trips" :loading="loading" all-items>
      <template #item.route="{ item }">
        {{ item.origin }} → {{ item.destination }}
      </template>
      <template #item.status="{ item }">
        <v-chip :color="tripStatus(item.status).color" size="small" label>
          {{ tripStatus(item.status).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.status === 'assigned'"
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click="openEdit(item)"
        />
        <v-btn
          v-if="item.status === 'assigned' || item.status === 'in_progress'"
          icon="mdi-cancel"
          size="small"
          variant="text"
          color="warning"
          @click="askCancel(item)"
        />
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="askDelete(item)"
        />
      </template>
    </ResponsiveTable>

    <div v-if="pagination.totalPages > 1" class="d-flex justify-center mt-3">
      <v-pagination
        :model-value="pagination.currentPage"
        :length="pagination.totalPages"
        density="comfortable"
        @update:model-value="changePage"
      />
    </div>

    <TripFormDialog v-model="dialog" :trip="selected" />
    <ModalConfirm
      v-model="confirm"
      title="Confirmar"
      :description="`<p>${confirmText}</p>`"
      @save="onConfirm"
    />
  </div>
</template>
