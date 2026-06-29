<script setup lang="ts">
defineProps<{
  title: string;
  hint?: string;
}>();
</script>

<template>
  <!-- Agrupa campos relacionados bajo un encabezado para dar jerarquía al formulario. -->
  <div class="mb-5">
    <div class="text-overline text-medium-emphasis" style="line-height: 1.4">
      {{ title }}
    </div>
    <p v-if="hint" class="text-caption text-medium-emphasis mb-2 mt-n1">{{ hint }}</p>
    <slot />
  </div>
</template>
