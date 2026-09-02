<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import {
  movementTypeOptions,
  PERIOD_MOVEMENT_TYPES,
} from "~/composables/useHrStatus";
import { useCatalogOptions, CATALOG } from "~/stores/catalog";
import { useHrStore } from "~/stores/hr";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import { extractErrorMessage } from "~/composables/useApiError";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";
import type { EmploymentMovement } from "~/types/hr";

const props = defineProps<{
  modelValue: boolean;
  employeeId: string;
  movement: EmploymentMovement | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const router = useRouter();
const r = useValidations();
const hrStore = useHrStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

// Los motivos dependen del convenio de cada empresa (docs/CONFIGURACION.md §5).
const motivosLicencia = useCatalogOptions(CATALOG.LEAVE_TYPE);

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const file = ref<File | null>(null);
// Mensaje de bloqueo del backend que no mapea a un campo puntual (Regla B:
// viajes abiertos que se pisan con el período, u otra superposición).
const blockMessage = ref<string | null>(null);

const isEdit = computed(() => !!props.movement?.id);
const hasFile = computed(() => !!props.movement?.fileKey);

const emptyForm = (): Partial<EmploymentMovement> => ({
  type: "leave",
  leaveType: "other",
  startDate: "",
  endDate: "",
  reason: "",
  notes: "",
});

const form = ref<Partial<EmploymentMovement>>(emptyForm());

// El formulario se comporta distinto según la familia del movimiento.
const isPeriod = computed(() =>
  PERIOD_MOVEMENT_TYPES.includes(form.value.type ?? ""),
);
const isLeave = computed(() => form.value.type === "leave");

// Si el mensaje de bloqueo menciona viajes, ofrecemos ir al listado de viajes,
// que es lo que el usuario necesita resolver a continuación (Regla B).
const blockHasTrips = computed(
  () => !!blockMessage.value && /viaje/i.test(blockMessage.value),
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.movement
        ? {
            type: props.movement.type,
            leaveType: props.movement.leaveType ?? "other",
            startDate: props.movement.startDate ?? "",
            endDate: props.movement.endDate ?? "",
            reason: props.movement.reason ?? "",
            notes: props.movement.notes ?? "",
          }
        : emptyForm();
      file.value = null;
      formErrors.clear();
      blockMessage.value = null;
    }
  },
);

const onFile = (e: Event) => {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null;
};

// Pasa el payload a multipart, omitiendo vacíos, y adjunta el archivo.
const toFormData = (obj: Record<string, unknown>): FormData => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
  }
  if (file.value) fd.append("file", file.value);
  return fd;
};

const close = () => emit("update:modelValue", false);

const goToTrips = () => {
  close();
  // La página de viajes resuelve el employeeId contra el legajo del chofer y
  // preselecciona el filtro por chofer.
  router.push({ path: "/admin/viajes", query: { employeeId: props.employeeId } });
};

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;
  formErrors.clear();
  blockMessage.value = null;

  const payload = { ...form.value } as any;

  // leaveType solo aplica a licencias; en el resto el backend lo rechaza.
  if (!isLeave.value) {
    delete payload.leaveType;
  } else if (!payload.leaveType) {
    delete payload.leaveType; // el backend lo guarda como 'other'
  }

  // Fecha de fin: solo licencias/suspensiones la admiten. Vacía = período abierto.
  // En edición mandamos null explícito para poder reabrir un período cerrado.
  if (!isPeriod.value) {
    delete payload.endDate;
  } else if (!payload.endDate) {
    if (isEdit.value) payload.endDate = null;
    else delete payload.endDate;
  }

  if (!payload.reason) delete payload.reason;
  if (!payload.notes) delete payload.notes;

  // Con archivo va como multipart; sin archivo como JSON (para poder mandar
  // `endDate: null` explícito y reabrir un período cerrado).
  const body: FormData | Record<string, unknown> = file.value
    ? toFormData(payload)
    : payload;

  try {
    if (isEdit.value) {
      await hrStore.updateMovement(props.movement!.id, props.employeeId, body);
    } else {
      if (body instanceof FormData) body.append("employeeId", props.employeeId);
      else body.employeeId = props.employeeId;
      await hrStore.createMovement(body, props.employeeId);
    }
    emit("saved");
    close();
  } catch (e) {
    formErrors.setFromError(e);
    // Los bloqueos de negocio (viajes abiertos, superposición) vienen como un
    // mensaje general listo para mostrar; lo destacamos dentro del diálogo.
    blockMessage.value = extractErrorMessage(e);
    general.setErrorSnackbar(e);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    :title="isEdit ? 'Editar movimiento' : 'Nuevo movimiento'"
    :max-width="620"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <v-alert
        v-if="blockMessage"
        type="error"
        variant="tonal"
        density="comfortable"
        class="mb-4"
      >
        <div class="text-body-2" style="white-space: pre-line">
          {{ blockMessage }}
        </div>
        <template v-if="blockHasTrips" #append>
          <v-btn
            size="small"
            variant="tonal"
            color="error"
            prepend-icon="mdi-truck-outline"
            @click="goToTrips"
          >
            Ver viajes
          </v-btn>
        </template>
      </v-alert>

      <v-row dense>
        <v-col cols="12" :sm="isLeave ? 6 : 12">
          <v-select
            v-model="form.type"
            :error-messages="formErrors.messages('type')"
            :items="movementTypeOptions"
            item-title="label"
            item-value="value"
            label="Tipo de movimiento *"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col v-if="isLeave" cols="12" sm="6">
          <v-select
            v-model="form.leaveType"
            :error-messages="formErrors.messages('leaveType')"
            :items="motivosLicencia"
            item-title="label"
            item-value="value"
            label="Motivo de licencia"
          />
        </v-col>

        <v-col cols="12" :sm="isPeriod ? 6 : 12">
          <v-text-field
            v-model="form.startDate"
            :error-messages="formErrors.messages('startDate')"
            label="Fecha de inicio *"
            type="date"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col v-if="isPeriod" cols="12" sm="6">
          <v-text-field
            v-model="form.endDate"
            :error-messages="formErrors.messages('endDate')"
            label="Fecha de fin"
            type="date"
            hint="Vacío = período sin fecha de fin definida"
            persistent-hint
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="form.reason"
            :error-messages="formErrors.messages('reason')"
            label="Motivo"
          />
        </v-col>
        <v-col cols="12">
          <VoiceTextarea v-model="form.notes" label="Notas" rows="2" auto-grow />
        </v-col>
        <v-col cols="12">
          <v-file-input
            :label="hasFile ? 'Reemplazar respaldo (imagen o PDF)' : 'Respaldo (imagen o PDF)'"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            variant="outlined"
            density="compact"
            accept="image/*,application/pdf"
            hide-details
            @change="onFile"
          />
          <div v-if="hasFile" class="d-flex align-center ga-1 mt-2 text-caption">
            <v-icon size="16" color="success">mdi-check-circle-outline</v-icon>
            <span class="text-medium-emphasis">Tiene un respaldo cargado.</span>
            <v-btn
              variant="text"
              size="x-small"
              color="primary"
              class="text-none"
              prepend-icon="mdi-eye"
              @click="hrStore.openMovementFile(props.movement!.id)"
            >
              Ver actual
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
