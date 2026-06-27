<script setup lang="ts">
import { PaymentStatusMp } from "~/types/enums";

const props = defineProps({
  data: {
    type: String as () => PaymentStatusMp | null | undefined,
    default: null,
  },
  size: {
    type: String,
    default: "small",
  },
});
</script>

<template>
  <v-chip v-if="data === PaymentStatusMp.PAID" :size="size" color="success">
    Pagado
  </v-chip>
  <v-chip
    v-else-if="data === PaymentStatusMp.PENDING"
    :size="size"
    color="warning"
  >
    Pendiente
  </v-chip>
  <v-chip
    v-else-if="data === PaymentStatusMp.REFUNDED"
    :size="size"
    color="warning"
  >
    Devuelto
  </v-chip>
  <v-chip
    v-else-if="data === PaymentStatusMp.REJECTED"
    :size="size"
    color="error"
  >
    Rechazado
  </v-chip>
  <v-chip
    v-else-if="data === PaymentStatusMp.CANCELED"
    :size="size"
    color="error"
  >
    Cancelado
  </v-chip>
  <v-chip
    v-else-if="data === PaymentStatusMp.TO_REINTEGRATE"
    :size="size"
    color="info"
  >
    Pendiente a reintegrar
  </v-chip>
  <v-chip v-else :size="size" color="warning"> Pendiente </v-chip>
</template>
