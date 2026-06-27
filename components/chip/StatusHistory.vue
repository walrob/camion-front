<script setup lang="ts">
import { OrderStatus } from "~/types/enums";
import type { OrderStatusHistory } from "~/types/project";

const props = defineProps({
  data: {
    type: Array as () => OrderStatusHistory[],
  },
  size: {
    type: String,
    default: "small",
  },
});

const statusConfig: Record<OrderStatus, { color: string; text: string }> = {
  [OrderStatus.UNSENT]: { color: "grey", text: "Sin finalizar" },
  [OrderStatus.REQUESTED]: { color: "info", text: "Solicitado" },
  [OrderStatus.PREPARED]: { color: "warning", text: "Preparado" },
  [OrderStatus.SENT]: { color: "primary", text: "Enviado" },
  [OrderStatus.DELIVERED]: { color: "success", text: "Entregado" },
  [OrderStatus.PICKED_UP]: { color: "success", text: "Retirado" },
  [OrderStatus.CANCELLED]: { color: "error", text: "Cancelado" },
};

const item = computed(() => {
  if (!props.data?.length) return null;
  return [...props.data].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  )[0];
});

const config = computed(() =>
  item.value ? statusConfig[item.value.status] : null,
);
</script>

<template>
  <v-chip v-if="config" :size="size" :color="config.color">
    {{ config.text }}
  </v-chip>
</template>
