<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useMaintenanceStore } from "~/stores/maintenance";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import { orderStatusOptions } from "~/composables/useMaintenanceStatus";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import FormDialog from "~/components/shared/FormDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  order: any | null;
  truckId: string;
  plans: any[];
}>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const store = useMaintenanceStore();
const general = useGeneralStore();
const formErrors = useFormErrors();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const isEdit = computed(() => !!props.order?.id);

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({
  planId: null as string | null,
  date: today(),
  odometerKm: null as number | null,
  description: "",
  cost: null as number | null,
  status: "open",
  notes: "",
});
const form = ref<Record<string, any>>(empty());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.order ? { ...props.order } : empty();
      formErrors.clear();
    }
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;
  const payload: any = { ...form.value, truckId: props.truckId };
  if (!payload.planId) delete payload.planId;
  ["odometerKm", "cost"].forEach((k) => {
    if (payload[k] === "" || payload[k] == null) delete payload[k];
    else payload[k] = Number(payload[k]);
  });

  try {
    if (isEdit.value) {
      delete payload.truckId;
      await store.updateOrder(props.order.id, props.truckId, payload);
    } else {
      await store.createOrder(payload);
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
    :title="isEdit ? 'Editar OT' : 'Nueva orden de trabajo'"
    :max-width="560"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @cancel="close"
    @save="submit"
  >
    <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.date"
            :error-messages="formErrors.messages('date')"
            label="Fecha *"
            type="date"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.status"
            :items="orderStatusOptions"
            item-title="label"
            item-value="value"
            label="Estado"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.odometerKm"
            :error-messages="formErrors.messages('odometerKm')"
            label="Odómetro (km)"
            type="number"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.cost"
            :error-messages="formErrors.messages('cost')"
            label="Costo"
            type="number"
            prefix="$"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.planId"
            :items="plans"
            item-value="id"
            item-title="name"
            label="Plan asociado (opcional)"
            clearable
          />
        </v-col>
        <v-col cols="12">
          <VoiceTextarea
            v-model="form.description"
            label="Descripción del trabajo"
            rows="2"
            auto-grow
          />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
