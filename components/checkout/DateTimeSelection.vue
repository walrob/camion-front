<script setup lang="ts">
import type { DeliverySlot, NonWorkingDay } from "~/types/project";
import { useNonWorkingDayStore } from "@/stores/nonWorkingDay";
import { useDeliverySlotStore } from "@/stores/deliverySlot";
import { OrderType } from "~/types/enums";

const nonWorkingDayStore = useNonWorkingDayStore();
const deliverySlotStore = useDeliverySlotStore();

const { days, loading } = storeToRefs(nonWorkingDayStore);
const { deliverySlots, loading: loadingSlot } = storeToRefs(deliverySlotStore);

interface Props {
  selectedDate: string;
  selectedTime: DeliverySlot | undefined;
  shippingType: OrderType;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:selectedDate": [string];
  "update:selectedTime": [DeliverySlot | undefined];
}>();

onMounted(async () => {
  await Promise.all([
    nonWorkingDayStore.getDataDays(),
    deliverySlotStore.getDataSlots(),
  ]);
});

const formatDateInput = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const todayDate = formatDateInput(new Date());

const localSelectedDate = computed({
  get: () => props.selectedDate,
  set: (val: string) => emit("update:selectedDate", val),
});

const localSelectedTime = computed({
  get: () => props.selectedTime,
  set: (val: DeliverySlot | undefined) => emit("update:selectedTime", val),
});

const nonWorkingSet = computed(
  () => new Set(days.value.map((d: NonWorkingDay) => d.date)),
);

const allowedDates = (date: unknown) => {
  const d = String(date);
  if (!d) return false;
  if (d < todayDate) return false;
  if (nonWorkingSet.value.has(d)) return false;
  return true;
};

const availableTimes = computed<DeliverySlot[]>(() => {
  if (!localSelectedDate.value) return [];

  const dayOfWeek = new Date(localSelectedDate.value).getDay(); // 0-6

  return deliverySlots.value
    .filter((slot: DeliverySlot) => slot.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.timeFrom.localeCompare(b.timeFrom));
  // .map((slot) => `${slot.timeFrom} a ${slot.timeTo}`);
});

watch(localSelectedDate, () => {
  localSelectedTime.value = undefined;
});

const isLoading = computed(() => loading.value || loadingSlot.value);
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h6 font-weight-bold mb-4">
      Selecciona Fecha y Hora de
      {{ shippingType === OrderType.DELIVERY ? "Entrega" : "Retiro" }}
    </v-card-title>

    <!-- Skeleton -->
    <v-skeleton-loader v-if="isLoading" type="card" height="150" />

    <!-- Contenido -->
    <v-row v-else>
      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-2">Fecha</v-label>
        <v-date-picker
          v-model="localSelectedDate"
          :allowed-dates="allowedDates"
          :min="todayDate"
          color="primary"
          weekday-format="short"
          hide-header
        >
          <template
            v-slot:controls="{ disabled, nextMonth, prevMonth, monthYearText }"
          >
            <v-btn
              :disabled="disabled.includes('prev-month')"
              color="primary"
              icon="$prev"
              @click="prevMonth"
            ></v-btn>
            <v-spacer></v-spacer>
            <div class="text-center">
              <div class="font-weight-bold">
                {{ monthYearText.toUpperCase() }}
              </div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
              :disabled="disabled.includes('next-month')"
              color="primary"
              icon="$next"
              @click="nextMonth"
            ></v-btn>
          </template>
        </v-date-picker>
      </v-col>

      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-2">Hora</v-label>
        <v-select
          v-model="localSelectedTime"
          :items="availableTimes"
          :disabled="!localSelectedDate || availableTimes.length === 0"
          :no-data-text="'No hay horarios disponibles'"
          variant="outlined"
          density="compact"
          return-object
        >
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item
              v-bind="itemProps"
              :title="`${item.raw.timeFrom} - ${item.raw.timeTo}`"
            ></v-list-item>
          </template>
          <template v-slot:selection="{ item, index }">
            <v-list-item
              :title="`${item.raw.timeFrom} - ${item.raw.timeTo}`"
            ></v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>
  </v-card>
</template>
