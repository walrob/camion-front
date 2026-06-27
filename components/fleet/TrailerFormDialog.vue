<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { trailerStatusOptions } from "~/composables/useFleetStatus";
import { useFleetStore } from "~/stores/fleet";
import type { Trailer } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  trailer: Trailer | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fleetStore = useFleetStore();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.trailer?.id);

const emptyForm = (): Partial<Trailer> => ({
  plate: "",
  type: "",
  loadCapacityKg: undefined,
  status: "available",
  isActive: true,
});

const form = ref<Partial<Trailer>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = props.trailer ? { ...props.trailer } : emptyForm();
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const payload = { ...form.value } as any;
  if (payload.loadCapacityKg === "" || payload.loadCapacityKg === undefined)
    delete payload.loadCapacityKg;
  else payload.loadCapacityKg = Number(payload.loadCapacityKg);

  const ok = isEdit.value
    ? await fleetStore.updateTrailer(props.trailer!.id, payload)
    : await fleetStore.createTrailer(payload);

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
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? "Editar acoplado" : "Nuevo acoplado" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.plate"
                label="Patente *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.type"
                label="Tipo"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.loadCapacityKg"
                label="Capacidad (kg)"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.status"
                label="Estado"
                :items="trailerStatusOptions"
                item-title="label"
                item-value="value"
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
