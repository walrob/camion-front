<script setup lang="ts">
defineProps<{
  /** Ícono mdi. Default: bandeja vacía. */
  icon?: string;
  /** Título corto opcional. */
  title?: string;
  /** Texto descriptivo. */
  text?: string;
}>();
</script>

<template>
  <div class="text-center py-10 px-4">
    <v-icon size="44" color="medium-emphasis" class="mb-3">
      {{ icon || "mdi-inbox-outline" }}
    </v-icon>
    <p v-if="title" class="text-subtitle-1 font-weight-medium mb-1">{{ title }}</p>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ text || "No hay datos para mostrar" }}
    </p>
    <!-- CTA opcional (p. ej. "Crear primer registro"). -->
    <slot name="action" />
  </div>
</template>
