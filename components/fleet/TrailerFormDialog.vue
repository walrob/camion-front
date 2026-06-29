<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { trailerStatusOptions } from "~/composables/useFleetStatus";
import { useFleetStore } from "~/stores/fleet";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import FormDialog from "~/components/shared/FormDialog.vue";
import type { Trailer } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  trailer: Trailer | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fleetStore = useFleetStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.trailer?.id);

const emptyForm = (): Partial<Trailer> => ({
  plate: "",
  type: "",
  loadCapacityKg: undefined,
  status: "available",
  isActive: true,
});

const form = ref<Partial<Trailer>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.trailer ? { ...props.trailer } : emptyForm();
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
  if (payload.loadCapacityKg === "" || payload.loadCapacityKg === undefined)
    delete payload.loadCapacityKg;
  else payload.loadCapacityKg = Number(payload.loadCapacityKg);

  try {
    if (isEdit.value) await fleetStore.updateTrailer(props.trailer!.id, payload);
    else await fleetStore.createTrailer(payload);
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
    :title="isEdit ? 'Editar acoplado' : 'Nuevo acoplado'"
    :max-width="520"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
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
            v-model="form.type"
            :error-messages="formErrors.messages('type')"
            label="Tipo"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.loadCapacityKg"
            :error-messages="formErrors.messages('loadCapacityKg')"
            label="Capacidad (kg)"
            type="number"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.status"
            label="Estado"
            :items="trailerStatusOptions"
            item-title="label"
            item-value="value"
          />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
