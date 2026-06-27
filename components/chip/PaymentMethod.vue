<script setup lang="ts">
import { PaymentMethod } from "~/types/enums";

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
  <v-chip
    v-if="data === PaymentMethod.MERCADOPAGO"
    :size="size"
    color="primary"
  >
    Mercado Pago
  </v-chip>
  <v-chip
    v-else-if="data === PaymentMethod.TRANSFER"
    :size="size"
    color="warning"
  >
    Transferencia
  </v-chip>
  <v-chip v-else :size="size" color="success"> Efectivo </v-chip>
</template>
