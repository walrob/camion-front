<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useValidations } from "~/composables/useValidations";
import { useMaintenanceStore } from "~/stores/maintenance";
import {
  triggerTypeOptions,
  planStatusOptions,
} from "~/composables/useMaintenanceStatus";

const props = defineProps<{ modelValue: boolean; plan: any | null }>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const store = useMaintenanceStore();
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

  let ok = false;
  if (isEdit.value) {
    delete payload.truckId;
    delete payload.truck;
    ok = await store.updatePlan(props.plan.id, payload);
  } else {
    ok = await store.createPlan(payload);
  }
  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? "Editar plan" : "Nuevo plan de mantenimiento" }}
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12">
              <v-select
                v-model="form.truckId"
                :items="truckOptions"
                item-value="id"
                :item-title="(t: any) => t.plate"
                label="Camión *"
                variant="outlined"
                density="compact"
                :disabled="isEdit"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="7">
              <v-text-field
                v-model="form.name"
                label="Nombre del plan *"
                variant="outlined"
                density="compact"
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
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.intervalValue"
                label="Intervalo *"
                type="number"
                variant="outlined"
                density="compact"
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
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col v-if="form.triggerType !== 'date'" cols="12">
              <v-text-field
                v-model="form.lastServiceKm"
                :label="form.triggerType === 'hours' ? 'Último service (horas)' : 'Último service (km)'"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col v-else cols="12">
              <v-text-field
                v-model="form.lastServiceAt"
                label="Fecha último service"
                type="date"
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
        <v-btn color="primary" :loading="saving" @click="submit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
