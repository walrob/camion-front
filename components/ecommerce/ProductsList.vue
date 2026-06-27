<template>
  <v-container fluid class="mb-8 pa-0">
    <!-- Header de sección -->
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-3">
      <div>
        <h2 class="section-title text-h5 font-weight-bold">
          Productos Destacados
        </h2>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Selección especial para vos
        </p>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn-toggle
          :model-value="viewMode"
          color="primary"
          mandatory
          rounded="lg"
          density="compact"
          @update:model-value="changeViewMode"
        >
          <v-btn icon value="grid" size="small" class="px-4">
            <v-icon size="18">mdi-view-grid</v-icon>
          </v-btn>
          <v-btn icon value="list" size="small" class="px-4">
            <v-icon size="18">mdi-view-list</v-icon>
          </v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="grid-products">
      <v-skeleton-loader
        v-for="n in 6"
        :key="n"
        type="card"
        class="rounded-xl"
      />
    </div>

    <!-- Vista Grid -->
    <div v-else-if="viewMode === 'grid'" class="grid-products">
      <CardProduct
        v-for="product in paginatedProducts"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Vista Lista -->
    <CardProductList v-else :products="paginatedProducts" />

    <!-- Paginación -->
    <div v-if="products.length > PAGE_SIZE" class="d-flex justify-center mt-8">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        rounded="circle"
        color="primary"
        total-visible="4"
        density="compact"
      />
    </div>

    <!-- Botón Ver Más -->
    <div class="d-flex justify-center mt-8">
      <router-link :to="`/productos`" custom v-slot="{ navigate, href }">
        <v-btn
          variant="outlined"
          size="large"
          rounded="pill"
          class="text-none font-weight-bold ver-mas-btn"
          color="primary"
          :href="href"
          @click="navigate"
        >
          Ver todos los productos
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </router-link>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import type { Product } from "~/types/project";
import { useDisplay } from "vuetify";
const { mdAndUp, smAndUp } = useDisplay();

const props = defineProps<{
  products: Product[];
  loading: boolean;
}>();

const PAGE_SIZE = mdAndUp.value ? 12 : smAndUp.value ? 9 : 6;
const currentPage = ref(1);
const viewMode = ref<"grid" | "list">("grid");

const totalPages = computed(() => Math.ceil(props.products.length / PAGE_SIZE));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return props.products.slice(start, start + PAGE_SIZE);
});

const changeViewMode = (mode: "grid" | "list") => {
  viewMode.value = mode;
};
</script>

<style scoped lang="scss">
.section-title {
  color: rgb(var(--v-theme-textPrimary));
  position: relative;

  &::after {
    content: "";
    display: block;
    width: 40px;
    height: 3px;
    background: linear-gradient(
      90deg,
      rgb(var(--v-theme-primary)),
      rgb(var(--v-theme-secondary))
    );
    border-radius: 2px;
    margin-top: 6px;
  }
}

.ver-mas-btn {
  letter-spacing: 0;
  transition: all 0.25s ease;

  &:hover {
    transform: translateX(2px);
    background: rgba(var(--v-theme-primary), 0.06);
  }
}
</style>
