<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { driverStatusOptions } from "~/composables/useFleetStatus";
import { useDriverStore } from "~/stores/driver";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";
import FormSection from "~/components/shared/FormSection.vue";
import type { Driver } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  driver: Driver | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const driverStore = useDriverStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.driver?.id);

const emptyForm = () => ({
  employeeId: null as string | null,
  licenseNumber: "",
  licenseType: "",
  licenseExpiry: "",
  status: "active",
  notes: "",
});

const form = ref<Record<string, any>>(emptyForm());

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      form.value = props.driver
        ? {
            employeeId: props.driver.employeeId ?? null,
            licenseNumber: props.driver.licenseNumber ?? "",
            licenseType: props.driver.licenseType ?? "",
            licenseExpiry: props.driver.licenseExpiry ?? "",
            status: props.driver.status ?? "active",
            notes: props.driver.notes ?? "",
          }
        : emptyForm();
      formErrors.clear();
      // El empleado solo se elige en el alta; en edición queda fijo.
      if (!isEdit.value) await driverStore.loadEmployeeOptions();
    }
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  try {
    if (isEdit.value) {
      // En edición no se cambia el empleado: solo datos operativos.
      const { licenseNumber, licenseType, licenseExpiry, status, notes } =
        form.value;
      await driverStore.updateDriver(props.driver!.id, {
        licenseNumber,
        licenseType,
        licenseExpiry: licenseExpiry || undefined,
        status,
        notes,
      });
    } else {
      const payload = { ...form.value };
      if (!payload.licenseExpiry) delete payload.licenseExpiry;
      await driverStore.createDriver(payload);
    }
    emit("saved");
    close();
  } catch (e) {
    formErrors.setFromError(e);
    general.setErrorSnackbar(e);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    :title="isEdit ? 'Editar chofer' : 'Nuevo chofer'"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <!-- Empleado: el chofer es un empleado de RRHH con puesto «Chofer». -->
      <FormSection title="Empleado" hint="El chofer corresponde a un empleado de RRHH con puesto «Chofer». El nombre, documento y contacto se gestionan en RRHH.">
        <v-row dense>
          <v-col cols="12">
            <v-autocomplete
              v-if="!isEdit"
              v-model="form.employeeId"
              :items="driverStore.employeeOptions"
              :item-title="(e: any) => `${e.firstName} ${e.lastName} — ${e.documentId}`"
              item-value="id"
              :loading="driverStore.loadingEmployeeOptions"
              :error-messages="formErrors.messages('employeeId')"
              label="Empleado *"
              :rules="[r.isRequired]"
            />
            <v-text-field
              v-else
              :model-value="props.driver?.employee
                ? `${props.driver.employee.firstName} ${props.driver.employee.lastName} — ${props.driver.employee.documentId}`
                : '-'"
              label="Empleado"
              readonly
              disabled
            />
          </v-col>
        </v-row>
      </FormSection>

      <FormSection title="Perfil del chofer">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.licenseNumber"
              :error-messages="formErrors.messages('licenseNumber')"
              label="N° de licencia"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.licenseType"
              :error-messages="formErrors.messages('licenseType')"
              label="Tipo / clase de licencia"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.licenseExpiry"
              :error-messages="formErrors.messages('licenseExpiry')"
              label="Vencimiento licencia"
              type="date"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.status"
              label="Estado"
              :items="driverStatusOptions"
              item-title="label"
              item-value="value"
            />
          </v-col>
          <v-col cols="12">
            <VoiceTextarea v-model="form.notes" label="Notas" rows="2" auto-grow />
          </v-col>
        </v-row>
      </FormSection>
    </v-form>
  </FormDialog>
</template>
