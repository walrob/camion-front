<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useCatalogOptions, CATALOG } from "~/stores/catalog";

// Los tipos de permiso los define cada empresa (docs/CONFIGURACION.md §5).
const tiposPermiso = useCatalogOptions(CATALOG.CERTIFICATION_TYPE);
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
const file = ref<File | null>(null);

const isEdit = computed(() => !!props.certification?.id);
const hasFile = computed(() => !!props.certification?.fileKey);

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

  // Multipart: las fechas/campos vacíos no se envían (el backend valida formato).
  const fd = new FormData();
  fd.append("type", form.value.type || "");
  for (const k of ["class", "number", "issuedBy", "issueDate", "expiryDate", "notes"] as const) {
    const v = (form.value as any)[k];
    if (v) fd.append(k, v);
  }
  if (file.value) fd.append("file", file.value);

  try {
    if (isEdit.value) {
      await hrStore.updateCertification(props.certification!.id, props.employeeId, fd);
    } else {
      fd.append("employeeId", props.employeeId);
      await hrStore.createCertification(fd, props.employeeId);
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
            :items="tiposPermiso"
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
        <v-col cols="12">
          <v-file-input
            :label="hasFile ? 'Reemplazar archivo (imagen o PDF)' : 'Archivo (imagen o PDF)'"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            variant="outlined"
            density="compact"
            accept="image/*,application/pdf"
            hide-details
            @change="onFile"
          />
          <div v-if="hasFile" class="d-flex align-center ga-1 mt-2 text-caption">
            <v-icon size="16" color="success">mdi-check-circle-outline</v-icon>
            <span class="text-medium-emphasis">Tiene un archivo cargado.</span>
            <v-btn
              variant="text"
              size="x-small"
              color="primary"
              class="text-none"
              prepend-icon="mdi-eye"
              @click="hrStore.openCertFile(props.certification!.id)"
            >
              Ver actual
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
