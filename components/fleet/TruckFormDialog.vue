<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { truckStatusOptions } from "~/composables/useFleetStatus";
import { useFleetStore } from "~/stores/fleet";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import FormDialog from "~/components/shared/FormDialog.vue";
import FormSection from "~/components/shared/FormSection.vue";
import type { Truck, Fleet } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  truck: Truck | null;
  fleetOptions: Fleet[];
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fleetStore = useFleetStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.truck?.id);

const emptyForm = (): Partial<Truck> => ({
  plate: "",
  internalNumber: "",
  brand: "",
  model: "",
  year: undefined,
  type: "",
  loadCapacityKg: undefined,
  currentOdometerKm: 0,
  engineHours: 0,
  status: "available",
  fleetId: null,
});

const form = ref<Partial<Truck>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.truck ? { ...props.truck } : emptyForm();
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
  delete payload.fleet;
  // Normalizar numéricos
  ["year", "loadCapacityKg", "currentOdometerKm", "engineHours"].forEach((k) => {
    if (payload[k] === "" || payload[k] === undefined) delete payload[k];
    else payload[k] = Number(payload[k]);
  });

  try {
    if (isEdit.value) await fleetStore.updateTruck(props.truck!.id, payload);
    else await fleetStore.createTruck(payload);
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
    :title="isEdit ? 'Editar camión' : 'Nuevo camión'"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <FormSection title="Identificación">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.plate"
              :error-messages="formErrors.messages('plate')"
              label="Patente *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.internalNumber"
              :error-messages="formErrors.messages('internalNumber')"
              label="N° interno"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.brand"
              :error-messages="formErrors.messages('brand')"
              label="Marca"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.model"
              :error-messages="formErrors.messages('model')"
              label="Modelo"
            />
          </v-col>
        </v-row>
      </FormSection>

      <FormSection title="Especificaciones">
        <v-row dense>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="form.year"
              :error-messages="formErrors.messages('year')"
              label="Año"
              type="number"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="form.type"
              :error-messages="formErrors.messages('type')"
              label="Tipo"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="form.loadCapacityKg"
              :error-messages="formErrors.messages('loadCapacityKg')"
              label="Capacidad (kg)"
              type="number"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="form.currentOdometerKm"
              :error-messages="formErrors.messages('currentOdometerKm')"
              label="Odómetro (km)"
              type="number"
            />
          </v-col>
        </v-row>
      </FormSection>

      <FormSection title="Asignación y estado">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.status"
              label="Estado"
              :items="truckStatusOptions"
              item-title="label"
              item-value="value"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.fleetId"
              label="Flota"
              :items="fleetOptions"
              item-title="name"
              item-value="id"
              clearable
            />
          </v-col>
        </v-row>
      </FormSection>
    </v-form>
  </FormDialog>
</template>
