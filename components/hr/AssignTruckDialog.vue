<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useValidations } from "~/composables/useValidations";
import { useHrStore } from "~/stores/hr";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

const props = defineProps<{
  modelValue: boolean;
  employeeId: string;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const hrStore = useHrStore();
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
  const ok = await hrStore.assignTruck({
    employeeId: props.employeeId,
    truckId: form.value.truckId,
    isPrimary: form.value.isPrimary,
    notes: form.value.notes || undefined,
  });
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
      <v-card-title class="text-h6 font-weight-bold">Asignar camión</v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12">
              <v-select
                v-model="form.truckId"
                :items="truckOptions"
                item-value="id"
                :item-title="(t: any) => `${t.plate}${t.brand ? ' - ' + t.brand : ''}`"
                label="Camión *"
                variant="outlined"
                density="compact"
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
                label="Notas"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="submit">Asignar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
