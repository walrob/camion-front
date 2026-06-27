<template>
  <div class="category-selector-section mb-8">
    <div class="section-header mb-5">
      <h2 class="section-title text-h5 font-weight-bold">Explorar Categorías</h2>
      <p class="section-subtitle text-body-2 text-medium-emphasis mt-1">
        Encontrá lo que buscás por categoría
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="category-scroll d-flex gap-3 py-2">
      <v-skeleton-loader v-for="n in 5" :key="n" type="avatar" width="110" class="rounded-xl flex-shrink-0" />
    </div>

    <!-- Content -->
    <div v-else class="category-scroll d-flex gap-3 py-2">
      <CardButton
        v-for="category in categories"
        :key="category.id"
        :item="{
          name: category.name,
          url: category.imageUrl,
        }"
        :active="categoryIdSelected === category.id"
        @click="selectCategory(category.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCategoryStore } from "@/stores/category";
const categoryStore = useCategoryStore();
const { categories, loading } = storeToRefs(categoryStore);

categoryStore.getDataCategories();

const categoryIdSelected = ref("");

const emit = defineEmits<{
  selectCategory: [categoryId: string];
}>();

const selectCategory = (categoryId: string) => {
  let newCat = "";
  if (categoryIdSelected.value !== categoryId) newCat = categoryId;
  categoryIdSelected.value = newCat;
  emit("selectCategory", newCat);
};
</script>

<style scoped lang="scss">
.category-selector-section {
  .section-title {
    color: rgb(var(--v-theme-textPrimary));
    position: relative;

    &::after {
      content: '';
      display: block;
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
      border-radius: 2px;
      margin-top: 6px;
    }
  }

  .section-subtitle {
    color: rgb(var(--v-theme-textSecondary));
  }
}

.category-scroll {
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 2px;
  }
}
</style>
