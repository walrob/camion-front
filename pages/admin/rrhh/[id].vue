<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useHrStore } from "~/stores/hr";
import { useHrStatus } from "~/composables/useHrStatus";
import EmployeeFormDialog from "~/components/hr/EmployeeFormDialog.vue";
import CertificationFormDialog from "~/components/hr/CertificationFormDialog.vue";
import AssignTruckDialog from "~/components/hr/AssignTruckDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Certification, TruckAssignment } from "~/types/hr";

definePageMeta({
  layout: "admin",
  roles: ["admin", "hr", "manager", "dispatcher"],
});

const route = useRoute();
const id = route.params.id as string;

const hrStore = useHrStore();
const { employee, certifications, assignments, loadingDetail } =
  storeToRefs(hrStore);
const { position, employmentStatus, certificationType, certificationStatus } =
  useHrStatus();

useHead({ title: "Legajo" });

const tab = ref("data");

// Diálogos
const editEmployee = ref(false);
const certDialog = ref(false);
const selectedCert = ref<Certification | null>(null);
const assignDialog = ref(false);
const confirm = ref(false);
const confirmAction = ref<(() => Promise<any>) | null>(null);
const confirmText = ref("");

const certHeaders = [
  { title: "Tipo", value: "type" },
  { title: "N°", value: "number" },
  { title: "Vence", value: "expiryDate" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
];

const assignmentHeaders = [
  { title: "Camión", value: "truck.plate" },
  { title: "Desde", value: "assignedAt" },
  { title: "Hasta", value: "unassignedAt" },
  { title: "Principal", value: "isPrimary" },
  { title: "Acciones", value: "actions", sortable: false },
];

const currentAssignment = computed(() =>
  assignments.value.find((a) => !a.unassignedAt && a.isPrimary),
);

const fullName = computed(() =>
  employee.value ? `${employee.value.lastName}, ${employee.value.firstName}` : "",
);

const initials = computed(() => {
  const e = employee.value;
  if (!e) return "";
  return `${e.firstName?.[0] ?? ""}${e.lastName?.[0] ?? ""}`.toUpperCase();
});

const { fmtDate } = useFormatters();

// Datos de contacto/legajo como items con ícono, para aprovechar el ancho.
type InfoItem = {
  icon: string;
  tone: string;
  label: string;
  value: string;
  full?: boolean;
};
const infoItems = computed<InfoItem[]>(() => {
  const e = employee.value;
  if (!e) return [];
  const emergency = e.emergencyContactName
    ? `${e.emergencyContactName}${e.emergencyContactPhone ? ` (${e.emergencyContactPhone})` : ""}`
    : "-";
  return [
    { icon: "mdi-card-account-details-outline", tone: "primary", label: "DNI/CUIL", value: e.documentId || "-" },
    { icon: "mdi-phone-outline", tone: "info", label: "Teléfono", value: e.phone || "-" },
    { icon: "mdi-calendar-check-outline", tone: "success", label: "Ingreso", value: fmtDate(e.hireDate) },
    { icon: "mdi-map-marker-outline", tone: "error", label: "Domicilio", value: e.address || "-" },
    { icon: "mdi-lifebuoy", tone: "warning", label: "Contacto emergencia", value: emergency },
    { icon: "mdi-note-text-outline", tone: "secondary", label: "Notas", value: e.notes || "-", full: true },
  ];
});

const openNewCert = () => {
  selectedCert.value = null;
  certDialog.value = true;
};
const openEditCert = (c: Certification) => {
  selectedCert.value = c;
  certDialog.value = true;
};
const askDeleteCert = (c: Certification) => {
  confirmText.value = "¿Eliminar este permiso?";
  confirmAction.value = () => hrStore.deleteCertification(c.id, id);
  confirm.value = true;
};
const askUnassign = (a: TruckAssignment) => {
  confirmText.value = "¿Finalizar esta asignación?";
  confirmAction.value = () => hrStore.unassign(a.id, id);
  confirm.value = true;
};
const onConfirm = async (payload: { resp: boolean }) => {
  if (payload.resp && confirmAction.value) await confirmAction.value();
  confirmAction.value = null;
};

onMounted(() => hrStore.getEmployee(id));
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-4">
      <v-btn icon="mdi-arrow-left" aria-label="Volver" variant="text" to="/admin/rrhh" />
      <h1 class="text-h5 font-weight-bold">{{ fullName || "Legajo" }}</h1>
      <v-spacer />
      <v-btn
        v-if="employee"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-pencil"
        @click="editEmployee = true"
      >
        Editar
      </v-btn>
    </div>

    <SharedLoading v-if="loadingDetail && !employee" />

    <template v-else-if="employee">
      <v-tabs v-model="tab" color="primary" class="mb-4">
        <v-tab value="data">Datos</v-tab>
        <v-tab value="certs">Permisos</v-tab>
        <v-tab value="assign">Asignación</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- DATOS -->
        <v-window-item value="data">
          <v-card border flat rounded="lg" class="overflow-hidden">
            <!-- Hero: identidad + estado -->
            <div class="d-flex align-center ga-4 pa-4 flex-wrap profile-hero">
              <v-avatar size="64" color="primary" variant="tonal">
                <span class="text-h6 font-weight-bold">{{ initials }}</span>
              </v-avatar>
              <div class="flex-grow-1 min-w-0">
                <div class="text-h6 font-weight-bold">{{ fullName }}</div>
                <div class="d-flex ga-2 mt-1 flex-wrap">
                  <v-chip :color="position(employee.position).color" size="small" label>
                    <v-icon start size="14">mdi-briefcase-outline</v-icon>
                    {{ position(employee.position).label }}
                  </v-chip>
                  <v-chip
                    :color="employmentStatus(employee.employmentStatus).color"
                    size="small"
                    label
                  >
                    <v-icon start size="14">mdi-circle-medium</v-icon>
                    {{ employmentStatus(employee.employmentStatus).label }}
                  </v-chip>
                </div>
              </div>
            </div>

            <v-divider />

            <!-- Detalle -->
            <v-row dense class="pa-4">
              <v-col
                v-for="item in infoItems"
                :key="item.label"
                cols="12"
                :sm="item.full ? 12 : 6"
                :md="item.full ? 12 : 4"
              >
                <div class="d-flex align-start ga-3 info-item">
                  <v-avatar :color="item.tone" variant="tonal" rounded="lg" size="38">
                    <v-icon :color="item.tone" size="20">{{ item.icon }}</v-icon>
                  </v-avatar>
                  <div class="min-w-0">
                    <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                    <div class="text-body-2 font-weight-medium text-break">{{ item.value }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>

        <!-- PERMISOS -->
        <v-window-item value="certs">
          <div class="d-flex mb-3">
            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewCert">
              Nuevo permiso
            </v-btn>
          </div>
          <ResponsiveTable
            :headers="certHeaders"
            :items="certifications"
            all-items
            searchable
            search-label="Buscar certificación"
          >
            <template #item.type="{ item }">
              {{ certificationType(item.type).label }}
            </template>
            <template #item.expiryDate="{ item }">
              {{ fmtDate(item.expiryDate) }}
            </template>
            <template #item.status="{ item }">
              <v-chip :color="certificationStatus(item.status).color" size="small" label>
                {{ certificationStatus(item.status).label }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" aria-label="Editar" size="small" variant="text" @click="openEditCert(item)" />
              <v-btn
                icon="mdi-delete" aria-label="Eliminar"
                size="small"
                variant="text"
                color="error"
                @click="askDeleteCert(item)"
              />
            </template>
          </ResponsiveTable>
        </v-window-item>

        <!-- ASIGNACIÓN -->
        <v-window-item value="assign">
          <v-card variant="tonal" :color="currentAssignment ? 'primary' : 'grey'" class="pa-4 mb-4">
            <div class="d-flex align-center ga-3">
              <v-icon size="32">mdi-truck</v-icon>
              <div>
                <div class="text-caption">Camión asignado actualmente</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ currentAssignment?.truck?.plate || "Sin asignación" }}
                </div>
              </div>
              <v-spacer />
              <v-btn color="primary" prepend-icon="mdi-plus" @click="assignDialog = true">
                Asignar camión
              </v-btn>
            </div>
          </v-card>

          <p class="text-subtitle-2 font-weight-bold mb-2">Historial</p>
          <ResponsiveTable
            :headers="assignmentHeaders"
            :items="assignments"
            all-items
            searchable
            search-label="Buscar camión"
          >
            <template #item.assignedAt="{ item }">
              {{ fmtDate(item.assignedAt) }}
            </template>
            <template #item.unassignedAt="{ item }">
              {{ item.unassignedAt ? fmtDate(item.unassignedAt) : "Vigente" }}
            </template>
            <template #item.isPrimary="{ item }">
              <v-chip :color="item.isPrimary ? 'primary' : 'grey'" size="small" label>
                {{ item.isPrimary ? "Sí" : "No" }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn
                v-if="!item.unassignedAt"
                icon="mdi-link-off"
                size="small"
                variant="text"
                color="error"
                @click="askUnassign(item)"
              />
            </template>
          </ResponsiveTable>
        </v-window-item>
      </v-window>
    </template>

    <EmployeeFormDialog v-model="editEmployee" :employee="employee" />
    <CertificationFormDialog
      v-model="certDialog"
      :employee-id="id"
      :certification="selectedCert"
    />
    <AssignTruckDialog v-model="assignDialog" :employee-id="id" />
    <ModalConfirm
      v-model="confirm"
      title="Confirmar"
      :description="`<p>${confirmText}</p>`"
      @save="onConfirm"
    />
  </div>
</template>

<style scoped>
.profile-hero {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.06),
    rgba(var(--v-theme-primary), 0.01)
  );
}
.info-item {
  padding: 8px 0;
}
.min-w-0 {
  min-width: 0;
}
.text-break {
  overflow-wrap: anywhere;
}
</style>
