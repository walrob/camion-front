<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useValidations } from "~/composables/useValidations";
import { useTripStore } from "~/stores/trip";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";
import FormSection from "~/components/shared/FormSection.vue";
import type { Trip } from "~/types/trip";

const props = defineProps<{
  modelValue: boolean;
  trip: Trip | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const tripStore = useTripStore();
const general = useGeneralStore();
const formErrors = useFormErrors();
const { truckOptions, trailerOptions, driverOptions } = storeToRefs(tripStore);

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.trip?.id);

const emptyForm = (): Partial<Trip> => ({
  trailerId: null,
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
      formErrors.clear();
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

  try {
    if (isEdit.value) await tripStore.updateTrip(props.trip!.id, payload);
    else await tripStore.createTrip(payload);
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
    :title="isEdit ? 'Editar viaje' : 'Nuevo viaje'"
    :max-width="680"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <FormSection title="Asignación">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.truckId"
              :error-messages="formErrors.messages('truckId')"
              :items="truckOptions"
              item-value="id"
              :item-title="
                (t: any) => `${t.plate}${t.brand ? ' - ' + t.brand : ''}`
              "
              label="Camión *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.driverId"
              :error-messages="formErrors.messages('driverId')"
              :items="driverOptions"
              item-value="id"
              :item-title="(d: any) => driverName(d)"
              label="Chofer *"
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
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.cargoDescription"
              :error-messages="formErrors.messages('cargoDescription')"
              label="Carga"
            />
          </v-col>
        </v-row>
      </FormSection>

      <FormSection title="Ruta y planificación">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.origin"
              :error-messages="formErrors.messages('origin')"
              label="Origen *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.destination"
              :error-messages="formErrors.messages('destination')"
              label="Destino *"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.plannedStartAt"
              :error-messages="formErrors.messages('plannedStartAt')"
              label="Salida planificada"
              type="datetime-local"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.plannedEndAt"
              :error-messages="formErrors.messages('plannedEndAt')"
              label="Llegada planificada"
              type="datetime-local"
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
    </v-form>
  </FormDialog>
</template>
