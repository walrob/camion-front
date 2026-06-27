<template>
  <div>
    <!-- Label tipo ficha -->
    <div
      :class="
        edit
          ? 'v-label font-weight-bold mb-1'
          : 'text-caption text--secondary mb-1'
      "
    >
      {{ label }}
    </div>

    <!-- Modo lectura -->
    <div v-if="!edit" class="font-weight-medium">
      {{ displayValue || placeholder }}
    </div>

    <!-- Modo edición -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
  edit: {
    type: Boolean,
    default: false,
  },
  displayValue: {
    type: [String, Number],
    default: null,
  },
  placeholder: {
    type: String,
    default: "",
  },
});
</script>
