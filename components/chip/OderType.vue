<script setup lang="ts">
import { OrderType } from "~/types/enums";

const props = defineProps({
  data: {
    type: String,
  },
  size: {
    type: String,
    default: "small",
  },
});
</script>

<template>
  <v-chip v-if="data === OrderType.DELIVERY" :size="size" color="info">
    Delivery
  </v-chip>
  <v-chip v-else :size="size" color="warning"> Retiro en local </v-chip>
</template>
