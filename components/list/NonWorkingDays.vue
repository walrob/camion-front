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
          <div>{{ formatDateLocalLarge(item.date) }}</div>
          <div class="text-caption">{{ item.reason }}</div>
        </div>
        <div class="d-flex">
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

  <ModalDate
    v-model="showDialog"
    :data="tempHolidayItem"
    title="Nuevo día no laboral"
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
import { formatDateLocalLarge } from "~/composables/functions";
import type { ResponseConfirm } from "~/types/enums";
import type { NonWorkingDay } from "~/types/project";

const props = defineProps({
  data: {
    type: Array as () => NonWorkingDay[],
    default: () => [],
  },
});

const emit = defineEmits(["save", "delete"]);

const showDialog = ref(false);
const showDelete = ref(false);
const tempHolidayItem = ref<NonWorkingDay>({
  date: "",
  id: "",
  reason: undefined,
});

const newItem = () => {
  tempHolidayItem.value = {
    date: "",
    id: "",
    reason: undefined,
  };
  showDialog.value = true;
};

const confirmDeleteItem = (value: ResponseConfirm) => {
  if (value.resp) {
    const payload = {
      ...tempHolidayItem.value,
    };
    emit("delete", payload);
  }
};

const deleteItem = (item: NonWorkingDay) => {
  tempHolidayItem.value = item;
  showDelete.value = true;
};

const saveItem = (payload: NonWorkingDay) => {
  emit("save", payload);
};

defineExpose({ newItem });
</script>

<style scoped></style>
