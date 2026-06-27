<template>
  <v-container
    v-if="loading || promotionsActive.length"
    fluid
    class="promotions-section mb-10 pa-0"
  >
    <!-- Header -->
    <div class="mb-6">
      <h2 class="section-title text-h5 font-weight-bold">Promociones Destacadas</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">Aprovechá nuestras ofertas especiales</p>
    </div>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col v-for="n in 3" :key="n" cols="12" sm="6" md="4">
        <v-skeleton-loader type="card" class="rounded-xl" />
      </v-col>
    </v-row>

    <Carousel :items="promotionsActive">
      <template #default="{ item: promo }">
        <v-card
          class="promotion-card rounded-xl overflow-hidden h-100"
          elevation="0"
          @click="handlePromoClick(promo)"
        >
          <div class="promo-img-wrapper">
            <v-img
              :src="returnUrlImg(promo.imageUrl)"
              :alt="promo.title"
              height="220"
              cover
              class="promo-img"
            >
              <div class="promo-img-overlay d-flex flex-column justify-end pa-4">
                <v-chip
                  color="error"
                  size="small"
                  class="mb-2 align-self-start promo-badge"
                  rounded="pill"
                >
                  <v-icon start size="12">mdi-tag</v-icon>
                  Promoción
                </v-chip>
                <div class="text-white text-h6 font-weight-bold promo-title-overlay">
                  {{ promo.name }}
                </div>
              </div>
            </v-img>
          </div>

          <v-card-text class="promo-content py-4 px-4">
            <div class="text-body-2 text-medium-emphasis line-clamp-2 mb-3">
              {{ promo.description }}
            </div>
            <v-btn
              block
              color="primary"
              variant="tonal"
              rounded="lg"
              class="text-none font-weight-bold"
              @click.stop="handlePromoClick(promo)"
            >
              Ver Promoción
              <v-icon end size="16">mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </Carousel>
  </v-container>
</template>

<script setup lang="ts">
import Carousel from "@/components/shared/Carousel.vue";
import type { Promotion } from "~/types/project";

import { usePromotionStore } from "@/stores/promotion";
const promotionStore = usePromotionStore();
const { promotionsActive, loading } = storeToRefs(promotionStore);

promotionStore.getAllActive();

const emit = defineEmits<{
  selectPromo: [promo: Promotion];
}>();

const handlePromoClick = (promo: Promotion) => {
  emit("selectPromo", promo);
};
</script>

<style scoped lang="scss">
.promotions-section {
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
}

.promotion-card {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(93, 135, 255, 0.18);

    .promo-img {
      transform: scale(1.04);
    }
  }
}

.promo-img-wrapper {
  overflow: hidden;
}

.promo-img {
  transition: transform 0.4s ease;
  display: block;
}

.promo-img-overlay {
  background: linear-gradient(
    to bottom,
    transparent 20%,
    rgba(0, 0, 0, 0.55) 100%
  );
  min-height: 100%;

  .promo-badge {
    font-weight: 700;
    letter-spacing: 0;
  }

  .promo-title-overlay {
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    line-height: 1.3;
  }
}

.promo-content {
  background: #fff;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.8em;
}
</style>
