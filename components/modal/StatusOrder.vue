<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard title="Editar estado">
        <v-row>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Nuevo Estado</v-label>
            <v-select
              v-model="form"
              :items="orderStatusOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              color="primary"
              density="compact"
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
import { OrderStatus } from "~/types/enums";
const r = useValidations();

const props = defineProps({
  data: {
    type: String as () => OrderStatus,
    default: OrderStatus.UNSENT,
  },
});

const form = ref<OrderStatus | null>(null);
const dialog = defineModel<boolean>();

const formValid = ref(true);
const formRef = ref();

watch(dialog, (open) => {
  if (open) {
    form.value = null;
  }
});

// Transiciones permitidas desde cada estado
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.UNSENT]: [OrderStatus.REQUESTED, OrderStatus.CANCELLED],
  [OrderStatus.REQUESTED]: [OrderStatus.PREPARED, OrderStatus.CANCELLED],
  [OrderStatus.PREPARED]: [
    OrderStatus.SENT,
    OrderStatus.PICKED_UP,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SENT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.PICKED_UP]: [],
  [OrderStatus.CANCELLED]: [],
};

const orderStatusOptions = computed(() =>
  allowedTransitions[props.data]?.map((value) => ({
    label: value,
    value,
  })) ?? [],
);

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
