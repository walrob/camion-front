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
  name: "",
  email: "",
  password: "",
  licenseNumber: "",
  licenseType: "",
  licenseExpiry: "",
  phone: "",
  status: "active",
  notes: "",
});

const form = ref<Record<string, any>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.driver
        ? {
            licenseNumber: props.driver.licenseNumber ?? "",
            licenseType: props.driver.licenseType ?? "",
            licenseExpiry: props.driver.licenseExpiry ?? "",
            phone: props.driver.phone ?? "",
            status: props.driver.status ?? "active",
            notes: props.driver.notes ?? "",
          }
        : emptyForm();
      formErrors.clear();
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
      const { licenseNumber, licenseType, licenseExpiry, phone, status, notes } =
        form.value;
      await driverStore.updateDriver(props.driver!.id, {
        licenseNumber,
        licenseType,
        licenseExpiry: licenseExpiry || undefined,
        phone,
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
      <!-- Datos de acceso (solo alta) -->
      <FormSection v-if="!isEdit" title="Datos de acceso" hint="Credenciales para que el chofer use la app.">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.name"
              :error-messages="formErrors.messages('name')"
              label="Nombre *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.email"
              :error-messages="formErrors.messages('email')"
              label="Email *"
              :rules="[r.isRequired, r.isEmail]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.password"
              :error-messages="formErrors.messages('password')"
              label="Contraseña *"
              type="password"
              :rules="[r.isRequired]"
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
            <v-text-field
              v-model="form.phone"
              :error-messages="formErrors.messages('phone')"
              label="Teléfono"
              :rules="[r.isPhone]"
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
