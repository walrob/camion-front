<script setup lang="ts">
import {
  formatDateLocalLarge,
  formatCurrencyARS,
} from "~/composables/functions";
import { OrderType, PaymentMethod } from "~/types/enums";
import type { DeliverySlot, OrderItem } from "~/types/project";

interface Props {
  cart: OrderItem[];
  cartTotal: number;
  shippingType: OrderType;
  selectedDate: string;
  selectedTime: DeliverySlot | undefined;
  paymentMethod: PaymentMethod;
}

defineProps<Props>();
</script>

<template>
  <v-card class="pa-6 mb-6">
    <v-card-title class="text-h6 font-weight-bold mb-4">
      Resumen de tu Pedido
    </v-card-title>

    <!-- Items del carrito -->
    <v-list class="bg-transparent mb-4">
      <v-list-subheader>Productos</v-list-subheader>
      <v-list-item
        v-for="item in cart"
        :key="item.product.id"
        class="px-0 px-sm-4 px-md-8"
        density="compact"
      >
        <v-list-item-title>
          <span class="text-body-1">
            {{ item.quantity }} x {{ item.product.name }}
          </span>
        </v-list-item-title>
        <template #append>
          <span v-if="item.itemTotal" class="text-body-1">
            {{ formatCurrencyARS(item.itemTotal) }}
          </span>
        </template>
      </v-list-item>
    </v-list>

    <!-- Envío -->
    <v-divider class="my-4" />
    <v-list class="bg-transparent mb-4">
      <v-list-subheader>Envío</v-list-subheader>
      <v-list-item class="px-0 px-sm-4 px-md-8" density="compact">
        <v-list-item-title>
          <span class="text-subtitle-1 font-weight-bold"> Tipo: </span>
          <span class="text-body-1">
            {{
              shippingType === OrderType.DELIVERY
                ? "A Domicilio"
                : "Retiro por Local"
            }}
          </span>
        </v-list-item-title>
      </v-list-item>
      <v-list-item class="px-0 px-sm-4 px-md-8" density="compact">
        <v-list-item-title>
          <span class="text-subtitle-1 font-weight-bold"> Fecha: </span>
          <span class="text-body-1">
            {{ formatDateLocalLarge(selectedDate) }}
          </span>
        </v-list-item-title>
      </v-list-item>
      <v-list-item class="px-0 px-sm-4 px-md-8" density="compact">
        <v-list-item-title>
          <span class="text-subtitle-1 font-weight-bold"> Hora: </span>
          <span class="text-body-1">
            {{ selectedTime?.timeFrom }} -
            {{ selectedTime?.timeTo }}
          </span>
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <!-- Pago -->
    <v-divider class="my-4" />
    <v-list class="bg-transparent">
      <v-list-subheader>Pago</v-list-subheader>
      <v-list-item class="px-0 px-sm-4 px-md-8" density="compact">
        <v-list-item-title>
          <span class="text-subtitle-1 font-weight-bold"> Método: </span>
          <span class="text-body-1">
            {{
              paymentMethod === PaymentMethod.MERCADOPAGO
                ? "Mercado Pago"
                : paymentMethod === PaymentMethod.TRANSFER
                  ? "Transferencia Bancaria"
                  : "Pago en Local"
            }}
          </span>
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <!-- Total -->
    <v-divider class="my-4" />
    <div class="d-flex justify-space-between align-center mb-4">
      <v-label class="text-h6 font-weight-bold">Total</v-label>
      <v-label class="text-h6 font-weight-bold">
        ${{ cartTotal.toFixed(2) }}
      </v-label>
    </div>
  </v-card>
</template>
