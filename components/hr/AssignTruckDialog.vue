<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useValidations } from "~/composables/useValidations";
import { useHrStore } from "~/stores/hr";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import FormDialog from "~/components/shared/FormDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  employeeId: string;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();
const general = useGeneralStore();
const formErrors = useFormErrors();
const { truckOptions } = storeToRefs(hrStore);

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const form = ref({ truckId: "", isPrimary: true, notes: "" });

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = { truckId: "", isPrimary: true, notes: "" };
      formErrors.clear();
      if (!truckOptions.value.length) hrStore.getTruckOptions();
    }
  },
);

onMounted(() => {
  if (!truckOptions.value.length) hrStore.getTruckOptions();
});

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;
  try {
    await hrStore.assignTruck({
      employeeId: props.employeeId,
      truckId: form.value.truckId,
      isPrimary: form.value.isPrimary,
      notes: form.value.notes || undefined,
    });
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
    title="Asignar camión"
    :max-width="520"
    :loading="saving"
    save-text="Asignar"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12">
          <v-autocomplete
            v-model="form.truckId"
            :error-messages="formErrors.messages('truckId')"
            :items="truckOptions"
            item-value="id"
            :item-title="(t: any) => `${t.plate}${t.brand ? ' - ' + t.brand : ''}`"
            label="Camión *"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12">
          <v-switch
            v-model="form.isPrimary"
            label="Asignación principal"
            color="primary"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12">
          <VoiceTextField
            v-model="form.notes"
            :error-messages="formErrors.messages('notes')"
            label="Notas"
          />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
