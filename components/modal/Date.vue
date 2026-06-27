<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="title">
        <v-row>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Seleccionar día</v-label>
            <v-text-field
              v-model="form.date"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              type="date"
              :min="today"
              :rules="[r.isRequired]"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Razón</v-label>
            <v-text-field
              v-model="form.reason"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
            ></v-text-field>
          </v-col>
        </v-row>

        <template #footer>
          <v-btn text="Cancelar" variant="text" @click="dialog = false"></v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            text="Guardar"
            type="submit"
          ></v-btn>
        </template>
      </UiModalCard>
    </v-form>
  </v-dialog>
</template>

<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { useValidations } from "~/composables/useValidations";
import type { NonWorkingDay } from "~/types/project";
const r = useValidations();

const props = defineProps({
  title: {
    type: String,
    default: "Editar",
  },
  data: {
    type: Object as () => NonWorkingDay,
    default: {
      date: "",
      id: "",
      reason: undefined,
    },
  },
});

const form = ref<NonWorkingDay>({ ...props.data });
const dataRef = toRef(props, "data");

watch(dataRef, (newValue) => {
  form.value = { ...newValue };
});

const today = new Date().toISOString().slice(0, 10);

const dialog = defineModel<boolean>();

const formValid = ref(true);
const formRef = ref();

const emit = defineEmits(["save"]);

const save = () => {
  formRef.value?.validate().then((resp: any) => {
    if (resp?.valid) {
      emit("save", form.value);
      dialog.value = false;
    }
  });
};
</script>
