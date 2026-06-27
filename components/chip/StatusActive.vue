<script setup lang="ts">
const props = defineProps({
  data: {
    type: Boolean,
  },
  size: {
    type: String,
    default: "small",
  },
});
</script>

<template>
  <v-chip v-if="data" :size="size" color="success"> Activo </v-chip>
  <v-chip v-else :size="size" color="error"> Desactivo </v-chip>
</template>
