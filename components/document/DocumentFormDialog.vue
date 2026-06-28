<script setup lang="ts">
import { ref, watch } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useDocumentStore } from "~/stores/document";
import { documentCategoryOptions } from "~/composables/useDocumentStatus";

const props = defineProps<{
  modelValue: boolean;
  ownerType: string;
  ownerId: string;
}>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const store = useDocumentStore();

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

  const ok = await store.createDocument(fd);
  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">Nuevo documento</v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.category"
                :items="documentCategoryOptions"
                item-title="label"
                item-value="value"
                label="Categoría *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.number"
                label="Número"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.issueDate"
                label="Emisión"
                type="date"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.expiryDate"
                label="Vencimiento"
                type="date"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-file-input
                label="Archivo"
                prepend-icon="mdi-paperclip"
                variant="outlined"
                density="compact"
                hide-details
                @change="onFile"
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
