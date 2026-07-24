<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import {
  movementTypeOptions,
  leaveTypeOptions,
  PERIOD_MOVEMENT_TYPES,
} from "~/composables/useHrStatus";
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

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
// Mensaje de bloqueo del backend que no mapea a un campo puntual (Regla B:
// viajes abiertos que se pisan con el período, u otra superposición).
const blockMessage = ref<string | null>(null);

const isEdit = computed(() => !!props.movement?.id);

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
      formErrors.clear();
      blockMessage.value = null;
    }
  },
);

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

  try {
    if (isEdit.value) {
      await hrStore.updateMovement(props.movement!.id, props.employeeId, payload);
    } else {
      await hrStore.createMovement({ ...payload, employeeId: props.employeeId });
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
            :items="leaveTypeOptions"
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
      </v-row>
    </v-form>
  </FormDialog>
</template>
