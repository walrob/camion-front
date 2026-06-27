<script setup lang="ts">
import { useValidations } from "~/composables/useValidations";
import { OrderType, PaymentMethod } from "~/types/enums";

import { useGeneralStore } from "@/stores/general";
const generalStore = useGeneralStore();

interface BankInfo {
  titular: string;
  cbu: string;
  cuil: string;
  alias: string;
}

const config = useRuntimeConfig();

const bankInfo: BankInfo = {
  cbu: config.public.bankInfoCbu,
  alias: config.public.bankInfoAlias,
  cuil: config.public.bankInfoCuil,
  titular: config.public.bankInfoTitular,
};

const props = defineProps({
  paymentMethod: {
    type: Object as () => PaymentMethod,
    default: "",
  },
  shippingType: {
    type: Object as () => OrderType,
    default: "",
  },
  cuil: {
    type: String,
    default: "",
  },
  titular: {
    type: String,
    default: "",
  },
  guestMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  "update:paymentMethod": [value: PaymentMethod];
  "update:cuil": [value: string];
  "update:titular": [value: string];
}>();

const r = useValidations();

const localPaymentMethod = computed({
  get: () => props.paymentMethod,
  set: (val) => emit("update:paymentMethod", val),
});

const localCuil = computed({
  get: () => props.cuil,
  set: (val) => emit("update:cuil", val),
});

const localTitular = computed({
  get: () => props.titular,
  set: (val) => emit("update:titular", val),
});

const copyLink = async (link: string) => {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      generalStore.setSnackbar({
        color: "success",
        message: "Datos copiados",
      });
    })
    .catch((err) => {
      generalStore.setSnackbar({
        color: "error",
        message: "Error al copiar",
      });
    });
};
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h6 font-weight-bold mb-4">
      Método de Pago
    </v-card-title>

    <!-- Modo guest: solo Mercado Pago -->
    <div v-if="guestMode" class="px-4">
      <div class="mb-4 text-caption text-textSecondary">
        El único método de pago disponible es Mercado Pago. Para ver otras
        opciones y beneficios, debe estar registrado.
      </div>
      <CardButton
        :item="{
          icon: 'mdi-account-credit-card',
          name: 'Mercado Pago',
        }"
        :active="true"
        @click="localPaymentMethod = PaymentMethod.MERCADOPAGO"
      />
    </div>

    <!-- Modo autenticado: todos los métodos -->
    <div
      v-else
      class="d-flex flex-column gap-3 px-4 flex-sm-row align-center align-sm-stretch"
    >
      <CardButton
        :item="{
          icon: 'mdi-account-credit-card',
          name: 'Mercado Pago',
        }"
        :active="localPaymentMethod === PaymentMethod.MERCADOPAGO"
        @click="localPaymentMethod = PaymentMethod.MERCADOPAGO"
      />
      <CardButton
        :item="{
          icon: 'mdi-bank',
          name: 'Transferencia Bancaria',
        }"
        :active="localPaymentMethod === PaymentMethod.TRANSFER"
        @click="localPaymentMethod = PaymentMethod.TRANSFER"
      />
      <CardButton
        v-if="shippingType === OrderType.PICKUP"
        :item="{
          icon: 'mdi-account-cash',
          name: 'Pago en Local',
        }"
        :active="localPaymentMethod === PaymentMethod.CASH"
        @click="localPaymentMethod = PaymentMethod.CASH"
      />
    </div>

    <!-- Datos de transferencia -->
    <v-expand-transition>
      <div
        v-show="localPaymentMethod === PaymentMethod.TRANSFER"
        class="mt-4 pa-4 bg-grey-100 rounded"
      >
        <!-- DESTINATARIO -->
        <v-card v-if="bankInfo" variant="outlined" class="mb-4 pa-3 card-style">
          <v-label class="font-weight-bold mb-2 d-block">
            Datos para transferir (Destinatario)
          </v-label>
          <v-list class="bg-transparent">
            <v-list-item class="px-4 px-md-8">
              <strong>CBU:</strong>
              <span class="ml-2">{{ bankInfo.cbu }}</span>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="copyLink(bankInfo.cbu)"
              >
                <CopyIcon size="20" stroke-width="1.5" />
              </v-btn>
            </v-list-item>
            <v-list-item class="px-4 px-md-8">
              <strong>Alias:</strong>
              <span class="ml-2">{{ bankInfo.alias }}</span>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="copyLink(bankInfo.alias)"
              >
                <CopyIcon size="20" stroke-width="1.5" />
              </v-btn>
            </v-list-item>
            <v-list-item class="px-4 px-md-8">
              <strong>Titular:</strong>
              <span class="ml-2">{{ bankInfo.titular }}</span>
            </v-list-item>
            <v-list-item class="px-4 px-md-8">
              <strong>CUIL:</strong>
              <span class="ml-2">{{ bankInfo.cuil }}</span>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- EMISOR -->
        <v-card variant="outlined" class="pa-3 card-style">
          <v-label class="font-weight-bold mb-4 d-block">
            Datos de quien realiza la transferencia
          </v-label>
          <v-label class="mb-2 d-block"> Nombre y Apellido </v-label>
          <v-text-field
            v-model="localTitular"
            variant="outlined"
            color="primary"
            placeholder="Ej: Juan Perez"
            density="compact"
            :rules="[r.isRequired]"
          />
          <v-label class="mb-2 d-block"> DNI/CUIL </v-label>
          <v-text-field
            v-model="localCuil"
            variant="outlined"
            color="primary"
            placeholder="Ej: 12345678"
            density="compact"
            :rules="[r.isRequired]"
          />
        </v-card>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
.card-style {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
