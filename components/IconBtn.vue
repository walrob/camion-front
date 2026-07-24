<script setup lang="ts">
import { computed, useAttrs } from "vue";

// Botón de solo ícono con tooltip descriptivo. Envuelve un v-btn en un v-tooltip
// para que, al pasar el mouse, se explique qué hace (los íconos por sí solos a
// veces no se entienden). Todos los atributos y eventos (icon, size, variant,
// color, to, disabled, loading, @click, class, style…) se reenvían al v-btn.
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Texto del tooltip. Además se usa como aria-label si no se pasa uno. */
    tooltip: string;
    /**
     * Ubicación del tooltip. Se llama `tooltipLocation` (no `location`) para no
     * chocar con el prop `location` del v-btn, que se reenvía tal cual.
     */
    tooltipLocation?: string;
  }>(),
  { tooltipLocation: "top" },
);

const attrs = useAttrs();
const ariaLabel = computed(
  () => (attrs["aria-label"] as string) ?? props.tooltip,
);
</script>

<template>
  <v-tooltip :text="tooltip" :location="tooltipLocation" :open-delay="300">
    <template #activator="{ props: tp }">
      <!--
        Sin contenido propio usamos un v-btn sin slot por defecto: así Vuetify
        renderiza el prop `icon`. Si le pasáramos un slot vacío, el v-btn lo
        priorizaría sobre `icon` y el ícono no se vería.
      -->
      <v-btn
        v-if="$slots.default"
        v-bind="{ ...tp, ...$attrs }"
        :aria-label="ariaLabel"
      >
        <slot />
      </v-btn>
      <v-btn v-else v-bind="{ ...tp, ...$attrs }" :aria-label="ariaLabel" />
    </template>
  </v-tooltip>
</template>
