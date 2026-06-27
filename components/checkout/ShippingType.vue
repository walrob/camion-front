<script setup lang="ts">
import type { UserAddress } from "~/types/project";

import { useAddressStore } from "@/stores/address";
import { OrderType } from "~/types/enums";
const addressStore = useAddressStore();
const { addresses, loading } = storeToRefs(addressStore);

// Props
const props = defineProps({
  shippingType: {
    type: String as PropType<OrderType>,
    default: "delivery",
  },
  selectedAddress: {
    type: String,
    default: "",
  },
  userId: {
    type: String,
    default: "",
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  guestMode: {
    type: Boolean,
    default: false,
  },
  guestAddress: {
    type: String,
    default: "",
  },
  guestName: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits<{
  "update:shippingType": [value: OrderType];
  "update:selectedAddress": [value: string];
  "update:guestAddress": [value: string];
  "update:guestName": [value: string];
  error: [message: string];
}>();

// Estados
const showNewAddressForm = ref(false);
const newAddress = ref<UserAddress | null>(null);

onMounted(async () => {
  if (props.guestMode) return; // No cargar direcciones para guests
  await addressStore.getDataAddresses();
  if (addresses.value.length > 0 && !props.selectedAddress) {
    emit("update:selectedAddress", addresses.value[0].id);
  }
});

const openNewAddress = () => {
  newAddress.value = null;
  showNewAddressForm.value = true;
};

const saveAddress = async (value: UserAddress) => {
  const resp = await addressStore.newAddress(value);
  await addressStore.getDataAddresses();
  emit("update:selectedAddress", resp.id);
  showNewAddressForm.value = false;
  newAddress.value = null;
};

const localShippingType = computed({
  get: () => props.shippingType,
  set: (val) => emit("update:shippingType", val),
});

const localSelectedAddress = computed({
  get: () => props.selectedAddress,
  set: (val) => emit("update:selectedAddress", val),
});

const localGuestAddress = computed({
  get: () => props.guestAddress,
  set: (val) => emit("update:guestAddress", val),
});

const localGuestName = computed({
  get: () => props.guestName,
  set: (val) => emit("update:guestName", val),
});
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h6 font-weight-bold mb-4">
      Tipo de Envío
    </v-card-title>

    <div class="d-flex gap-3">
      <CardButton
        :item="{
          icon: 'mdi-truck',
          name: 'Envío a Domicilio',
        }"
        :active="localShippingType === OrderType.DELIVERY"
        @click="localShippingType = OrderType.DELIVERY"
      />
      <CardButton
        :item="{
          icon: 'mdi-store',
          name: 'Retirar por Local',
        }"
        :active="localShippingType === OrderType.PICKUP"
        @click="localShippingType = OrderType.PICKUP"
      />
    </div>

    <!-- MODO GUEST -->
    <v-expand-transition v-if="guestMode && !blocked">
      <div v-show="localShippingType === OrderType.DELIVERY" class="mt-6">
        <v-label class="font-weight-bold mb-3"> Dirección de Envío </v-label>
        <v-text-field
          v-model="localGuestAddress"
          variant="outlined"
          color="primary"
          density="compact"
          placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
          :rules="[(v: string) => !!v || 'Ingresá una dirección de envío']"
        />
      </div>
    </v-expand-transition>
    <v-expand-transition v-if="guestMode && !blocked">
      <div v-show="localShippingType === OrderType.PICKUP" class="mt-6">
        <v-label class="font-weight-bold mb-3"> Nombre de quien retira </v-label>
        <v-text-field
          v-model="localGuestName"
          variant="outlined"
          color="primary"
          density="compact"
          placeholder="Ej: Pedro Perez"
          :rules="[(v: string) => !!v || 'Ingresá un nombre']"
        />
      </div>
    </v-expand-transition>

    <!-- MODO AUTENTICADO -->
    <v-expand-transition v-if="!guestMode && !blocked">
      <div v-show="localShippingType === OrderType.DELIVERY" class="mt-6">
        <v-label class="font-weight-bold mb-3"> Dirección de Envío </v-label>

        <!-- Lista de direcciones guardadas -->
        <div v-if="addresses.length > 0 && !showNewAddressForm" class="mb-4">
          <v-radio-group v-model="localSelectedAddress">
            <div v-for="address in addresses" :key="address.id" class="mb-3">
              <v-radio :value="address.id">
                <template #label>
                  <div class="ml-2">
                    <div class="font-weight-bold">
                      {{ address.street }}
                    </div>
                    <div class="text-caption">
                      {{ address.city }}, {{ address.province }}
                    </div>
                  </div>
                </template>
              </v-radio>
            </div>
          </v-radio-group>
        </div>

        <!-- Botón para agregar nueva dirección -->
        <div class="mb-4 text-right">
          <v-btn
            v-if="!showNewAddressForm"
            variant="text"
            color="primary"
            @click="openNewAddress"
          >
            <v-icon left>mdi-plus</v-icon>
            Agregar Nueva Dirección
          </v-btn>
        </div>

        <!-- Formulario de nueva dirección -->
        <v-expand-transition>
          <div
            v-show="showNewAddressForm"
            class="mt-4 pa-4 bg-grey-100 rounded"
          >
            <FormAddressWithGeo v-model="newAddress" @submit="saveAddress">
              <template #actions>
                <div
                  class="d-flex gap-2 justify-md-space-between mt-4 px-3 w-100"
                >
                  <v-btn
                    text="Cancelar"
                    variant="text"
                    @click="showNewAddressForm = false"
                  ></v-btn>
                  <v-btn
                    color="primary"
                    variant="tonal"
                    text="Guardar Dirección"
                    type="submit"
                    :loading="loading"
                  ></v-btn>
                </div>
              </template>
            </FormAddressWithGeo>
          </div>
        </v-expand-transition>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped></style>
