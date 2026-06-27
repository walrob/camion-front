<template>
  <v-dialog v-model="dialog" max-width="600">
    <UiModalCard :title="title">
      <v-row>
        <v-col cols="12">
          <div v-html="description"></div>
        </v-col>
      </v-row>

      <template #footer>
        <v-btn
          color="primary"
          variant="tonal"
          text="Aceptar"
          @click="dialog = false"
        ></v-btn>
      </template>
    </UiModalCard>
  </v-dialog>
</template>

<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";

const props = defineProps({
  title: {
    type: String,
    default: "Aviso",
  },
  description: {
    type: String,
    default: "<p>Mensaje</p>",
  },
});

const dialog = defineModel<boolean>();
</script>
