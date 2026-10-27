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
import { Feature } from "~/types/plan";

const props = defineProps<{
  modelValue: boolean;
  driver: Driver | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const auth = useAuthStore();
const driverStore = useDriverStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.driver?.id);

// Sin RRHH en el plan no hay legajos para elegir: el alta crea uno mínimo. Con
// RRHH, la persona nueva sigue siendo lo habitual (con puesto «Chofer» el perfil
// se crea solo); elegir un legajo queda para los que todavía no lo tienen.
const hasHr = computed(() => auth.hasFeature(Feature.HR_BASIC));
const mode = ref<"new" | "existing">("new");

const emptyPerson = () => ({
  firstName: "",
  lastName: "",
  documentId: "",
  phone: "",
});
const person = ref(emptyPerson());
const createAccount = ref(false);
const account = ref({ email: "", password: "" });

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
      mode.value = "new";
      person.value = emptyPerson();
      createAccount.value = false;
      account.value = { email: "", password: "" };
      formErrors.clear();
      // El empleado solo se elige en el alta; en edición queda fijo. Sin RRHH
      // el listado de legajos no está disponible (y no hace falta).
      if (!isEdit.value && hasHr.value) await driverStore.loadEmployeeOptions();
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
      const payload: Record<string, any> = { ...form.value };
      if (!payload.licenseExpiry) delete payload.licenseExpiry;
      if (mode.value === "new") {
        delete payload.employeeId;
        payload.person = { ...person.value };
        if (!payload.person.phone) delete payload.person.phone;
        if (createAccount.value) {
          payload.person.email = account.value.email;
          payload.person.password = account.value.password;
        }
      }
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
      <!-- Alta: persona nueva con legajo mínimo (sirve en todos los planes) o,
           con RRHH, un legajo que todavía no tenga perfil de chofer. -->
      <template v-if="!isEdit">
        <v-btn-toggle
          v-if="hasHr"
          v-model="mode"
          color="primary"
          density="compact"
          variant="outlined"
          divided
          mandatory
          class="mb-4"
        >
          <v-btn value="new" size="small" class="text-none">Persona nueva</v-btn>
          <v-btn value="existing" size="small" class="text-none">
            Legajo existente
          </v-btn>
        </v-btn-toggle>

        <template v-if="mode === 'new'">
          <FormSection
            title="Datos del chofer"
            :hint="
              hasHr
                ? 'Se crea su legajo con puesto «Chofer». El resto (domicilio, ingreso, permisos) se completa en RRHH.'
                : 'Lo justo para asignarle viajes.'
            "
          >
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="person.firstName"
                  :error-messages="formErrors.messages('person.firstName')"
                  label="Nombre *"
                  :rules="[r.isRequired]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="person.lastName"
                  :error-messages="formErrors.messages('person.lastName')"
                  label="Apellido *"
                  :rules="[r.isRequired]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="person.documentId"
                  :error-messages="formErrors.messages('person.documentId')"
                  label="DNI / CUIL *"
                  :rules="[r.isRequired]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="person.phone"
                  :error-messages="formErrors.messages('person.phone')"
                  label="Teléfono"
                />
              </v-col>
            </v-row>
          </FormSection>

          <FormSection
            title="Acceso a la app"
            hint="Opcional: con email y contraseña recibe los viajes en el celular. Se puede dar después."
          >
            <v-row dense>
              <v-col cols="12">
                <v-switch
                  v-model="createAccount"
                  label="Crear acceso a la app"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </v-col>
              <template v-if="createAccount">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="account.email"
                    :error-messages="formErrors.messages('person.email')"
                    label="Email *"
                    :rules="[r.isRequired, r.isEmail]"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="account.password"
                    :error-messages="formErrors.messages('person.password')"
                    label="Contraseña *"
                    type="password"
                    :rules="[
                      r.isRequired,
                      (v: string) =>
                        (!!v && v.length >= 6) || 'Mínimo 6 caracteres',
                    ]"
                  />
                </v-col>
              </template>
            </v-row>
          </FormSection>
        </template>
      </template>

      <!-- Empleado: el chofer es un empleado de RRHH con puesto «Chofer». Al dar
           de alta un empleado con ese puesto el perfil se crea solo; este alta
           manual queda para legajos anteriores que no lo tengan. -->
      <FormSection
        v-if="isEdit || mode === 'existing'"
        title="Empleado"
        hint="Los empleados con puesto «Chofer» aparecen acá automáticamente. Este alta es para legajos que todavía no tengan perfil. El nombre, documento y contacto se gestionan en RRHH."
      >
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
