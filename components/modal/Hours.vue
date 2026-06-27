<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="title">
        <v-row>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Día de la semana</v-label>
            <div class="grid-days">
              <v-checkbox
                v-for="d in daysOfWeek"
                :key="d.value"
                v-model="selected"
                :label="d.label"
                :value="d.value"
                density="compact"
                hide-details
              />
            </div>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Seleccionar Desde</v-label>
            <v-text-field
              v-model="form.timeFrom"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              type="time"
              :rules="[r.isRequired]"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Seleccionar Hasta</v-label>
            <v-text-field
              v-model="form.timeTo"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              type="time"
              :rules="[r.isRequired]"
            ></v-text-field>
          </v-col>
        </v-row>

        <template #footer>
          <v-btn text="Cancelar" variant="text" @click="dialog = false"></v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="!selected.length"
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
import type { DeliverySlot } from "~/types/project";
const r = useValidations();

const props = defineProps({
  title: {
    type: String,
    default: "Editar",
  },
  data: {
    type: Object as () => DeliverySlot,
    default: {
      id: "",
      // dayOfWeek: 1,
      daysOfWeek: [],
      timeFrom: "",
      timeTo: "",
      isEnabled: true,
    },
  },
});

const form = ref<DeliverySlot>({ ...props.data });
const dataRef = toRef(props, "data");
const selected: Ref<number[]> = ref([]);

const daysOfWeek = [
  // Index de JS 0=domingo, 1=lunes...
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
  { label: "Dom", value: 0 },
];

watch(dataRef, (newValue) => {
  form.value = { ...newValue };
  if (newValue.dayOfWeek) {
    selected.value = [newValue.dayOfWeek];
  } else {
    selected.value = [];
  }
});

const dialog = defineModel<boolean>();

const formValid = ref(true);
const formRef = ref();

const emit = defineEmits(["save"]);

const save = () => {
  formRef.value?.validate().then((resp: any) => {
    if (resp?.valid) {
      form.value.daysOfWeek = selected.value;
      emit("save", form.value);
      dialog.value = false;
    }
  });
};
</script>

<style scoped>
.grid-days {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
}
</style>
