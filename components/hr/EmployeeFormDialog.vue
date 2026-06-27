<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { positionOptions, employmentStatusOptions } from "~/composables/useHrStatus";
import { useHrStore } from "~/stores/hr";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import type { Employee } from "~/types/hr";

const props = defineProps<{
  modelValue: boolean;
  employee: Employee | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();

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

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = props.employee ? { ...props.employee } : emptyForm();
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

  const ok = isEdit.value
    ? await hrStore.updateEmployee(props.employee!.id, payload)
    : await hrStore.createEmployee(payload);

  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="720" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? "Editar empleado" : "Nuevo empleado" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.firstName"
                label="Nombre *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.lastName"
                label="Apellido *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.documentId"
                label="DNI / CUIL *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.phone"
                label="Teléfono"
                variant="outlined"
                density="compact"
                :rules="[r.isPhone]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.position"
                :items="positionOptions"
                item-title="label"
                item-value="value"
                label="Puesto"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.employmentStatus"
                :items="employmentStatusOptions"
                item-title="label"
                item-value="value"
                label="Estado laboral"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.birthDate"
                label="Fecha de nacimiento"
                type="date"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.hireDate"
                label="Fecha de ingreso"
                type="date"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.address"
                label="Domicilio"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.emergencyContactName"
                label="Contacto de emergencia"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.emergencyContactPhone"
                label="Tel. emergencia"
                variant="outlined"
                density="compact"
                :rules="[r.isPhone]"
              />
            </v-col>
            <v-col cols="12">
              <VoiceTextarea
                v-model="form.notes"
                label="Notas"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="submit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
