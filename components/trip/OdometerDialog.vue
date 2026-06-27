<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useGeolocation } from "~/composables/useGeolocation";
import { useTripStore } from "~/stores/trip";

const props = defineProps<{
  modelValue: boolean;
  tripId: string;
  mode: "start" | "finish";
  suggestedKm?: number | null;
}>();

const emit = defineEmits(["update:modelValue", "done"]);

const r = useValidations();
const tripStore = useTripStore();
const { getPosition } = useGeolocation();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const odometer = ref<number | null>(null);

const title = computed(() =>
  props.mode === "start" ? "Iniciar viaje" : "Finalizar viaje",
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) odometer.value = props.suggestedKm ?? null;
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const pos = await getPosition();
  const payload: any = {
    lat: pos?.lat,
    lng: pos?.lng,
  };

  let ok = false;
  if (props.mode === "start") {
    ok = await tripStore.startTrip(props.tripId, {
      startOdometerKm: Number(odometer.value),
      ...payload,
    });
  } else {
    ok = await tripStore.finishTrip(props.tripId, {
      endOdometerKm: Number(odometer.value),
      ...payload,
    });
  }

  saving.value = false;
  if (ok) {
    emit("done");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">{{ title }}</v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-text-field
            v-model="odometer"
            label="Odómetro (km) *"
            type="number"
            variant="outlined"
            :rules="[r.isRequired]"
            autofocus
          />
          <p class="text-caption text-medium-emphasis">
            <v-icon size="14">mdi-map-marker</v-icon>
            Se registrará tu ubicación automáticamente.
          </p>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="submit">
          {{ mode === "start" ? "Iniciar" : "Finalizar" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
