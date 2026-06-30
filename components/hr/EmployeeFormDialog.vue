<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import {
  positionOptions,
  employmentStatusOptions,
  roleOptions,
  roleForPosition,
} from "~/composables/useHrStatus";
import { useHrStore } from "~/stores/hr";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";
import FormSection from "~/components/shared/FormSection.vue";
import type { Employee } from "~/types/hr";

const props = defineProps<{
  modelValue: boolean;
  employee: Employee | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.employee?.id);

const emptyForm = (): Partial<Employee> => ({
  firstName: "",
  lastName: "",
  documentId: "",
  position: "driver",
  employmentStatus: "active",
  birthDate: "",
  hireDate: "",
  phone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
});

const form = ref<Partial<Employee>>(emptyForm());

// Alta opcional de cuenta de acceso (solo en creación). El backend crea el User
// y lo vincula en el mismo POST si llegan email + password.
const createAccount = ref(false);
const account = ref({ email: "", password: "", role: "" });

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.employee ? { ...props.employee } : emptyForm();
      createAccount.value = false;
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

  const payload = { ...form.value } as any;
  ["birthDate", "hireDate", "terminationDate"].forEach((k) => {
    if (!payload[k]) delete payload[k];
  });
  delete payload.certifications;
  delete payload.assignments;

  // Datos de cuenta: solo en alta y si se activó el toggle. Nunca en edición.
  if (!isEdit.value && createAccount.value) {
    payload.email = account.value.email;
    payload.password = account.value.password;
    if (account.value.role) payload.role = account.value.role;
  }

  try {
    if (isEdit.value) await hrStore.updateEmployee(props.employee!.id, payload);
    else await hrStore.createEmployee(payload);
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
    :title="isEdit ? 'Editar empleado' : 'Nuevo empleado'"
    :max-width="720"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <FormSection title="Datos personales">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.firstName"
              :error-messages="formErrors.messages('firstName')"
              label="Nombre *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.lastName"
              :error-messages="formErrors.messages('lastName')"
              label="Apellido *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.documentId"
              :error-messages="formErrors.messages('documentId')"
              label="DNI / CUIL *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.birthDate"
              :error-messages="formErrors.messages('birthDate')"
              label="Fecha de nacimiento"
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
            <v-text-field
              v-model="form.address"
              :error-messages="formErrors.messages('address')"
              label="Domicilio"
            />
          </v-col>
        </v-row>
      </FormSection>

      <FormSection title="Laboral y contacto">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.position"
              :items="positionOptions"
              item-title="label"
              item-value="value"
              label="Puesto"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.employmentStatus"
              :items="employmentStatusOptions"
              item-title="label"
              item-value="value"
              label="Estado laboral"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.hireDate"
              :error-messages="formErrors.messages('hireDate')"
              label="Fecha de ingreso"
              type="date"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.emergencyContactName"
              :error-messages="formErrors.messages('emergencyContactName')"
              label="Contacto de emergencia"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.emergencyContactPhone"
              :error-messages="formErrors.messages('emergencyContactPhone')"
              label="Tel. emergencia"
              :rules="[r.isPhone]"
            />
          </v-col>
          <v-col cols="12">
            <VoiceTextarea
              v-model="form.notes"
              label="Notas"
              rows="2"
              auto-grow
            />
          </v-col>
        </v-row>
      </FormSection>

      <!-- Cuenta de acceso: solo al crear. El backend crea el User en el mismo POST. -->
      <FormSection
        v-if="!isEdit"
        title="Acceso a la app"
        hint="Opcional: crea un usuario para que la persona inicie sesión."
      >
        <v-row dense>
          <v-col cols="12">
            <v-switch
              v-model="createAccount"
              label="Crear acceso a la app"
              color="primary"
              density="compact"
              hide-details
              unset
            />
          </v-col>
          <template v-if="createAccount">
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
                  (v: string) =>
                    (!!v && v.length >= 6) || 'Mínimo 6 caracteres',
                ]"
              />
            </v-col>
            <v-col cols="12">
              <div class="text-body-2 text-medium-emphasis mb-1">
                Rol según el puesto:
                <strong>{{ roleForPosition(form.position).label }}</strong>
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
          </template>
        </v-row>
      </FormSection>
    </v-form>
  </FormDialog>
</template>
