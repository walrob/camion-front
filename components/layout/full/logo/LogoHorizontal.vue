<script setup lang="ts">
import { useDisplay } from "vuetify";

const props = defineProps({
  height: {
    type: [String, Number],
    default: 40,
  },
});

const { mobile } = useDisplay();
const src = computed(() =>
  mobile.value
    ? "/images/logos/FletLog%20small.png"
    : "/images/logos/FletLog.png",
);
</script>
<template>
  <div style="padding-top: 5px">
    <img :src="src" :height="height" alt="logo" />
  </div>
</template>
