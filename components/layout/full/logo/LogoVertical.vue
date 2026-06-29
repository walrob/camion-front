<script setup lang="ts">
const props = defineProps({
  height: {
    type: String,
    default: 120,
  },
});
</script>
<template>
  <div class="logo">
    <img src="/images/logos/FletLog.png" :height="height" alt="logo" />
  </div>
</template>
