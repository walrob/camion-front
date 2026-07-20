<script setup lang="ts">
import { ref, watch } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useDocumentStore } from "~/stores/document";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import { documentCategoryOptions } from "~/composables/useDocumentStatus";
import FormDialog from "~/components/shared/FormDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  ownerType: string;
  ownerId: string | null;
}>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const store = useDocumentStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const file = ref<File | null>(null);

const empty = () => ({
  category: "insurance",
  number: "",
  issueDate: "",
  expiryDate: "",
});
const form = ref(empty());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = empty();
      file.value = null;
      formErrors.clear();
    }
  },
);

const onFile = (e: Event) => {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null;
};
const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const fd = new FormData();
  fd.append("ownerType", props.ownerType);
  if (props.ownerType !== "company" && props.ownerId)
    fd.append("ownerId", props.ownerId);
  fd.append("category", form.value.category);
  if (form.value.number) fd.append("number", form.value.number);
  if (form.value.issueDate) fd.append("issueDate", form.value.issueDate);
  if (form.value.expiryDate) fd.append("expiryDate", form.value.expiryDate);
  if (file.value) fd.append("file", file.value);

  try {
    await store.createDocument(fd, true);
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
    title="Nuevo documento"
    :max-width="520"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.category"
            :error-messages="formErrors.messages('category')"
            :items="documentCategoryOptions"
            item-title="label"
            item-value="value"
            label="Categoría *"
            :rules="[r.isRequired]"
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
            v-model="form.issueDate"
            :error-messages="formErrors.messages('issueDate')"
            label="Emisión"
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
          <v-file-input
            label="Archivo"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            variant="outlined"
            density="compact"
            hide-details
            @change="onFile"
          />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
