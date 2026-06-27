<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `Super Natu | ${titleChunk}` : "Super Natu";
  },
});

import { useGeneralStore } from "@/stores/general";

const generalStore = useGeneralStore();
const { snackbar } = storeToRefs(generalStore);
</script>

<template>
  <v-app>
    <NuxtPage />
    <v-snackbar
      v-model="snackbar.state"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      rounded="pill"
    >
      {{ snackbar.message }}
    </v-snackbar>
    <LayoutFullFooterCoorp />
  </v-app>
</template>
