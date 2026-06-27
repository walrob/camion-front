<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useFleetStore } from "~/stores/fleet";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import type { Fleet } from "~/types/fleet";

const props = defineProps<{
  modelValue: boolean;
  fleet: Fleet | null;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const fleetStore = useFleetStore();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);

const isEdit = computed(() => !!props.fleet?.id);

const emptyForm = (): Partial<Fleet> => ({
  name: "",
  code: "",
  notes: "",
  isActive: true,
});

const form = ref<Partial<Fleet>>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = props.fleet ? { ...props.fleet } : emptyForm();
  },
);

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const ok = isEdit.value
    ? await fleetStore.updateFleet(props.fleet!.id, { ...form.value })
    : await fleetStore.createFleet({ ...form.value });

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
        {{ isEdit ? "Editar flota" : "Nueva flota" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.name"
                label="Nombre *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.code"
                label="Código *"
                variant="outlined"
                density="compact"
                :rules="[r.isRequired]"
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
            <v-col cols="12">
              <v-switch
                v-model="form.isActive"
                label="Activa"
                color="primary"
                density="compact"
                hide-details
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
