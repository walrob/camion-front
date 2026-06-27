<template>
  <v-dialog v-model="dialog" max-width="800">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard title="Cambiar Imagen">
        <v-row dense>
          <v-col cols="12" class="text-center">
            <v-btn
              color="primary"
              variant="tonal"
              :text="image ? 'Cambiar imagen' : 'Buscar imagen'"
              @click="triggerFileSelect"
            ></v-btn>
            <input
              ref="fileInput"
              class="d-none"
              type="file"
              accept="image/*"
              @change="onFileChange"
            />
          </v-col>

          <v-col v-if="image" cols="12" md="8">
            <cropper
              :src="image"
              :stencil-props="{ aspectRatio: 1 }"
              :auto-zoom="true"
              :background="true"
              :guides="true"
              @change="onCrop"
            />
          </v-col>

          <v-col
            v-if="croppedImage"
            cols="12"
            md="4"
            class="text-center align-content-center"
          >
            <img
              :src="croppedImage"
              alt="Preview"
              style="max-width: 150px; border-radius: 50%"
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
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const dialog = defineModel<boolean>();

const image = ref<string | null>(null);
const croppedImage = ref<string | null>(null);
const formValid = ref(true);
const formRef = ref();
const fileInput = ref<HTMLInputElement | null>(null);

watch(dialog, (newValue) => {
  if (newValue) {
    image.value = null;
    croppedImage.value = null;
  }
});

function triggerFileSelect() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      image.value = ev.target?.result as string;
    };
    reader.readAsDataURL(files[0]);
  }
}

const croppedFile = ref<File | null>(null);

async function onCrop({ canvas }: any) {
  if (canvas) {
    croppedImage.value = canvas.toDataURL();
    croppedFile.value = await getFileFromCanvas(canvas, "profile.png");
  }
}

function getFileFromCanvas(
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], fileName, { type: blob.type });
        resolve(file);
      }
    }, "image/png");
  });
}

const emit = defineEmits(["save"]);

const save = () => {
  emit("save", {
    file: croppedFile.value,
    base64: croppedImage.value,
  });
  dialog.value = false;
};
</script>
