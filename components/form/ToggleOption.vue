<template>
  <v-col cols="12" class="d-md-flex align-center justify-space-between">
    <h4 class="font-weight-medium" style="max-width: 700px">
      {{ label }}
    </h4>

    <div class="d-flex align-center gap-2 justify-end v-label">
      <span>No</span>
      <v-switch v-model="model" color="primary" hide-details />
      <span>Sí</span>
    </div>
  </v-col>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
}>();

// v-model compatible
const model = defineModel<boolean>();
</script>
