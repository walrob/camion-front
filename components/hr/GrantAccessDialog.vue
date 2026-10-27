<script setup lang="ts">
import { ref, watch } from "vue";
import { useValidations } from "~/composables/useValidations";
import { roleOptions, useHrStatus } from "~/composables/useHrStatus";
import { useHrStore } from "~/stores/hr";
import { useDriverStore } from "~/stores/driver";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import FormDialog from "~/components/shared/FormDialog.vue";
import FormSection from "~/components/shared/FormSection.vue";
import type { Employee } from "~/types/hr";

/**
 * Acceso a la app para un legajo que se dio de alta sin cuenta. Mismos campos
 * que la sección "Acceso a la app" del alta (EmployeeFormDialog).
 *
 * Desde Choferes (`driverId`) va por `drivers/:id/access`, que funciona sin
 * RRHH en el plan y crea la cuenta siempre con rol Chofer: por eso ahí no se
 * ofrece elegir el rol.
 */
const props = defineProps<{
  modelValue: boolean;
  employee: Employee;
  driverId?: string;
}>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();
const driverStore = useDriverStore();
const general = useGeneralStore();
const formErrors = useFormErrors();
const { roleForPosition } = useHrStatus();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const account = ref({ email: "", password: "", role: "" });

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      account.value = { email: "", password: "", role: "" };
      formErrors.clear();
    }
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const payload: Record<string, string> = {
    email: account.value.email,
    password: account.value.password,
  };

  try {
    if (props.driverId) {
      await driverStore.grantAccess(props.driverId, payload);
    } else {
      if (account.value.role) payload.role = account.value.role;
      await hrStore.grantAccess(props.employee.id, payload);
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
    title="Dar acceso a la app"
    :loading="saving"
    save-text="Crear acceso"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <FormSection
        :title="`${employee.firstName} ${employee.lastName}`"
        hint="Pasale el email y la contraseña: con eso inicia sesión en la app."
      >
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="account.email"
              :error-messages="formErrors.messages('email')"
              label="Email *"
              :rules="[r.isRequired, r.isEmail]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="account.password"
              :error-messages="formErrors.messages('password')"
              label="Contraseña *"
              type="password"
              :rules="[
                r.isRequired,
                (v: string) => (!!v && v.length >= 6) || 'Mínimo 6 caracteres',
              ]"
            />
          </v-col>
          <v-col v-if="!driverId" cols="12">
            <div class="text-body-2 text-medium-emphasis mb-1">
              Rol según el puesto:
              <strong>{{ roleForPosition(employee.position).label }}</strong>
            </div>
            <v-select
              v-model="account.role"
              :items="roleOptions"
              item-title="label"
              item-value="value"
              label="Rol (override opcional)"
              hint="Si lo dejás vacío, se usa el rol derivado del puesto."
              persistent-hint
              clearable
            />
          </v-col>
        </v-row>
      </FormSection>
    </v-form>
  </FormDialog>
</template>
