<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard title="Editar stock">
        <v-row>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Nuevo Stock</v-label>
            <v-text-field
              v-model.number="form"
              type="number"
              variant="outlined"
              density="compact"
              color="primary"
              hide-details
              min="0"
              step="1"
              :rules="[r.isRequired]"
            />
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
const r = useValidations();

const props = defineProps({
  data: {
    type: Number,
    default: 0,
  },
});

const form = ref<number>(props.data);
const dialog = defineModel<boolean>();
const dataRef = toRef(props, "data");

const formValid = ref(true);
const formRef = ref();

watch(dataRef, (newValue) => {
  form.value = newValue;
});

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
