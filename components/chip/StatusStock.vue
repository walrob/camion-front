<script setup lang="ts">
const props = defineProps({
  current: {
    type: Number,
    default: 1,
  },
  min: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    default: "small",
  },
});
</script>

<template>
  <v-chip v-if="current === 0 || !current" :size="size" color="error">
    Sin stock
  </v-chip>
  <v-chip v-else-if="current >= min" :size="size" color="success"> Ok </v-chip>
  <v-chip v-else :size="size" color="warning"> Bajo stock </v-chip>
</template>
