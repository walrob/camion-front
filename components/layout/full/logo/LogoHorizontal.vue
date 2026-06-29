<script setup lang="ts">
import { useDisplay } from "vuetify";
const { smAndUp } = useDisplay();

const props = defineProps({
  height: {
    type: [String, Number],
    default: 40,
  },
});
</script>
<template>
  <div style="padding-top: 5px">
    <img src="/images/logos/FletLog.png" :height="height" alt="logo" />
  </div>
</template>
