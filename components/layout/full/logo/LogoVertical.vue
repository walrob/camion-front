<script setup lang="ts">
const props = defineProps({
  height: {
    type: String,
    default: 200,
  },
});
</script>
<template>
  <div class="logo">
    <img src="/images/logos/logo_natu_negro.png" :height="height" alt="logo" />
  </div>
</template>
