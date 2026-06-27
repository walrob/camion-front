<template>
  <v-card class="product-card h-100 d-flex flex-column rounded-xl overflow-hidden" elevation="0">
    <!-- Imagen del producto -->
    <div class="product-image-wrapper position-relative">
      <v-img
        v-if="product.imageUrl"
        :src="returnUrlImg(product.imageUrl)"
        :alt="product.name"
        :height="smAndDown ? 170 : 220"
        cover
        class="product-image"
      />
      <img
        v-else
        src="/images/foto-producto-2.png"
        :style="{ height: smAndDown ? '170px' : '220px', width: '100%', objectFit: 'cover' }"
        class="product-image-fallback"
      />

      <!-- Overlay hover con botón rápido -->
      <div class="product-overlay d-flex align-center justify-center">
        <template v-if="!isInCart && inStock">
          <v-btn
            color="white"
            variant="elevated"
            size="small"
            rounded="pill"
            class="add-to-cart-overlay-btn text-primary font-weight-bold"
            @click.stop="add"
          >
            <v-icon start size="16">mdi-cart-plus</v-icon>
            Agregar
          </v-btn>
        </template>
      </div>

      <!-- Badge sin stock -->
      <v-chip
        v-if="!inStock"
        class="position-absolute stock-badge"
        color="warning"
        size="small"
        label
      >
        Sin Stock
      </v-chip>
    </div>

    <v-card-text class="flex-grow-1 d-flex flex-column pa-3 pa-sm-4">
      <!-- Nombre -->
      <h3 class="product-name text-subtitle-1 font-weight-bold mb-1 line-clamp-2">
        {{ product.name }}
      </h3>

      <!-- Descripción -->
      <p class="product-description text-caption text-medium-emphasis mb-2 line-clamp-2">
        {{ product.description }}
      </p>

      <!-- Precio -->
      <div class="mt-auto">
        <div class="product-price text-h6 font-weight-bold text-primary mb-3">
          {{ formatCurrencyARS(product.price) }}
        </div>

        <!-- Botones de carrito -->
        <template v-if="!isInCart">
          <v-btn
            v-if="inStock"
            block
            color="primary"
            variant="tonal"
            rounded="lg"
            :size="smAndDown ? 'small' : 'default'"
            class="add-btn text-none font-weight-bold"
            @click="add"
          >
            <v-icon start size="18">mdi-cart-plus</v-icon>
            Agregar al carrito
          </v-btn>
          <v-chip
            v-else
            block
            color="error"
            variant="tonal"
            label
            :size="smAndDown ? 'small' : 'default'"
            class="w-100 justify-center"
          >
            Sin Stock
          </v-chip>
        </template>

        <div v-else class="qty-controls d-flex align-center justify-space-between rounded-lg pa-1">
          <v-btn
            v-if="quantity === 1"
            icon
            size="small"
            variant="text"
            color="error"
            @click="remove"
          >
            <v-icon size="18">mdi-trash-can-outline</v-icon>
          </v-btn>
          <v-btn
            v-else
            icon
            size="small"
            variant="text"
            color="primary"
            @click="decrement"
          >
            <v-icon size="18">mdi-minus</v-icon>
          </v-btn>

          <span class="qty-value font-weight-bold text-body-1">{{ quantity }}</span>

          <v-btn
            icon
            size="small"
            variant="text"
            color="primary"
            @click="increment"
          >
            <v-icon size="18">mdi-plus</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useProductCart } from "@/composables/useProductCart";
import type { Product } from "~/types/project";

import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

const props = defineProps<{ product: Product }>();

const {
  isInCart,
  quantity,
  inStock,
  discountedPrice,
  add,
  increment,
  decrement,
  remove,
} = useProductCart(props.product);
</script>

<style scoped lang="scss">
.product-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: #fff;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(93, 135, 255, 0.18);

    .product-image {
      transform: scale(1.04);
    }

    .product-overlay {
      opacity: 1;
    }
  }
}

.product-image-wrapper {
  overflow: hidden;
}

.product-image {
  transition: transform 0.4s ease;
  display: block;
}

.product-image-fallback {
  opacity: 0.45;
  display: block;
}

.product-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  opacity: 0;
  transition: opacity 0.3s ease;

  .add-to-cart-overlay-btn {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

.stock-badge {
  bottom: 10px;
  right: 10px;
}

.product-name {
  color: rgb(var(--v-theme-textPrimary));
  line-height: 1.4;
}

.product-description {
  line-height: 1.5;
  min-height: 2.6em;
}

.product-price {
  letter-spacing: -0.5px;
}

.add-btn {
  letter-spacing: 0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(93, 135, 255, 0.35);
  }
}

.qty-controls {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);

  .qty-value {
    color: rgb(var(--v-theme-primary));
    min-width: 24px;
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

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}
</style>
