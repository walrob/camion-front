<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard title="Nuevo archivo">
        <v-row>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Nombre</v-label>
            <v-text-field
              v-model="form.name"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              :rules="[r.isRequired]"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Adjuntar archivo</v-label>
            <!-- <v-file-input
              v-model="form.file"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              clearable
              :rules="[r.isRequired]"
              show-size
            ></v-file-input> -->
            <v-file-upload
              v-model="form.file"
              title="Arrastre y suelte el archivo aquí"
              density="compact"
              clearable
              @update:modelValue="validateFile"
            ></v-file-upload>
            <div v-if="fileError" class="text-error text-caption">
              {{ fileError }}
            </div>
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
import type { AttachedFileApi } from "~/types/clinical";
import { useValidations } from "~/composables/useValidations";
const r = useValidations();

const form = ref<AttachedFileApi>({
  name: "",
  file: undefined,
  animalId: "",
  clinicalHistoryId: "",
});
const dialog = defineModel<boolean>();

watch(dialog, (newValue) => {
  if (newValue)
    form.value = {
      name: "",
      file: undefined,
      animalId: "",
      clinicalHistoryId: "",
    };
});

const formValid = ref(true);
const formRef = ref();
const fileError = ref<string | null>(null);
const emit = defineEmits(["save"]);

const save = () => {
  formRef.value?.validate().then((resp: any) => {
    if (resp?.valid && !fileError.value) {
      emit("save", form.value);
      dialog.value = false;
    }
  });
};

const validateFile = (file: any) => {
  fileError.value = null;
  if (!file) return;

  const MAX_MB = 8;
  if (file.size / 1024 / 1024 > MAX_MB) {
    fileError.value = `El archivo no puede superar ${MAX_MB} MB`;
    form.value.file = undefined;
    return;
  }

  // const allowed = [".png", ".jpg", ".pdf"];
  // const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  // if (!allowed.includes(ext)) {
  //   fileError.value = `Solo se permiten: ${allowed.join(", ")}`;
  //   form.value.file = undefined;
  // }
};
</script>
