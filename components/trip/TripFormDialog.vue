<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useValidations } from "~/composables/useValidations";
import { useTripStore } from "~/stores/trip";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import type { Trip } from "~/types/trip";

const props = defineProps<{
  modelValue: boolean;
  trip: Trip | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const tripStore = useTripStore();
const { truckOptions, trailerOptions, driverOptions } = storeToRefs(tripStore);

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.trip?.id);

const emptyForm = (): Partial<Trip> => ({
  truckId: "",
  trailerId: null,
  driverId: "",
  origin: "",
  destination: "",
  cargoDescription: "",
  plannedStartAt: "",
  plannedEndAt: "",
  notes: "",
});

const form = ref<Partial<Trip>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.trip ? { ...props.trip } : emptyForm();
      if (!truckOptions.value.length) tripStore.loadFormOptions();
    }
  },
);

onMounted(() => {
  if (!truckOptions.value.length) tripStore.loadFormOptions();
});

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const payload = { ...form.value } as any;
  delete payload.truck;
  delete payload.driver;
  delete payload.trailer;
  ["plannedStartAt", "plannedEndAt"].forEach((k) => {
    if (!payload[k]) delete payload[k];
  });
  if (!payload.trailerId) delete payload.trailerId;

  const ok = isEdit.value
    ? await tripStore.updateTrip(props.trip!.id, payload)
    : await tripStore.createTrip(payload);

  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="680" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? "Editar viaje" : "Nuevo viaje" }}
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.truckId"
                :items="truckOptions"
                item-value="id"
                :item-title="(t: any) => `${t.plate}${t.brand ? ' - ' + t.brand : ''}`"
                label="Camión *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.driverId"
                :items="driverOptions"
                item-value="id"
                :item-title="(d: any) => d.user?.name || d.licenseNumber || d.id"
                label="Chofer *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.trailerId"
                :items="trailerOptions"
                item-value="id"
                item-title="plate"
                label="Acoplado"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.cargoDescription"
                label="Carga"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.origin"
                label="Origen *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.destination"
                label="Destino *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.plannedStartAt"
                label="Salida planificada"
                type="datetime-local"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.plannedEndAt"
                label="Llegada planificada"
                type="datetime-local"
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
