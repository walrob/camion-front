<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="form.id ? 'Editar ' : 'Nuevo ' + props.title">
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
            <v-label class="font-weight-bold mb-1">Categoría</v-label>
            <v-select
              v-model="form.categoryId"
              :items="categories"
              item-value="id"
              item-title="name"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              :loading="loading"
              :rules="[r.isRequired]"
            >
            </v-select>
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
            <v-label class="font-weight-bold mb-1">Descripción</v-label>
            <v-textarea
              v-model="form.description"
              variant="outlined"
              color="primary"
              density="compact"
              maxlength="255"
              counter
              rows="2"
              auto-grow
              hide-details
            ></v-textarea>
          </v-col>
          <v-col :cols="!form.id ? 6 : 12">
            <v-label class="font-weight-bold mb-1">Precio</v-label>
            <v-text-field
              v-model.number="form.price"
              type="number"
              variant="outlined"
              density="compact"
              color="primary"
              hide-details
              min="0"
              prefix="$"
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col v-if="!form.id" cols="6">
            <v-label class="font-weight-bold mb-1">Stock inicial</v-label>
            <v-text-field
              v-model.number="form.quantity"
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
  <ModalImageCropper v-model="openModalCropper" @save="newImageProfile" />
</template>

<script setup lang="ts">
import type { Product } from "~/types/project";
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { returnUrlImg } from "~/composables/functions";
import { useValidations } from "~/composables/useValidations";
const r = useValidations();

const props = defineProps({
  data: {
    type: Object as () => Product,
    default: {
      id: "",
      name: "",
      description: "",
      imageUrl: undefined,
      isActive: true,
      price: 0,
      categoryId: "",
      quantity: 0,
    },
  },
  title: {
    type: String,
    default: "Producto",
  },
});

import { useCategoryStore } from "@/stores/category";
const categoryStore = useCategoryStore();
const { categories, loading } = storeToRefs(categoryStore);

onMounted(async () => {
  await categoryStore.getDataCategories();
});

const form = ref<Product>({ ...props.data });
const dialog = defineModel<boolean>();
const dataRef = toRef(props, "data");

const formValid = ref(true);
const formRef = ref();

watch(dataRef, (newValue) => {
  // reset
  formImage.value.file = "";
  formImage.value.base64 = "";
  // load
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
