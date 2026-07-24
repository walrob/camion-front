<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useValidations } from "~/composables/useValidations";
import { useMaintenanceStore } from "~/stores/maintenance";
import { useGeneralStore } from "~/stores/general";
import { useFormErrors } from "~/composables/useFormErrors";
import {
  triggerTypeOptions,
  planStatusOptions,
} from "~/composables/useMaintenanceStatus";
import FormDialog from "~/components/shared/FormDialog.vue";

const props = defineProps<{ modelValue: boolean; plan: any | null }>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const store = useMaintenanceStore();
const general = useGeneralStore();
const formErrors = useFormErrors();
const { truckOptions } = storeToRefs(store);

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const isEdit = computed(() => !!props.plan?.id);

const empty = () => ({
  truckId: "",
  name: "",
  triggerType: "km",
  intervalValue: null as number | null,
  lastServiceKm: null as number | null,
  lastServiceAt: "",
  status: "active",
});
const form = ref<Record<string, any>>(empty());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.plan ? { ...props.plan } : empty();
      formErrors.clear();
      if (!truckOptions.value.length) store.getTruckOptions();
    }
  },
);
onMounted(() => {
  if (!truckOptions.value.length) store.getTruckOptions();
});

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;
  const payload: any = { ...form.value };
  payload.intervalValue = Number(payload.intervalValue);
  if (payload.lastServiceKm === "" || payload.lastServiceKm == null)
    delete payload.lastServiceKm;
  else payload.lastServiceKm = Number(payload.lastServiceKm);
  if (!payload.lastServiceAt) delete payload.lastServiceAt;

  try {
    if (isEdit.value) {
      delete payload.truckId;
      delete payload.truck;
      await store.updatePlan(props.plan.id, payload);
    } else {
      await store.createPlan(payload);
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
    :title="isEdit ? 'Editar plan' : 'Nuevo plan de mantenimiento'"
    :max-width="560"
    :loading="saving"
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
            :item-title="(t: any) => t.plate"
            label="Camión *"
            :disabled="isEdit"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12" sm="7">
          <v-text-field
            v-model="form.name"
            :error-messages="formErrors.messages('name')"
            label="Nombre del plan *"
            :rules="[r.isRequired]"
          />
        </v-col>
        <v-col cols="12" sm="5">
          <v-select
            v-model="form.triggerType"
            :items="triggerTypeOptions"
            item-title="label"
            item-value="value"
            label="Disparador"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="form.intervalValue"
            :error-messages="formErrors.messages('intervalValue')"
            label="Intervalo *"
            type="number"
            :rules="[r.isRequired]"
            :hint="form.triggerType === 'date' ? 'en días' : form.triggerType === 'hours' ? 'en horas' : 'en km'"
            persistent-hint
          />
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="form.status"
            :items="planStatusOptions"
            item-title="label"
            item-value="value"
            label="Estado"
          />
        </v-col>
        <v-col v-if="form.triggerType !== 'date'" cols="12">
          <v-text-field
            v-model="form.lastServiceKm"
            :error-messages="formErrors.messages('lastServiceKm')"
            :label="form.triggerType === 'hours' ? 'Último service (horas)' : 'Último service (km)'"
            type="number"
          />
        </v-col>
        <v-col v-else cols="12">
          <v-text-field
            v-model="form.lastServiceAt"
            :error-messages="formErrors.messages('lastServiceAt')"
            label="Fecha último service"
            type="date"
          />
        </v-col>
      </v-row>
    </v-form>
  </FormDialog>
</template>
