<template>
  <div class="products-list">
    <v-card
      v-for="item in productItems"
      :key="item.product.id"
      class="product-list-item mb-3 rounded-xl overflow-hidden"
      elevation="0"
    >
      <v-row no-gutters class="h-100" align="center">
        <!-- Imagen -->
        <v-col cols="4" md="3" class="product-list-img-col">
          <div class="product-list-img-wrapper">
            <v-img
              v-if="item.product.imageUrl"
              :src="returnUrlImg(item.product.imageUrl)"
              :alt="item.product.name"
              :height="smAndDown ? 110 : 150"
              cover
              class="product-list-img"
            />
            <img
              v-else
              src="/images/foto-producto-2.png"
              :style="{ height: smAndDown ? '110px' : '150px', width: '100%', objectFit: 'cover' }"
              class="opacity-40"
            />
          </div>
        </v-col>

        <!-- Contenido -->
        <v-col cols="8" md="9" class="d-flex flex-column">
          <v-card-text class="flex-grow-1 py-3 px-3 px-sm-4">
            <div class="d-flex justify-space-between align-start mb-1 gap-2">
              <div class="flex-grow-1">
                <h3 class="product-list-name font-weight-bold mb-1">
                  {{ item.product.name }}
                </h3>
                <p class="text-caption text-medium-emphasis mb-2 line-clamp-2 d-none d-sm-block">
                  {{ item.product.description }}
                </p>
              </div>
            </div>

            <v-row class="align-center" dense>
              <v-col cols="12" sm="5" md="4">
                <div class="product-list-price text-h6 font-weight-bold text-primary">
                  {{ formatCurrencyARS(item.product.price) }}
                </div>
              </v-col>
              <v-col cols="12" sm="7" md="8" class="d-flex justify-end">
                <template v-if="!item.isInCart.value">
                  <v-btn
                    v-if="item.inStock.value"
                    color="primary"
                    variant="tonal"
                    rounded="lg"
                    :size="smAndDown ? 'small' : 'default'"
                    class="text-none font-weight-bold"
                    @click="item.add"
                  >
                    <v-icon start size="16">mdi-cart-plus</v-icon>
                    Agregar
                  </v-btn>
                  <v-chip
                    v-else
                    color="error"
                    variant="tonal"
                    label
                    :size="smAndDown ? 'small' : 'default'"
                  >
                    Sin Stock
                  </v-chip>
                </template>

                <div v-else class="qty-controls d-flex align-center rounded-lg pa-1 gap-1">
                  <v-btn
                    v-if="item.quantity.value === 1"
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="item.remove"
                  >
                    <v-icon size="16">mdi-trash-can-outline</v-icon>
                  </v-btn>
                  <v-btn
                    v-else
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="item.decrement"
                  >
                    <v-icon size="16">mdi-minus</v-icon>
                  </v-btn>

                  <span class="font-weight-bold text-body-2 px-2 qty-value">
                    {{ item.quantity.value }}
                  </span>

                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="item.increment"
                  >
                    <v-icon size="16">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useProductCart } from "@/composables/useProductCart";
import type { Product } from "~/types/project";

import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

const props = defineProps({
  products: {
    type: Array as () => Product[],
    default: [],
  },
});

// Una sola instancia del composable por producto, memoizada por ID
const _cache: Record<string, ReturnType<typeof useProductCart>> = {};
const getItem = (product: Product) => {
  if (!_cache[product.id]) {
    _cache[product.id] = useProductCart(product);
  }
  return _cache[product.id];
};

const productItems = computed(() =>
  props.products.map((product) => ({
    product,
    ...getItem(product),
  })),
);
</script>

<style scoped lang="scss">
.product-list-item {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(93, 135, 255, 0.14);

    .product-list-img {
      transform: scale(1.04);
    }
  }
}

.product-list-img-col {
  overflow: hidden;
}

.product-list-img-wrapper {
  overflow: hidden;
  height: 100%;
}

.product-list-img {
  transition: transform 0.35s ease;
}

.product-list-name {
  font-size: 0.95rem;
  line-height: 1.4;
  color: rgb(var(--v-theme-textPrimary));

  @media (min-width: 600px) {
    font-size: 1.05rem;
  }
}

.product-list-price {
  letter-spacing: -0.5px;
}

.qty-controls {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);

  .qty-value {
    color: rgb(var(--v-theme-primary));
    min-width: 28px;
    text-align: center;
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.opacity-40 {
  opacity: 0.4;
}
</style>
