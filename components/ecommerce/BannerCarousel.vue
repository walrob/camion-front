<template>
  <!-- Skeleton -->
  <v-skeleton-loader v-if="loading" type="image" class="rounded-2xl banner-skeleton" />

  <!-- Carousel -->
  <div v-else-if="bannersActive.length > 0" class="banner-wrapper rounded-2xl overflow-hidden">
    <v-carousel
      hide-delimiters
      :height="size"
      class="rounded-2xl"
      cycle
      show-arrows="hover"
      interval="5000"
    >
      <v-carousel-item
        v-for="(banner, i) in bannersActive"
        :key="i"
        :src="returnUrlImg(banner.imageUrl)"
        cover
      >
        <div class="banner-overlay" />
      </v-carousel-item>

      <template #prev="{ props: prevProps }">
        <v-btn
          v-bind="prevProps"
          icon
          size="small"
          color="white"
          variant="elevated"
          class="carousel-nav-btn"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </template>

      <template #next="{ props: nextProps }">
        <v-btn
          v-bind="nextProps"
          icon
          size="small"
          color="white"
          variant="elevated"
          class="carousel-nav-btn"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </template>
    </v-carousel>
  </div>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

import { useBannerStore } from "@/stores/banner";
const bannerStore = useBannerStore();
const { bannersActive, loading } = storeToRefs(bannerStore);

const size = computed(() => (smAndDown.value ? 220 : 420));

watch(
  smAndDown,
  async (isMobile) => {
    if (loading.value) return;
    await bannerStore.getAllActive(isMobile);
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.banner-wrapper {
  box-shadow: 0 8px 32px rgba(93, 135, 255, 0.15);
}

.banner-skeleton {
  min-height: 220px;

  @media (min-width: 600px) {
    min-height: 420px;
  }
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.05) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.carousel-nav-btn {
  opacity: 0.9;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.08);
  }
}

.rounded-2xl {
  border-radius: 16px !important;
}
</style>
