<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { useFleetStore } from "~/stores/fleet";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import FleetFormDialog from "~/components/fleet/FleetFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Fleet } from "~/types/fleet";

const fleetStore = useFleetStore();
const onSearch = useDebounceFn(() => fleetStore.getFleets(), 350);
const { fleets, loadingFleets, errorFleets, paginationFleets } =
  storeToRefs(fleetStore);

const dialog = ref(false);
const selected = ref<Fleet | null>(null);
const confirm = ref(false);
const toDelete = ref<Fleet | null>(null);

const headers = [
  { title: "Nombre", value: "name" },
  { title: "Código", value: "code" },
  { title: "Activa", value: "isActive" },
  { title: "Acciones", value: "actions" },
];

const openNew = () => {
  selected.value = null;
  dialog.value = true;
};
const openEdit = (f: Fleet) => {
  selected.value = f;
  dialog.value = true;
};
const askDelete = (f: Fleet) => {
  toDelete.value = f;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await fleetStore.deleteFleet(toDelete.value.id);
  toDelete.value = null;
};

const changePage = (page: number) => {
  paginationFleets.value.currentPage = page;
  fleetStore.getFleets();
};

onMounted(() => fleetStore.getFleets());
</script>

<template>
  <div>
    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <VoiceTextField
        v-model="fleetStore.searchFleets"
        label="Buscar nombre / código"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width: 240px; max-width: 360px"
        @update:model-value="onSearch"
      />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">
        Nueva flota
      </v-btn>
    </div>

    <ResponsiveTable
      :headers="headers"
      :items="fleets"
      :loading="loadingFleets"
      :error="errorFleets"
      all-items
      @retry="fleetStore.getFleets()"
    >
      <template #item.isActive="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" label>
          {{ item.isActive ? "Sí" : "No" }}
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
      v-if="paginationFleets.totalPages > 1"
      class="d-flex justify-center mt-3"
    >
      <v-pagination
        :model-value="paginationFleets.currentPage"
        :length="paginationFleets.totalPages"
        density="comfortable"
        :total-visible="6"
        @update:model-value="changePage"
      />
    </div>

    <FleetFormDialog v-model="dialog" :fleet="selected" />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar flota"
      description="<p>¿Eliminar esta flota?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
