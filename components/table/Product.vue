<template>
  <ResponsiveTable
    :headers="headers"
    :items="data"
    fixed-header
    :loading="loading"
  >
    <template v-slot:item.name="{ item }">
      <div class="d-flex align-center justify-end justify-sm-start">
        <v-avatar v-if="item.imageUrl" :size="30" class="mr-2">
          <v-img :src="returnUrlImg(item.imageUrl)" />
        </v-avatar>
        {{ item.name }}
      </div>
    </template>

    <template v-slot:item.status="{ item }">
      <ChipStatusActive :data="item.isActive" />
    </template>

    <template v-slot:item.update="{ item }">
      {{ formatDateLocal(item.updatedAt) }}
    </template>

    <template v-slot:item.price="{ item }">
      {{ formatCurrencyARS(item.price) }}
    </template>

    <template v-slot:item.actions="{ item }">
      <v-tooltip location="top" text="Editar datos">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            v-bind="props"
            @click="$emit('edit', item)"
          >
            <EditIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-if="item.isActive" location="top" text="Desactivar">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            v-bind="props"
            @click="blockItem(item)"
          >
            <BasketOffIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-else location="top" text="Activar">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="success"
            v-bind="props"
            @click="enableItem(item)"
          >
            <BasketFilledIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-if="item.isFavorite" location="top" text="Sacar Favorito">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            v-bind="props"
            @click="removeFavorite(item)"
          >
            <HeartFilledIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-else location="top" text="Favorito">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            v-bind="props"
            @click="addFavorite(item)"
          >
            <HeartIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip location="top" text="Cambiar stock">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            v-bind="props"
            @click="$emit('edit-stock', item)"
          >
            <SwitchVerticalIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
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

    <!-- 📱 Slot mobile-item -->
    <template #mobile-item="{ item }">
      <div class="text-body-1 text-textPrimary mb-1 font-weight-bold">
        <span>Name: </span>
        {{ item.name }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Estado: </strong>
        <ChipStatusActive :data="item.isActive" />
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Precio: </strong>
        {{ formatCurrencyARS(item.price) }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Stock: </strong>
        {{ item.stock?.quantity }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Actualizado: </strong>
        {{ formatDateLocal(item.updatedAt) }}
      </div>
    </template>
  </ResponsiveTable>

  <ModalConfirm
    v-model="showConfirm"
    :title="titleConfirm"
    :description="textConfirm"
    @save="confirmSave"
  />
</template>

<script setup lang="ts">
import {
  EditIcon,
  BasketOffIcon,
  BasketFilledIcon,
  SwitchVerticalIcon,
  HeartFilledIcon,
  HeartIcon,
} from "vue-tabler-icons";
import type { Product } from "~/types/project";
import type { Pagination, ResponseConfirm } from "~/types/enums";

const props = defineProps({
  data: {
    type: Array as () => Product[],
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
});

const headers = [
  { title: "", value: "actions", minWidth: "80px" },
  { title: "Nombre", value: "name" },
  { title: "Estado", value: "status" },
  { title: "Precio", value: "price" },
  { title: "Stock", value: "stock.quantity" },
  { title: "Actualizado", value: "update" },
];

const emit = defineEmits([
  "change-pagination",
  "edit",
  "change-active",
  "change-favorite",
  "edit-stock",
]);

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

const showConfirm = ref(false);
const textConfirm = ref("");
const titleConfirm = ref("");
const productData = ref<Product | undefined>(undefined);
const productDataFav = ref<Product | undefined>(undefined);

const enableItem = (item: Product) => {
  productDataFav.value = undefined;
  productData.value = item;
  textConfirm.value = `<p>Se habilitará el producto <b>${item.name}</b></p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Habilitar producto";
  showConfirm.value = true;
};

const blockItem = (item: Product) => {
  productDataFav.value = undefined;
  productData.value = item;
  textConfirm.value = `<p>Se bloqueará el producto <b>${item.name}</b></p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Bloquear producto";
  showConfirm.value = true;
};

const addFavorite = (item: Product) => {
  productDataFav.value = item;
  productData.value = undefined;
  textConfirm.value = `<p>Se agregará al producto <b>${item.name}</b> a destacados.</p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Habilitar producto";
  showConfirm.value = true;
};

const removeFavorite = (item: Product) => {
  productDataFav.value = item;
  productData.value = undefined;
  textConfirm.value = `<p>Se sacará al producto <b>${item.name}</b> de destacados.</p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Sacar favorito";
  showConfirm.value = true;
};

const confirmSave = (value: ResponseConfirm) => {
  if (value.resp) {
    if (productData.value) emit("change-active", productData.value);
    if (productDataFav.value) emit("change-favorite", productDataFav.value);
    showConfirm.value = false;
  }
};
</script>

<style scoped></style>
