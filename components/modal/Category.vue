<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="form.id ? 'Editar ' : 'Nueva ' + props.title">
        <v-row>
          <v-col cols="12" class="align-self-center text-center">
            <v-avatar
              :size="100"
              class="cursor-pointer"
              @click="openModalCropper = true"
            >
              <v-img
                v-if="formImage.base64 || formImage.url"
                :src="formImage.base64 || returnUrlImg(formImage.url)"
              />
              <img v-else src="/images/avatar-2.png" :height="100" alt="user" />
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
  <ModalImageCropper v-model="openModalCropper" @save="newImageProfile" />
</template>

<script setup lang="ts">
import type { Category } from "~/types/project";
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { returnUrlImg } from "~/composables/functions";
import { useValidations } from "~/composables/useValidations";
const r = useValidations();

const props = defineProps({
  data: {
    type: Object as () => Category,
    default: {
      id: "",
      name: "",
      imageUrl: undefined,
      isActive: true,
    },
  },
  title: {
    type: String,
    default: "Categoría",
  },
});

const form = ref<Category>({ ...props.data });
const dialog = defineModel<boolean>();
const dataRef = toRef(props, "data");

const formValid = ref(true);
const formRef = ref();

watch(dataRef, (newValue) => {
  formImage.value = {
    base64: "",
    url: "",
  };
  form.value = { ...newValue };
  formImage.value.url = form.value.imageUrl;
});

const emit = defineEmits(["save"]);

const openModalCropper = ref(false);
const formImage = ref<any>({
  base64: "",
  url: "",
});

const newImageProfile = (value: any) => {
  // reset
  formImage.value.file = "";
  formImage.value.base64 = "";
  // load
  formImage.value.file = value.file;
  formImage.value.base64 = value.base64;
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
