<template>
  <v-row v-if="!data?.length">
    <v-col class="text-center align-center text-body-1 py-10">
      No hay datos registrados
    </v-col>
  </v-row>
  <v-row v-else>
    <v-col v-for="(item, ix) in data" :key="ix" cols="12" sm="6" lg="4">
      <v-card
        elevation="10"
        class="d-flex justify-space-between align-center pa-4"
      >
        <div>
          <div v-if="item.dayOfWeek" class="text-subtitle-1">
            {{ daysOfWeek[item.dayOfWeek] }}
          </div>
          <span>{{ item.timeFrom }}</span> -
          <span>{{ item.timeTo }}</span>
        </div>
        <div class="d-flex">
          <v-btn
            variant="text"
            size="small"
            :color="item.isEnabled ? 'success' : 'error'"
            @click="changeActive(item)"
          >
            {{ item.isEnabled ? "Habilitado" : "Deshabilitado" }}
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            @click="deleteItem(item)"
          >
            <TrashIcon size="20" stroke-width="1.5" />
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>

  <ModalHours
    v-model="showDialog"
    :data="tempItem"
    title="Nuevo rango"
    @save="saveItem"
  />

  <ModalConfirm
    v-model="showDelete"
    title="Confirmar eliminación"
    @save="confirmDeleteItem"
  />
</template>

<script setup lang="ts">
import { TrashIcon } from "vue-tabler-icons";
import type { ResponseConfirm } from "~/types/enums";
import type { DeliverySlot } from "~/types/project";

const props = defineProps({
  data: {
    type: Array as () => DeliverySlot[],
    default: () => [],
  },
});

const emit = defineEmits(["save", "delete", "change"]);

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const showDialog = ref(false);
const showDelete = ref(false);
const tempItem = ref<DeliverySlot>({
  id: "",
  dayOfWeek: 1,
  timeFrom: "",
  timeTo: "",
  isEnabled: true,
});

const newItem = () => {
  tempItem.value = {
    id: "",
    dayOfWeek: 1,
    timeFrom: "",
    timeTo: "",
    isEnabled: true,
  };
  showDialog.value = true;
};

const confirmDeleteItem = (value: ResponseConfirm) => {
  if (value.resp) {
    const payload = {
      ...tempItem.value,
    };
    emit("delete", payload);
  }
};

const deleteItem = (item: DeliverySlot) => {
  tempItem.value = item;
  showDelete.value = true;
};

const saveItem = (payload: DeliverySlot) => {
  emit("save", payload);
};

const changeActive = (payload: DeliverySlot) => {
  emit("change", payload);
};

defineExpose({ newItem });
</script>

<style scoped></style>
