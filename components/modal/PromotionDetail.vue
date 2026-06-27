<template>
  <v-dialog v-model="dialog" max-width="600">
    <UiModalCard :title="promo.name">
      <v-row>
        <v-col cols="12" class="text-body-1">
          {{ promo.description }}
        </v-col>
        <v-col cols="6" class="text-caption pb-0">
          Válido hasta:
          {{ formatDateLocal(promo.endDate) }}
        </v-col>
        <!-- <v-col cols="6" class="text-caption pb-0">
          Máx. acumulable:
          {{ promo.maxUses }}
        </v-col> -->
      </v-row>

      <template #footer>
        <v-btn variant="tonal" text="Cerrar" @click="dialog = false"></v-btn>
      </template>
    </UiModalCard>
  </v-dialog>
</template>

<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { PromotionType } from "~/types/enums";
import type { Promotion } from "~/types/project";

const props = defineProps({
  promo: {
    type: Object as () => Promotion,
    default: () => ({
      id: "",
      name: "",
      description: "",
      imageUrl: undefined,
      type: PromotionType.PERCENTAGE,
      value: 0,
      startDate: "",
      endDate: "",
      isActive: true,
      productIds: [],
      minQuantity: undefined,
      maxUses: undefined,
    }),
  },
});

const dialog = defineModel<boolean>();
</script>
