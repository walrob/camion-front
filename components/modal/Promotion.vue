<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="form.id ? 'Editar ' : 'Nueva ' + props.title">
        <v-row>
          <v-col cols="12" class="text-center">
            <v-avatar
              :size="100"
              class="cursor-pointer"
              @click="openModalCropper = true"
            >
              <v-img
                v-if="formImage.base64 || formImage.url"
                :src="formImage.base64 || returnUrlImg(formImage.url)"
              />
              <img v-else src="/images/avatar-2.png" height="100" />
            </v-avatar>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Nombre</v-label>
            <v-text-field
              v-model="form.name"
              variant="outlined"
              density="compact"
              :rules="[r.isRequired]"
              hide-details
            />
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Descripción</v-label>
            <v-textarea
              v-model="form.description"
              variant="outlined"
              density="compact"
              maxlength="2000"
              counter
              rows="3"
              auto-grow
              hide-details
            />
          </v-col>
          <v-col cols="6">
            <v-label class="font-weight-bold mb-1">Tipo</v-label>
            <v-select
              v-model="form.type"
              :items="promotionTypes"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              :rules="[r.isRequired]"
            />
          </v-col>
          <v-col cols="6">
            <v-label class="font-weight-bold mb-1">
              {{ labelValue(form.type) }}
            </v-label>
            <v-text-field
              v-model.number="form.value"
              type="number"
              variant="outlined"
              density="compact"
              :prefix="form.type === PromotionType.FIXED ? '$' : undefined"
              :suffix="form.type === PromotionType.PERCENTAGE ? '%' : undefined"
              :rules="[r.isRequired]"
              hide-details
              min="0"
            />
          </v-col>
          <v-col cols="6">
            <v-label class="font-weight-bold mb-1">
              {{
                form.type === PromotionType.BUY_X_PAY_Y
                  ? "Valor X"
                  : "Cant. mínima"
              }}
            </v-label>
            <v-text-field
              v-model.number="form.minQuantity"
              type="number"
              variant="outlined"
              density="compact"
              color="primary"
              hide-details
              min="0"
              :rules="[
                form.type === PromotionType.BUY_X_PAY_Y ? r.isRequired : true,
              ]"
            />
          </v-col>
          <v-col cols="6">
            <v-label class="font-weight-bold mb-1">Límite combo</v-label>
            <v-text-field
              v-model.number="form.maxUses"
              type="number"
              variant="outlined"
              density="compact"
              color="primary"
              hide-details
              min="0"
            />
          </v-col>
          <v-col cols="6">
            <v-label class="font-weight-bold mb-1">Inicio</v-label>
            <v-text-field
              v-model="form.startDate"
              type="date"
              variant="outlined"
              density="compact"
              :rules="[r.isRequired]"
              hide-details
            />
          </v-col>
          <v-col cols="6">
            <v-label class="font-weight-bold mb-1">Fin</v-label>
            <v-text-field
              v-model="form.endDate"
              type="date"
              variant="outlined"
              density="compact"
              :rules="[r.isRequired]"
              hide-details
            />
          </v-col>
          <v-col cols="12">
            <v-switch
              v-model="form.isActive"
              label="Promoción activa"
              color="primary"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Productos</v-label>
            <v-autocomplete
              v-model="form.productIds"
              :items="products"
              item-value="id"
              item-title="name"
              chips
              multiple
              variant="outlined"
              density="compact"
              :rules="[r.isRequired]"
              hide-details
            ></v-autocomplete>
            <div
              class="text-primary text-caption cursor-pointer"
              @click="$emit('refresh')"
            >
              ¿No encontró? Haga click para actualizar el listado
            </div>
          </v-col>
        </v-row>

        <template #footer>
          <v-btn text="Cancelar" variant="text" @click="dialog = false" />
          <v-btn color="primary" variant="tonal" text="Guardar" type="submit" />
        </template>
      </UiModalCard>
    </v-form>
  </v-dialog>

  <ModalImageCropper v-model="openModalCropper" @save="newImageProfile" />
</template>

<script setup lang="ts">
import type { Promotion, Product } from "~/types/project";
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { returnUrlImg } from "~/composables/functions";
import { useValidations } from "~/composables/useValidations";
import { PromotionType } from "~/types/enums";

const r = useValidations();

const props = defineProps({
  data: {
    type: Object as () => Promotion,
    default: () => ({
      id: "",
      name: "",
      description: "",
      imageUrl: undefined,
      type: PromotionType.PERCENTAGE,
      value: 0,
      startDate: "",
      endDate: "",
      isActive: true,
      productIds: [],
      minQuantity: undefined,
      maxUses: undefined,
    }),
  },
  title: {
    type: String,
    default: "Promoción",
  },
  products: {
    type: Array as () => Product[],
    required: true,
  },
});

const dialog = defineModel<boolean>();
const form = ref<Promotion>({ ...props.data });
const formRef = ref();
const formValid = ref(true);

const emit = defineEmits(["save", "refresh"]);

const promotionTypes = [
  { label: "Porcentaje (%)", value: PromotionType.PERCENTAGE },
  { label: "Monto fijo ($)", value: PromotionType.FIXED },
  { label: "Compra X paga Y", value: PromotionType.BUY_X_PAY_Y },
];

const labelValue = (value: PromotionType) => {
  if (value === PromotionType.PERCENTAGE) {
    return "Porcentaje";
  } else if (value === PromotionType.FIXED) {
    return "Monto";
  } else {
    return "Valor Y";
  }
};

const openModalCropper = ref(false);

const formImage = ref<any>({
  base64: "",
  url: "",
});

watch(
  () => props.data,
  (val) => {
    form.value = { ...val };
    formImage.value.url = val.imageUrl;
  },
  { deep: true },
);

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
