<script setup lang="ts">
const props = defineProps({
  title: String,
  class: {
    type: String,
    default: "withbg",
  },
});
</script>

<template>
  <div class="d-sm-flex align-center justify-space-between">
    <h5 class="text-h5 pb-6">{{ title }}</h5>
    <slot name="action"></slot>
  </div>

  <slot />
</template>
