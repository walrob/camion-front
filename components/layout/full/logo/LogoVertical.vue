<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";

const props = defineProps({
  height: {
    type: String,
    default: 120,
  },
});

const { mobile } = useDisplay();
const src = computed(() =>
  mobile.value
    ? "/images/logos/FletLog%20small.png"
    : "/images/logos/FletLog.png",
);
const imgHeight = computed(() => (mobile.value ? "72" : props.height));
</script>
<template>
  <div class="logo">
    <img :src="src" :height="imgHeight" alt="logo" class="logo-img" />
  </div>
</template>

<style scoped>
/* Nunca desbordar el ancho del contenedor (el alto lo fija el atributo height). */
.logo-img {
  max-width: 100%;
}
</style>
