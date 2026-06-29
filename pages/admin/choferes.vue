<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDriverStore } from "~/stores/driver";
import { driverStatusOptions, useFleetStatus } from "~/composables/useFleetStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import DriverFormDialog from "~/components/driver/DriverFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Driver } from "~/types/fleet";

definePageMeta({
  layout: "admin",
  roles: ["admin", "dispatcher", "manager", "hr"],
});

useHead({ title: "Choferes" });

const driverStore = useDriverStore();
const { drivers, loading, pagination } = storeToRefs(driverStore);
const { driverStatus } = useFleetStatus();

const dialog = ref(false);
const selected = ref<Driver | null>(null);
const confirm = ref(false);
const toDelete = ref<Driver | null>(null);

const headers = [
  { title: "Nombre", value: "user.name" },
  { title: "Email", value: "user.email" },
  { title: "Licencia", value: "licenseNumber" },
  { title: "Vence", value: "licenseExpiry" },
  { title: "Teléfono", value: "phone" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions" },
];

const isExpiringSoon = (date?: string) => {
  if (!date) return false;
  const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
};

const openNew = () => {
  selected.value = null;
  dialog.value = true;
};
const openEdit = (d: Driver) => {
  selected.value = d;
  dialog.value = true;
};
const askDelete = (d: Driver) => {
  toDelete.value = d;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await driverStore.deleteDriver(toDelete.value.id);
  toDelete.value = null;
};

const changePage = (page: number) => {
  pagination.value.currentPage = page;
  driverStore.getDrivers();
};

onMounted(() => driverStore.getDrivers());
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Choferes</h1>

    <div class="d-flex flex-wrap ga-2 align-center mb-3">
      <VoiceTextField
        v-model="driverStore.search"
        label="Buscar nombre / licencia"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 260px"
        @update:model-value="driverStore.getDrivers()"
      />
      <v-select
        v-model="driverStore.filterStatus"
        :items="driverStatusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="driverStore.getDrivers()"
      />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">
        Nuevo chofer
      </v-btn>
    </div>

    <ResponsiveTable :headers="headers" :items="drivers" :loading="loading" all-items>
      <template #item.licenseExpiry="{ item }">
        <span :class="isExpiringSoon(item.licenseExpiry) ? 'text-error font-weight-bold' : ''">
          {{ item.licenseExpiry || "-" }}
        </span>
      </template>
      <template #item.status="{ item }">
        <v-chip :color="driverStatus(item.status).color" size="small" label>
          {{ driverStatus(item.status).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
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

    <DriverFormDialog v-model="dialog" :driver="selected" @saved="driverStore.getDrivers()" />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar chofer"
      description="<p>¿Eliminar este chofer?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
