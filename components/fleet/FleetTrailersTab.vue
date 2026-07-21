<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { useFleetStore } from "~/stores/fleet";
import {
  trailerStatusOptions,
  useFleetStatus,
} from "~/composables/useFleetStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import TrailerFormDialog from "~/components/fleet/TrailerFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Trailer } from "~/types/fleet";

const fleetStore = useFleetStore();
const onSearch = useDebounceFn(() => fleetStore.getTrailers(), 350);
const { trailers, loadingTrailers, errorTrailers, paginationTrailers } =
  storeToRefs(fleetStore);
const { trailerStatus } = useFleetStatus();

const dialog = ref(false);
const selected = ref<Trailer | null>(null);
const confirm = ref(false);
const toDelete = ref<Trailer | null>(null);

const headers = [
  { title: "Patente", value: "plate" },
  { title: "Tipo", value: "type" },
  { title: "Capacidad (kg)", value: "loadCapacityKg" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions" },
];

const openNew = () => {
  selected.value = null;
  dialog.value = true;
};
const openEdit = (t: Trailer) => {
  selected.value = t;
  dialog.value = true;
};
const askDelete = (t: Trailer) => {
  toDelete.value = t;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await fleetStore.deleteTrailer(toDelete.value.id);
  toDelete.value = null;
};

const changePage = (page: number) => {
  paginationTrailers.value.currentPage = page;
  fleetStore.getTrailers();
};

onMounted(() => fleetStore.getTrailers());
</script>

<template>
  <div>
    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <VoiceTextField
        v-model="fleetStore.searchTrailers"
        label="Buscar patente / tipo"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width: 240px; max-width: 360px"
        @update:model-value="onSearch"
      />
      <v-select
        v-model="fleetStore.filterTrailerStatus"
        :items="trailerStatusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="fleetStore.getTrailers()"
      />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">
        Nuevo acoplado
      </v-btn>
    </div>

    <ResponsiveTable
      :headers="headers"
      :items="trailers"
      :loading="loadingTrailers"
      :error="errorTrailers"
      all-items
      @retry="fleetStore.getTrailers()"
    >
      <template #item.status="{ item }">
        <v-chip :color="trailerStatus(item.status).color" size="small" label>
          {{ trailerStatus(item.status).label }}
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
      v-if="paginationTrailers.totalPages > 1"
      class="d-flex justify-center mt-3"
    >
      <v-pagination
        :model-value="paginationTrailers.currentPage"
        :length="paginationTrailers.totalPages"
        density="comfortable"
        :total-visible="6"
        @update:model-value="changePage"
      />
    </div>

    <TrailerFormDialog v-model="dialog" :trailer="selected" />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar acoplado"
      description="<p>¿Eliminar este acoplado?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
