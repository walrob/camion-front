<template>
  <v-app-bar scroll-behavior="elevate" class="ecommerce-header" :elevation="0">
    <v-container
      fluid
      class="d-flex align-center justify-space-between pa-0 ma-0 header-inner"
    >
      <!-- Logo y Marca -->
      <div class="logo-wrapper d-flex align-center" style="cursor: pointer" @click="router.push('/')">
        <LayoutFullLogoHorizontal height="52" />
      </div>

      <!-- Buscador Desktop -->
      <div
        v-if="!hideSearch"
        class="search-wrapper flex-grow-1 mx-4 mx-md-8 d-none d-md-block"
      >
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar productos..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          class="search-field"
          @click:prepend-inner="handleSearch"
          @keyup.enter="handleSearch"
        />
      </div>

      <!-- Buscador Mobile expandible -->
      <v-expand-transition v-if="!hideSearch">
        <div
          v-show="showMobileSearch"
          class="mobile-search-bar d-md-none"
        >
          <v-text-field
            v-model="searchQuery"
            placeholder="Buscar productos..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            autofocus
            @click:prepend-inner="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
      </v-expand-transition>

      <!-- Acciones Derecha -->
      <div class="header-actions d-flex align-center gap-1 gap-sm-2">
        <!-- Botón búsqueda mobile -->
        <v-btn
          v-if="smAndDown && !hideSearch"
          icon
          size="small"
          variant="text"
          @click="showMobileSearch = !showMobileSearch"
        >
          <v-icon>{{ showMobileSearch ? 'mdi-close' : 'mdi-magnify' }}</v-icon>
        </v-btn>

        <!-- Carrito -->
        <v-btn
          icon
          size="small"
          variant="text"
          class="cart-btn"
          @click="goToCart"
        >
          <v-badge
            v-if="cartCount > 0"
            :content="cartCount"
            color="error"
            floating
          >
            <v-icon>mdi-cart-outline</v-icon>
          </v-badge>
          <v-icon v-else>mdi-cart-outline</v-icon>
        </v-btn>

        <LayoutFullVerticalHeaderProfileDD />
      </div>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useCartStore } from "@/stores/cart";

import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

const props = defineProps({
  hideSearch: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const searchQuery = ref(route.query.search || "");
const showMobileSearch = ref(false);

const cartCount = computed(() => cartStore.cartItemsCount);

const handleSearch = () => {
  showMobileSearch.value = false;
  router.push({ path: "/productos", query: { search: searchQuery.value } });
};

const goToCart = () => {
  router.push("/cart");
};
</script>

<style scoped lang="scss">
.ecommerce-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(8px);

  &.v-app-bar--is-scrolled {
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08) !important;
  }
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px !important;

  @media (min-width: 600px) {
    padding: 0 24px !important;
  }
}

.logo-wrapper {
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }
}

.search-wrapper {
  max-width: 480px;

  .search-field {
    :deep(.v-field) {
      background: rgba(93, 135, 255, 0.04);
      border-color: rgba(0, 0, 0, 0.1);
      transition: all 0.25s ease;

      &:hover, &:focus-within {
        background: #fff;
        border-color: rgba(93, 135, 255, 0.4);
        box-shadow: 0 0 0 3px rgba(93, 135, 255, 0.1);
      }
    }
  }
}

.mobile-search-bar {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.cart-btn {
  position: relative;
  transition: color 0.2s ease;

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
}
</style>
