<template>
  <ResponsiveTable
    :headers="headersFiltered"
    :items="data"
    fixed-header
    :loading="loading"
  >
    <template v-slot:item.status="{ item }">
      <div class="d-flex">
        <ChipStatusHistory :data="item.statusHistory" />
        <v-tooltip
          v-if="user.id === item.userId && item.statusHistory.length === 1"
          location="top"
          text="Cancelar compra"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              size="x-small"
              variant="text"
              color="error"
              v-bind="props"
              @click="$emit('cancel', item)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </template>

    <template v-slot:item.orderType="{ item }">
      <ChipOderType :data="item.orderType" />
    </template>

    <template v-slot:item.date="{ item }">
      {{ formatDateLocal(item.createdAt) }}
    </template>

    <template v-slot:item.price="{ item }">
      {{ formatCurrencyARS(item.totalAmount) }}
    </template>

    <!-- <template v-slot:item.discount="{ item }">
      {{ formatCurrencyARS(item.discountAmount) }}
    </template> -->

    <template v-slot:item.address="{ item }">
      <div v-if="item.userAddress">{{ item.userAddress.street }}</div>
      <div v-if="item.userAddress" class="text-caption text-textSecondary">
        {{ item.userAddress.city }}
      </div>
    </template>

    <template v-slot:item.delivery="{ item }">
      <div>{{ formatDateLocalLarge(item.scheduledDate) }}</div>
      <div v-if="item.deliverySlot" class="text-caption text-textSecondary">
        {{ item.deliverySlot.timeFrom }} -
        {{ item.deliverySlot.timeTo }}
      </div>
    </template>

    <template v-slot:bottom>
      <div class="text-center pt-3">
        <v-pagination
          v-model="page"
          :length="pagination.totalPages"
          density="compact"
          total-visible="5"
        ></v-pagination>
      </div>
    </template>

    <template v-slot:item.paymentStatus="{ item }">
      <ChipStatusPayment
        v-if="item.method === PaymentMethod.MERCADOPAGO"
        :data="item.payment?.status"
      />
    </template>

    <template v-slot:item.actions="{ item }">
      <v-tooltip
        v-if="item.statusHistory.length > 1"
        location="top"
        text="Ver datos"
      >
        <template v-slot:activator="{ props }">
          <router-link
            :to="`/admin/pedidos/${item.id}`"
            custom
            v-slot="{ navigate, href }"
          >
            <v-btn
              icon
              variant="text"
              size="small"
              v-bind="props"
              :href="href"
              @click="navigate"
            >
              <ListDetailsIcon size="20" stroke-width="1.5" />
            </v-btn>
          </router-link>
        </template>
      </v-tooltip>
      <v-tooltip location="top" text="Cambiar estado">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            v-bind="props"
            :disabled="disabledChange(item)"
            @click="$emit('new-status', item)"
          >
            <StatusChangeIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <!-- 📱 Slot mobile-item -->
    <template #mobile-item="{ item }">
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Fecha: </strong>
        {{ formatDateLocal(item.createdAt) }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Estado: </strong>
        <div class="d-flex">
          <ChipStatusHistory :data="item.statusHistory" />
          <v-btn
            v-if="user.id === item.userId && item.statusHistory.length === 1"
            icon
            size="x-small"
            variant="text"
            color="error"
            @click="$emit('cancel', item)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong v-if="item.orderType === OrderType.DELIVERY">Entrega: </strong>
        <strong v-else>Retiro: </strong>
        <span>{{ formatDateLocalLarge(item.scheduledDate) }}</span>
        <span
          v-if="item.deliverySlot"
          class="text-caption text-textSecondary ml-2"
        >
          {{ item.deliverySlot.timeFrom }} -
          {{ item.deliverySlot.timeTo }}
        </span>
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Precio: </strong>
        {{ formatCurrencyARS(item.totalAmount) }}
      </div>
    </template>
  </ResponsiveTable>
</template>

<script setup lang="ts">
import { StatusChangeIcon, ListDetailsIcon } from "vue-tabler-icons";
import type { Order } from "~/types/project";
import { OrderStatus, OrderType, PaymentMethod, type Pagination } from "~/types/enums";

const props = defineProps({
  data: {
    type: Array as () => Order[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object as () => Pagination,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const user = useAuth();

const headers = [
  { title: "", value: "actions", minWidth: "100px" },
  { title: "Fecha", value: "date" },
  { title: "Tipo", value: "orderType" },
  { title: "Dirección", value: "address" },
  { title: "Entrega/Retiro", value: "delivery" },
  // { title: "Descuento", value: "discount" },
  { title: "Precio", value: "price" },
  { title: "Estado", value: "status" },
  { title: "Pago MP", value: "paymentStatus" },
];

const emit = defineEmits(["change-pagination", "new-status", "cancel"]);

const headersFiltered = computed(() =>
  props.isAdmin
    ? headers
    : headers.filter((x) => x.value !== "actions" && x.value !== "paymentStatus"),
);
const page = computed({
  get() {
    return props.pagination.currentPage;
  },
  set(newValue) {
    const payload = {
      ...props.pagination,
      currentPage: newValue,
    };
    emit("change-pagination", payload);
  },
});

const disabledChange = (value: Order) => {
  const historyOrder = value.statusHistory ? [...value.statusHistory] : [];
  const history = historyOrder.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );
  if (history.length) {
    const status = history[0].status;
    if (status === OrderStatus.UNSENT) return true;
    if (status === OrderStatus.CANCELLED) return true;
    if (status === OrderStatus.DELIVERED) return true;
    if (status === OrderStatus.PICKED_UP) return true;
    return false;
  }
  return true;
};
</script>

<style scoped></style>
