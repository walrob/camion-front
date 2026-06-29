<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useFleetStore } from "~/stores/fleet";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";
import type { Fleet } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  fleet: Fleet | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fleetStore = useFleetStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.fleet?.id);

const emptyForm = (): Partial<Fleet> => ({
  name: "",
  code: "",
  notes: "",
  isActive: true,
});

const form = ref<Partial<Fleet>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.fleet ? { ...props.fleet } : emptyForm();
      formErrors.clear();
    }
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  try {
    if (isEdit.value) await fleetStore.updateFleet(props.fleet!.id, { ...form.value });
    else await fleetStore.createFleet({ ...form.value });
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
    :title="isEdit ? 'Editar flota' : 'Nueva flota'"
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
            v-model="form.name"
            :error-messages="formErrors.messages('name')"
            label="Nombre *"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.code"
            :error-messages="formErrors.messages('code')"
            label="Código *"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12">
          <VoiceTextarea v-model="form.notes" label="Notas" rows="2" auto-grow />
        </v-col>
        <v-col cols="12">
          <v-switch
            v-model="form.isActive"
            label="Activa"
            color="primary"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
