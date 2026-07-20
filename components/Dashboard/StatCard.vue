<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value: number | undefined;
    color?: string;
    icon?: string;
  }>(),
  { color: "primary" },
);

const toneVar = computed(() => ({ "--tone": `var(--v-theme-${props.color})` }));
</script>

<template>
  <v-card rounded="lg" border flat class="pa-4 h-100 stat-card" :style="toneVar">
    <div class="d-flex align-center justify-space-between">
      <div>
        <div class="text-h4 font-weight-bold" :class="`text-${color}`">
          {{ value ?? 0 }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ label }}</div>
      </div>
      <v-avatar rounded="lg" size="48" class="stat-card__icon">
        <v-icon :color="color" size="24">{{ icon }}</v-icon>
      </v-avatar>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.stat-card {
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(var(--tone), 0.07) 0%,
      rgba(var(--tone), 0) 55%
    );
  }

  &__icon {
    background: rgba(var(--tone), 0.12);
  }
}
</style>
