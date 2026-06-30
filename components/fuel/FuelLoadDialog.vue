<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { fuelTypeOptions } from "~/composables/useFuelStatus";
import { useGeolocation } from "~/composables/useGeolocation";
import { useFuelStore } from "~/stores/fuel";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

const props = defineProps<{
  modelValue: boolean;
  truckId?: string | null;
  tripId?: string | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fuelStore = useFuelStore();
const { getPosition } = useGeolocation();

const formRef = ref();
const valid = ref(true);
const file = ref<File | null>(null);

const emptyForm = () => ({
  fuelType: "diesel",
  liters: null as number | null,
  pricePerLiter: null as number | null,
  odometerKm: null as number | null,
  fullTank: true,
  station: "",
  notes: "",
});

const form = ref(emptyForm());

// Total estimado (litros × precio) para que el chofer lo vea antes de guardar.
const estimatedTotal = computed(() => {
  const l = Number(form.value.liters);
  const p = Number(form.value.pricePerLiter);
  return l && p ? l * p : 0;
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = emptyForm();
      file.value = null;
    }
  },
);

const onFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
};

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;

  const pos = await getPosition();
  const payload: Record<string, any> = {
    truckId: props.truckId,
    tripId: props.tripId || undefined,
    fuelType: form.value.fuelType,
    liters: Number(form.value.liters),
    fullTank: form.value.fullTank,
    station: form.value.station || undefined,
    notes: form.value.notes || undefined,
    lat: pos?.lat,
    lng: pos?.lng,
  };
  if (form.value.pricePerLiter)
    payload.pricePerLiter = Number(form.value.pricePerLiter);
  if (form.value.odometerKm) payload.odometerKm = Number(form.value.odometerKm);

  const ok = await fuelStore.createLoad(payload, file.value);
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        Cargar combustible
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-select
            v-model="form.fuelType"
            :items="fuelTypeOptions"
            item-title="label"
            item-value="value"
            label="Tipo *"
            variant="outlined"
            density="comfortable"
            :rules="[r.isRequired]"
          >
            <template #item="{ props: ip, item }">
              <v-list-item v-bind="ip" :prepend-icon="item.raw.icon" />
            </template>
          </v-select>

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.liters"
                label="Litros *"
                type="number"
                suffix="L"
                variant="outlined"
                density="comfortable"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.pricePerLiter"
                label="Precio por litro"
                type="number"
                prefix="$"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="estimatedTotal"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Total estimado: $ {{ estimatedTotal.toLocaleString("es-AR") }}
          </v-alert>

          <v-text-field
            v-model="form.odometerKm"
            label="Odómetro (km)"
            type="number"
            suffix="km"
            variant="outlined"
            density="comfortable"
            hint="Necesario para calcular el rendimiento"
            persistent-hint
          />

          <v-switch
            v-model="form.fullTank"
            label="Tanque lleno"
            color="primary"
            density="comfortable"
            hide-details
            class="my-1"
          />

          <VoiceTextField
            v-model="form.station"
            label="Estación / lugar"
            variant="outlined"
            density="comfortable"
          />

          <VoiceTextField
            v-model="form.notes"
            label="Observaciones"
            variant="outlined"
            density="comfortable"
          />

          <v-file-input
            label="Foto del ticket"
            accept="image/*"
            capture="environment"
            prepend-icon="mdi-camera"
            variant="outlined"
            density="comfortable"
            hide-details
            @change="onFile"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="fuelStore.saving" @click="submit">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
