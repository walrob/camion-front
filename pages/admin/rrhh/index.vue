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
import type { EmploymentMovement } from "~/types/hr";
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
const { employees, loading, pagination, activeMovements } =
  storeToRefs(hrStore);
const { position, employmentStatus, movementType, leaveType } = useHrStatus();
const onSearch = useDebounceFn(() => hrStore.getEmployees(), 350);

const { fmtDate } = useFormatters();
const movementEmployeeName = (m: EmploymentMovement) =>
  m.employee ? `${m.employee.lastName}, ${m.employee.firstName}` : "Empleado";

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
  { title: "Acciones", value: "actions", sortable: false },
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

onMounted(() => {
  hrStore.getEmployees();
  hrStore.getActiveMovements();
});
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

    <!-- Fuera de servicio hoy: licencias y suspensiones vigentes. -->
    <v-card
      v-if="activeMovements.length"
      border
      flat
      rounded="lg"
      class="mb-4"
    >
      <div class="d-flex align-center ga-2 px-4 pt-3">
        <v-icon color="warning" size="20">mdi-account-clock-outline</v-icon>
        <span class="text-subtitle-2 font-weight-bold">
          Fuera de servicio hoy
        </span>
        <v-chip size="x-small" color="warning" variant="tonal" label>
          {{ activeMovements.length }}
        </v-chip>
      </div>
      <v-list class="py-1 bg-transparent" density="compact">
        <v-list-item
          v-for="m in activeMovements"
          :key="m.id"
          :to="`/admin/rrhh/${m.employeeId}`"
        >
          <template #prepend>
            <v-icon :color="movementType(m.type).color" size="18">
              {{ (movementType(m.type) as any).icon || "mdi-circle-medium" }}
            </v-icon>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ movementEmployeeName(m) }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ movementType(m.type).label }}
            <template v-if="m.type === 'leave'">
              · {{ leaveType(m.leaveType || "other").label }}
            </template>
            ·
            {{ m.endDate ? `hasta ${fmtDate(m.endDate)}` : "sin fecha de fin" }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>

    <div class="d-flex flex-wrap ga-2 align-center mb-4">
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
      sort-server
      @retry="hrStore.getEmployees()"
      @sort="hrStore.setSort"
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
