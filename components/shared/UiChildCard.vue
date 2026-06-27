<script setup lang="ts">
const props = defineProps({
  title: String,
  hideaction: Boolean,
  hidetitle: Boolean,
});
</script>

<template>
  <v-card elevation="10">
    <v-card-item class="py-3">
      <v-card-title v-if="!hidetitle" class="d-flex justify-space-between">
        <div class="text-h6">{{ title }}</div>
        <slot name="header" />
      </v-card-title>
    </v-card-item>
    <v-divider v-if="!hidetitle" />
    <v-card-text>
      <slot />
    </v-card-text>
    <v-card-actions v-if="!hideaction" class="justify-end">
      <slot name="footer" />
    </v-card-actions>
  </v-card>
</template>
