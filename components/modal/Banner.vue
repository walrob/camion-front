<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="form.id ? 'Editar ' : 'Nuevo ' + props.title">
        <v-row>
          <v-col cols="12" class="align-self-center text-center">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="d-none"
              @change="onFileChange"
            />

            <v-img
              v-if="formImage.preview || formImage.url"
              :src="
                formImage.preview ||
                (formImage.url && returnUrlImg(formImage.url))
              "
              width="260"
              height="120"
              cover
              class="cursor-pointer rounded-lg elevation-2 mx-auto"
              @click="fileInput?.click()"
            />
            <v-avatar
              v-else
              :size="100"
              class="cursor-pointer"
              @click="fileInput?.click()"
            >
              <img src="/images/avatar-2.png" :height="100" alt="banner" />
            </v-avatar>
          </v-col>
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
            <v-label class="font-weight-bold mb-1">Tamaño de pantalla</v-label>
            <v-radio-group v-model="form.isMobile" inline hide-details>
              <v-radio label="Celular" :value="true" />
              <!-- 1722 x 1310 -->
              <v-radio label="Computadora" :value="false" />
              <!-- 2620 x 1110 -->
            </v-radio-group>
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
import type { Banner } from "~/types/project";
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { returnUrlImg } from "~/composables/functions";
import { useValidations } from "~/composables/useValidations";
const r = useValidations();

const props = defineProps({
  data: {
    type: Object as () => Banner,
    default: {
      id: "",
      name: "",
      imageUrl: undefined,
      isActive: true,
    },
  },
  title: {
    type: String,
    default: "Banner",
  },
});

const form = ref<Banner>({ ...props.data });
const dialog = defineModel<boolean>();
const dataRef = toRef(props, "data");

const formValid = ref(true);
const formRef = ref();

watch(dataRef, (newValue) => {
  formImage.value = {
    file: null,
    preview: "",
    url: "",
  };
  form.value = { ...newValue };
  formImage.value.url = form.value.imageUrl;
});

const emit = defineEmits(["save"]);

const fileInput = ref<HTMLInputElement | null>(null);

const formImage = ref<any>({
  file: null,
  preview: "",
  url: "",
});

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  formImage.value.file = file;

  // preview rápido sin base64 (más liviano)
  formImage.value.preview = URL.createObjectURL(file);
};

const save = () => {
  formRef.value?.validate().then((resp: any) => {
    if (resp?.valid) {
      emit("save", form.value, formImage.value.file);
      dialog.value = false;
    }
  });
};
</script>
