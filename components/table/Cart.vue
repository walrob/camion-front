<template>
  <!-- Vista Desktop: tabla -->
  <v-card v-if="!smAndDown" class="cart-table-card rounded-xl" elevation="0">
    <v-table class="cart-table">
      <thead>
        <tr>
          <th class="table-header text-body-2 font-weight-bold">Producto</th>
          <th class="table-header text-body-2 font-weight-bold">
            Precio unit.
          </th>
          <th class="table-header text-body-2 font-weight-bold">Cantidad</th>
          <th class="table-header text-body-2 font-weight-bold">Total</th>
          <th class="table-header text-body-2 font-weight-bold text-center">
            Eliminar
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.product.id" class="cart-row">
          <!-- Producto -->
          <td class="py-3">
            <div class="d-flex align-center gap-3">
              <div
                class="cart-img-wrapper rounded-lg overflow-hidden flex-shrink-0"
              >
                <v-img
                  :src="returnUrlImg(item.product.imageUrl)"
                  :alt="item.product.name"
                  width="72"
                  height="72"
                  cover
                />
              </div>
              <div>
                <p
                  class="font-weight-bold text-body-2"
                  style="
                    color: rgb(42, 53, 71);
                    max-width: 200px;
                    line-height: 1.4;
                  "
                >
                  {{ item.product.name }}
                </p>
              </div>
            </div>
          </td>

          <!-- Precio unitario -->
          <td class="text-body-2 font-weight-medium">
            {{ formatCurrencyARS(item.product.price) }}
          </td>

          <!-- Cantidad -->
          <td>
            <div class="qty-controls d-flex align-center rounded-lg pa-1 gap-1">
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="primary"
                @click="$emit('decrement', item.product.id)"
              >
                <v-icon size="16">mdi-minus</v-icon>
              </v-btn>
              <span class="font-weight-bold text-body-2 qty-value px-2">
                {{ item.quantity }}
              </span>
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="primary"
                @click="$emit('increment', item.product.id)"
              >
                <v-icon size="16">mdi-plus</v-icon>
              </v-btn>
            </div>
          </td>

          <!-- Total de la línea -->
          <td>
            <div
              v-if="item.itemSubtotal"
              class="text-caption text-medium-emphasis line-through-subtle"
            >
              {{ formatCurrencyARS(item.itemSubtotal) }}
            </div>
            <div
              v-if="item.itemDiscount"
              class="text-caption text-success font-weight-medium"
            >
              -{{ formatCurrencyARS(item.itemDiscount) }}
            </div>
            <div
              v-if="item.itemTotal"
              class="font-weight-bold text-body-2 text-primary"
            >
              {{ formatCurrencyARS(item.itemTotal) }}
            </div>
          </td>

          <!-- Eliminar -->
          <td class="text-center">
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              class="remove-btn"
              @click="$emit('remove', item.product.id)"
            >
              <v-icon size="18">mdi-trash-can-outline</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>

  <!-- Vista Mobile: cards -->
  <div v-else class="cart-cards">
    <v-card
      v-for="item in data"
      :key="item.product.id"
      class="cart-mobile-card mb-3 rounded-xl overflow-hidden"
      elevation="0"
    >
      <v-row no-gutters align="stretch">
        <!-- Imagen -->
        <v-col cols="3">
          <v-img
            :src="returnUrlImg(item.product.imageUrl)"
            :alt="item.product.name"
            height="120"
            cover
            class="cart-mobile-img"
          />
        </v-col>

        <!-- Contenido -->
        <v-col cols="9">
          <v-card-text class="py-3 px-3">
            <!-- Nombre + eliminar -->
            <div class="d-flex justify-space-between align-start mb-2">
              <p
                class="font-weight-bold text-body-2 line-clamp-2 flex-grow-1 mr-2"
                style="color: rgb(42, 53, 71); line-height: 1.4"
              >
                {{ item.product.name }}
              </p>
              <v-btn
                icon
                size="x-small"
                color="error"
                variant="text"
                class="remove-btn flex-shrink-0"
                @click="$emit('remove', item.product.id)"
              >
                <v-icon size="16">mdi-trash-can-outline</v-icon>
              </v-btn>
            </div>

            <!-- Precio + controles -->
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-primary font-weight-bold text-body-2">
                  {{ formatCurrencyARS(item.product.price) }}
                </p>
                <p
                  v-if="item.itemDiscount"
                  class="text-caption text-success font-weight-medium"
                >
                  -{{ formatCurrencyARS(item.itemDiscount) }}
                </p>
                <p
                  v-if="item.itemTotal"
                  class="text-caption font-weight-bold text-medium-emphasis"
                >
                  Total: {{ formatCurrencyARS(item.itemTotal) }}
                </p>
              </div>

              <div
                class="qty-controls d-flex align-center rounded-lg pa-1 gap-1"
              >
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="$emit('decrement', item.product.id)"
                >
                  <v-icon size="14">mdi-minus</v-icon>
                </v-btn>
                <span class="font-weight-bold text-body-2 qty-value px-1">
                  {{ item.quantity }}
                </span>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="$emit('increment', item.product.id)"
                >
                  <v-icon size="14">mdi-plus</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { OrderItem } from "~/types/project";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const props = defineProps({
  data: {
    type: Array as () => OrderItem[],
    required: true,
  },
});

const emit = defineEmits(["increment", "decrement", "remove"]);
</script>

<style scoped lang="scss">
// Desktop table
.cart-table-card {
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: #fff;
}

.cart-table {
  background: transparent;

  .table-header {
    color: rgb(var(--v-theme-textSecondary));
    text-transform: uppercase;
    font-size: 0.72rem !important;
    letter-spacing: 0.06em;
    padding: 14px 16px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.06) !important;
  }

  .cart-row {
    transition: background 0.2s ease;

    &:hover {
      background: rgba(93, 135, 255, 0.03);
    }

    td {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
      padding: 12px 16px;
      vertical-align: middle;
    }
  }
}

.cart-img-wrapper {
  background: #f7fbff;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.qty-controls {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  display: inline-flex;
  width: fit-content;

  .qty-value {
    color: rgb(var(--v-theme-primary));
    min-width: 24px;
    text-align: center;
  }
}

.remove-btn {
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

.line-through-subtle {
  // text-decoration: line-through;
  opacity: 0.55;
}

// Mobile cards
.cart-mobile-card {
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: #fff;
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(93, 135, 255, 0.12);
  }
}

.cart-mobile-img {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
