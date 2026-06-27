<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useDisplay } from "vuetify";

interface SharedCarouselProps<T = any> {
  items: T[];
}

const props = defineProps<SharedCarouselProps>();

const page = ref(0);
const itemsPerPage = ref(1);

const { mdAndUp, lgAndUp } = useDisplay();

function updateItemsPerPage() {
  if (lgAndUp.value) {
    itemsPerPage.value = 3;
  } else if (mdAndUp.value) {
    itemsPerPage.value = 2;
  } else {
    itemsPerPage.value = 1;
  }
}

watchEffect(() => {
  updateItemsPerPage();
});

const startIndex = computed(() => page.value * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value)
);
</script>

<template>
  <div>
    <div
      class="d-flex justify-center gap-4 mx-auto"
      :style="`max-width: ${(paginatedItems.length / itemsPerPage) * 100}%`"
    >
      <slot
        v-for="(item, index) in paginatedItems"
        :key="index"
        :item="item"
        :index="index + startIndex"
      />
    </div>
    <div v-if="items.length > itemsPerPage" class="d-flex justify-center">
      <v-btn icon variant="text" :disabled="page === 0" @click="page--">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <v-btn
        icon
        variant="text"
        :disabled="endIndex >= items.length"
        @click="page++"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>
