<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { useHrStore } from "~/stores/hr";
import {
  positionOptions,
  employmentStatusOptions,
  useHrStatus,
} from "~/composables/useHrStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import TablePagination from "~/components/shared/TablePagination.vue";
import EmployeeFormDialog from "~/components/hr/EmployeeFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Employee } from "~/types/hr";

definePageMeta({
  layout: "admin",
  roles: ["admin", "hr", "manager", "dispatcher"],
});

useHead({ title: "RRHH" });

const router = useRouter();
const hrStore = useHrStore();
const { employees, loading, pagination } = storeToRefs(hrStore);
const { position, employmentStatus } = useHrStatus();
const onSearch = useDebounceFn(() => hrStore.getEmployees(), 350);

const dialog = ref(false);
const selected = ref<Employee | null>(null);
const confirm = ref(false);
const toDelete = ref<Employee | null>(null);

const headers = [
  { title: "Apellido", value: "lastName" },
  { title: "Nombre", value: "firstName" },
  { title: "DNI/CUIL", value: "documentId" },
  { title: "Puesto", value: "position" },
  { title: "Estado", value: "employmentStatus" },
  { title: "Acciones", value: "actions" },
];

const openNew = () => {
  selected.value = null;
  dialog.value = true;
};
const goDetail = (e: Employee) => router.push(`/admin/rrhh/${e.id}`);
const askDelete = (e: Employee) => {
  toDelete.value = e;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await hrStore.deleteEmployee(toDelete.value.id);
  toDelete.value = null;
};
const changePage = (page: number) => {
  pagination.value.currentPage = page;
  hrStore.getEmployees();
};

onMounted(() => hrStore.getEmployees());
</script>

<template>
  <div>
    <PageHeader
      title="Recursos Humanos"
      subtitle="Legajos, permisos y vencimientos del personal"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew"
          >Nuevo empleado</v-btn
        >
      </template>
    </PageHeader>

    <div class="d-flex flex-wrap ga-2 align-center mb-3">
      <VoiceTextField
        v-model="hrStore.search"
        label="Buscar nombre / DNI"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width: 240px; max-width: 360px"
        @update:model-value="onSearch"
      />
      <v-select
        v-model="hrStore.filterPosition"
        :items="positionOptions"
        item-title="label"
        item-value="value"
        label="Puesto"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="hrStore.getEmployees()"
      />
      <v-select
        v-model="hrStore.filterStatus"
        :items="employmentStatusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 200px"
        @update:model-value="hrStore.getEmployees()"
      />
    </div>

    <ResponsiveTable
      :headers="headers"
      :items="employees"
      :loading="loading"
      :error="hrStore.error"
      all-items
      @retry="hrStore.getEmployees()"
    >
      <template #item.position="{ item }">
        <v-chip :color="position(item.position).color" size="small" label>
          {{ position(item.position).label }}
        </v-chip>
      </template>
      <template #item.employmentStatus="{ item }">
        <v-chip
          :color="employmentStatus(item.employmentStatus).color"
          size="small"
          label
        >
          {{ employmentStatus(item.employmentStatus).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-eye"
          aria-label="Ver"
          size="small"
          variant="text"
          @click="goDetail(item)"
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

    <EmployeeFormDialog
      v-model="dialog"
      :employee="selected"
      @saved="hrStore.getEmployees()"
    />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar empleado"
      description="<p>¿Eliminar este empleado?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
