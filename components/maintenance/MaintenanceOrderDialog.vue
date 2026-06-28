<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useMaintenanceStore } from "~/stores/maintenance";
import { orderStatusOptions } from "~/composables/useMaintenanceStatus";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";

const props = defineProps<{
  modelValue: boolean;
  order: any | null;
  truckId: string;
  plans: any[];
}>();
const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const store = useMaintenanceStore();

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
    if (open) form.value = props.order ? { ...props.order } : empty();
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

  let ok = false;
  if (isEdit.value) {
    delete payload.truckId;
    ok = await store.updateOrder(props.order.id, props.truckId, payload);
  } else {
    ok = await store.createOrder(payload);
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
        {{ isEdit ? "Editar OT" : "Nueva orden de trabajo" }}
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.date"
                label="Fecha *"
                type="date"
                variant="outlined"
                density="compact"
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
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.odometerKm"
                label="Odómetro (km)"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.cost"
                label="Costo"
                type="number"
                prefix="$"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="form.planId"
                :items="plans"
                item-value="id"
                item-title="name"
                label="Plan asociado (opcional)"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12">
              <VoiceTextarea
                v-model="form.description"
                label="Descripción del trabajo"
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
