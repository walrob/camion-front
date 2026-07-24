<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { useTripStore } from "~/stores/trip";
import { tripStatusOptions, useTripStatus } from "~/composables/useTripStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import TablePagination from "~/components/shared/TablePagination.vue";
import TripFormDialog from "~/components/trip/TripFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Trip } from "~/types/trip";

definePageMeta({
  layout: "admin",
  roles: ["admin", "dispatcher", "manager", "auditor"],
});

useHead({ title: "Viajes" });

const route = useRoute();
const tripStore = useTripStore();
const { trips, loading, pagination, driverOptions } = storeToRefs(tripStore);
const { tripStatus } = useTripStatus();
const onSearch = useDebounceFn(() => tripStore.getTrips(), 350);

const dialog = ref(false);
const selected = ref<Trip | null>(null);
const confirm = ref(false);
const action = ref<(() => Promise<any>) | null>(null);
const confirmText = ref("");

const headers = [
  { title: "Código", value: "code" },
  { title: "Origen", value: "origin" },
  { title: "Destino", value: "destination" },
  { title: "Camión", value: "truck.plate" },
  { title: "Chofer", value: "driverName", sortable: false },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
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
// Al cambiar un filtro volvemos a la primera página para no quedar en una página
// que ya no existe con el nuevo resultado.
const reload = () => {
  pagination.value.currentPage = 1;
  tripStore.getTrips();
};

onMounted(async () => {
  // Choferes para el filtro. Además, permitimos llegar acá con el chofer ya
  // preseleccionado desde RRHH (?driverId= directo, o ?employeeId= a resolver
  // contra el legajo del chofer).
  if (!driverOptions.value.length) await tripStore.loadFormOptions();

  const { driverId, employeeId } = route.query;
  if (typeof driverId === "string") {
    tripStore.filterDriver = driverId;
  } else if (typeof employeeId === "string") {
    const match = driverOptions.value.find((d) => d.employeeId === employeeId);
    if (match) tripStore.filterDriver = match.id;
  }

  tripStore.getTrips();
});
</script>

<template>
  <div>
    <PageHeader title="Viajes" subtitle="Planificación y asignación de viajes">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew"
          >Nuevo viaje</v-btn
        >
      </template>
    </PageHeader>

    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <VoiceTextField
        v-model="tripStore.search"
        label="Buscar código / destino"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width: 240px; max-width: 360px"
        @update:model-value="onSearch"
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
        @update:model-value="reload"
      />
      <v-autocomplete
        v-model="tripStore.filterDriver"
        :items="driverOptions"
        item-value="id"
        :item-title="(d: any) => driverName(d)"
        label="Chofer"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="min-width: 200px; max-width: 240px"
        @update:model-value="reload"
      />
      <v-text-field
        v-model="tripStore.filterFrom"
        label="Desde"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 170px"
        @update:model-value="reload"
      />
      <v-text-field
        v-model="tripStore.filterTo"
        label="Hasta"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 170px"
        @update:model-value="reload"
      />
    </div>

    <ResponsiveTable
      :headers="headers"
      :items="trips"
      :loading="loading"
      :error="tripStore.error"
      all-items
      sort-server
      @retry="tripStore.getTrips()"
      @sort="tripStore.setSort"
    >
      <template #item.driverName="{ item }">{{
        driverName(item.driver)
      }}</template>
      <template #item.status="{ item }">
        <v-chip :color="tripStatus(item.status).color" size="small" label>
          {{ tripStatus(item.status).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.status === 'assigned'"
          icon="mdi-pencil"
          aria-label="Editar"
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
          aria-label="Eliminar"
          size="small"
          variant="text"
          color="error"
          @click="askDelete(item)"
        />
      </template>
    </ResponsiveTable>

    <TablePagination
      :page="pagination.currentPage"
      :length="pagination.totalPages"
      @change="changePage"
    />

    <TripFormDialog v-model="dialog" :trip="selected" />
    <ModalConfirm
      v-model="confirm"
      title="Confirmar"
      :description="`<p>${confirmText}</p>`"
      @save="onConfirm"
    />
  </div>
</template>
