<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { certificationTypeOptions } from "~/composables/useHrStatus";
import { useHrStore } from "~/stores/hr";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import type { Certification } from "~/types/hr";

const props = defineProps<{
  modelValue: boolean;
  employeeId: string;
  certification: Certification | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();

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
    if (open)
      form.value = props.certification ? { ...props.certification } : emptyForm();
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

  let ok = false;
  if (isEdit.value) {
    ok = await hrStore.updateCertification(
      props.certification!.id,
      props.employeeId,
      payload,
    );
  } else {
    ok = await hrStore.createCertification({
      ...payload,
      employeeId: props.employeeId,
    });
  }

  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="620" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? "Editar permiso" : "Nuevo permiso / habilitación" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.type"
                :items="certificationTypeOptions"
                item-title="label"
                item-value="value"
                label="Tipo *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.class"
                label="Clase / categoría"
                variant="outlined"
                density="compact"
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
                v-model="form.issuedBy"
                label="Emitido por"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.issueDate"
                label="Fecha de emisión"
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
              <VoiceTextarea
                v-model="form.notes"
                label="Notas"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
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
