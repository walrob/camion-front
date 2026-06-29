<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { certificationTypeOptions } from "~/composables/useHrStatus";
import { useHrStore } from "~/stores/hr";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";
import type { Certification } from "~/types/hr";

const props = defineProps<{
  modelValue: boolean;
  employeeId: string;
  certification: Certification | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.certification?.id);

const emptyForm = (): Partial<Certification> => ({
  type: "driving_license",
  class: "",
  number: "",
  issuedBy: "",
  issueDate: "",
  expiryDate: "",
  notes: "",
});

const form = ref<Partial<Certification>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.certification ? { ...props.certification } : emptyForm();
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
  ["issueDate", "expiryDate"].forEach((k) => {
    if (!payload[k]) delete payload[k];
  });

  try {
    if (isEdit.value) {
      await hrStore.updateCertification(props.certification!.id, props.employeeId, payload);
    } else {
      await hrStore.createCertification({ ...payload, employeeId: props.employeeId });
    }
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
    :title="isEdit ? 'Editar permiso' : 'Nuevo permiso / habilitación'"
    :max-width="620"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.type"
            :error-messages="formErrors.messages('type')"
            :items="certificationTypeOptions"
            item-title="label"
            item-value="value"
            label="Tipo *"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.class"
            :error-messages="formErrors.messages('class')"
            label="Clase / categoría"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.number"
            :error-messages="formErrors.messages('number')"
            label="Número"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.issuedBy"
            :error-messages="formErrors.messages('issuedBy')"
            label="Emitido por"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.issueDate"
            :error-messages="formErrors.messages('issueDate')"
            label="Fecha de emisión"
            type="date"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.expiryDate"
            :error-messages="formErrors.messages('expiryDate')"
            label="Vencimiento"
            type="date"
          />
        </v-col>
        <v-col cols="12">
          <VoiceTextarea v-model="form.notes" label="Notas" rows="2" auto-grow />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
