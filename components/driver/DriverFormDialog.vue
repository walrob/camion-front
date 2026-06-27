<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { driverStatusOptions } from "~/composables/useFleetStatus";
import { useDriverStore } from "~/stores/driver";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import type { Driver } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  driver: Driver | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const driverStore = useDriverStore();

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
    }
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  let ok = false;
  if (isEdit.value) {
    const { licenseNumber, licenseType, licenseExpiry, phone, status, notes } =
      form.value;
    ok = await driverStore.updateDriver(props.driver!.id, {
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
    ok = await driverStore.createDriver(payload);
  }

  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? "Editar chofer" : "Nuevo chofer" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <!-- Datos de acceso (solo alta) -->
            <template v-if="!isEdit">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.name"
                  label="Nombre *"
                  variant="outlined"
                  density="compact"
                  :rules="[r.isRequired]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email *"
                  variant="outlined"
                  density="compact"
                  :rules="[r.isRequired, r.isEmail]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.password"
                  label="Contraseña *"
                  type="password"
                  variant="outlined"
                  density="compact"
                  :rules="[r.isRequired]"
                />
              </v-col>
            </template>

            <!-- Perfil del chofer -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.licenseNumber"
                label="N° de licencia"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.licenseType"
                label="Tipo / clase de licencia"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.licenseExpiry"
                label="Vencimiento licencia"
                type="date"
                variant="outlined"
                density="compact"
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
                v-model="form.status"
                label="Estado"
                :items="driverStatusOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="compact"
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
