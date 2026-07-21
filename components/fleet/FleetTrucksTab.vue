<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { useFleetStore } from "~/stores/fleet";
import {
  truckStatusOptions,
  useFleetStatus,
} from "~/composables/useFleetStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import TruckFormDialog from "~/components/fleet/TruckFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Truck } from "~/types/fleet";

const fleetStore = useFleetStore();
const { trucks, loadingTrucks, errorTrucks, paginationTrucks, fleetOptions } =
  storeToRefs(fleetStore);
const { truckStatus } = useFleetStatus();

// Búsqueda con debounce: evita pegarle a la API en cada tecla.
const onSearch = useDebounceFn(() => fleetStore.getTrucks(), 350);

const dialog = ref(false);
const selected = ref<Truck | null>(null);
const confirm = ref(false);
const toDelete = ref<Truck | null>(null);

const headers = [
  { title: "Patente", value: "plate" },
  { title: "Interno", value: "internalNumber" },
  { title: "Marca", value: "brand" },
  { title: "Modelo", value: "model" },
  { title: "Odómetro", value: "currentOdometerKm" },
  { title: "Estado", value: "status" },
  { title: "Flota", value: "fleet.name" },
  { title: "Acciones", value: "actions" },
];

const openNew = () => {
  selected.value = null;
  dialog.value = true;
};
const openEdit = (truck: Truck) => {
  selected.value = truck;
  dialog.value = true;
};
const askDelete = (truck: Truck) => {
  toDelete.value = truck;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await fleetStore.deleteTruck(toDelete.value.id);
  toDelete.value = null;
};

const changePage = (page: number) => {
  paginationTrucks.value.currentPage = page;
  fleetStore.getTrucks();
};

onMounted(() => {
  if (!fleetOptions.value.length) fleetStore.getFleetOptions();
  fleetStore.getTrucks();
});
</script>

<template>
  <div>
    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <VoiceTextField
        v-model="fleetStore.searchTrucks"
        label="Buscar patente / marca"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width: 240px; max-width: 360px"
        @update:model-value="onSearch"
      />
      <v-select
        v-model="fleetStore.filterTruckStatus"
        :items="truckStatusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="fleetStore.getTrucks()"
      />
      <v-select
        v-model="fleetStore.filterTruckFleetId"
        :items="fleetOptions"
        item-title="name"
        item-value="id"
        label="Flota"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="fleetStore.getTrucks()"
      />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">
        Nuevo camión
      </v-btn>
    </div>

    <ResponsiveTable
      :headers="headers"
      :items="trucks"
      :loading="loadingTrucks"
      :error="errorTrucks"
      all-items
      @retry="fleetStore.getTrucks()"
    >
      <template #item.status="{ item }">
        <v-chip :color="truckStatus(item.status).color" size="small" label>
          {{ truckStatus(item.status).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-pencil"
          aria-label="Editar"
          size="small"
          variant="text"
          @click="openEdit(item)"
        />
        <v-btn
          icon="mdi-delete"
          aria-label="Eliminar"
          size="small"
          variant="text"
          color="error"
          @click="askDelete(item)"
        />
      </template>
    </ResponsiveTable>

    <div
      v-if="paginationTrucks.totalPages > 1"
      class="d-flex justify-center mt-3"
    >
      <v-pagination
        :model-value="paginationTrucks.currentPage"
        :length="paginationTrucks.totalPages"
        density="comfortable"
        :total-visible="6"
        @update:model-value="changePage"
      />
    </div>

    <TruckFormDialog
      v-model="dialog"
      :truck="selected"
      :fleet-options="fleetOptions"
    />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar camión"
      description="<p>¿Eliminar este camión?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
