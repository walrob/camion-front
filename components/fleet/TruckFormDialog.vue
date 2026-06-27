<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { truckStatusOptions } from "~/composables/useFleetStatus";
import { useFleetStore } from "~/stores/fleet";
import type { Truck, Fleet } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  truck: Truck | null;
  fleetOptions: Fleet[];
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fleetStore = useFleetStore();

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
    if (open) form.value = props.truck ? { ...props.truck } : emptyForm();
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

  const ok = isEdit.value
    ? await fleetStore.updateTruck(props.truck!.id, payload)
    : await fleetStore.createTruck(payload);

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
        {{ isEdit ? "Editar camión" : "Nuevo camión" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.plate"
                label="Patente *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.internalNumber"
                label="N° interno"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.brand"
                label="Marca"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.model"
                label="Modelo"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model="form.year"
                label="Año"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model="form.type"
                label="Tipo"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model="form.loadCapacityKg"
                label="Capacidad (kg)"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model="form.currentOdometerKm"
                label="Odómetro (km)"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.status"
                label="Estado"
                :items="truckStatusOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="compact"
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
                variant="outlined"
                density="compact"
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
