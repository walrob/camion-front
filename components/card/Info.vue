<script setup lang="ts">
const props = defineProps({
  color: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
  },
  elevation: {
    type: [String, Number],
    default: 0,
  },
});
</script>

<template>
  <v-card
    :elevation="elevation"
    rounded="lg"
    :class="`d-flex align-center justify-center text-center bg-light${color} h-100`"
  >
    <v-card-item class="pa-4 pa-sm-5 w-100">
      <slot />
      <div
        :class="`text-subtitle-2 text-sm-subtitle-1 font-weight-bold mt-3 text-${color}`"
      >
        {{ title }}
      </div>
      <div
        v-if="value !== undefined"
        :class="`text-h5 text-sm-h4 mt-1 text-${color}`"
      >
        {{ value }}
      </div>
    </v-card-item>
  </v-card>
</template>
