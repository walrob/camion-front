<template>
  <v-card rounded="lg" elevation="1" class="pa-4 h-100">
    <div class="d-flex align-center justify-space-between">
      <div>
        <div class="text-h4 font-weight-bold" :class="`text-${color}`">
          {{ value ?? 0 }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ label }}</div>
      </div>
      <v-avatar :color="`${color}-lighten-4`" size="48">
        <v-icon :color="color" size="24">{{ icon }}</v-icon>
      </v-avatar>
    </div>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: number | undefined
  color?: string
  icon?: string
}>()
</script>
