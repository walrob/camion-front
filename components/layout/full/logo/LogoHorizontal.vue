<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";

const props = defineProps({
  height: {
    type: [String, Number],
    default: 40,
  },
  /**
   * Variante para fondos oscuros: el azul de "Fleet" pasa a blanco y se apaga
   * el halo del contorno. El original tiene el texto en #00519B, que sobre el
   * navy de la landing queda en 2,5:1 — ilegible.
   */
  light: {
    type: Boolean,
    default: false,
  },
});

const { mobile } = useDisplay();
const src = computed(() => {
  if (props.light) {
    return mobile.value
      ? "/images/logos/FletLog-small-light.png"
      : "/images/logos/FletLog-light.png";
  }
  return mobile.value
    ? "/images/logos/FletLog%20small.png"
    : "/images/logos/FletLog.png";
});
</script>
<template>
  <div style="padding-top: 5px">
    <!--
      El `alt` nombra la marca y lo que hace: es el único texto que el buscador
      (y un lector de pantalla) obtiene de la imagen, y en la cabecera de la
      landing es además el primer enlace de la página. "logo" no dice nada.
    -->
    <img
      :src="src"
      :height="height"
      alt="CamioNex — software de gestión de flotas de camiones"
      decoding="async"
    />
  </div>
</template>
