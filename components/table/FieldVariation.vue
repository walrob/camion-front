<template>
  <div v-if="value">
    {{ label ? label + ": " : "" }}{{ value }}
    <span v-if="nextValue !== undefined">
      <span :class="variation(value, nextValue)" class="ml-1 text-sm">
        {{ variationValue(value, nextValue) }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: number | null;
  nextValue?: number | null;
  label?: string;
}>();

function variation(valueNew?: number | null, valueOld?: number | null) {
  if (!valueNew || !valueOld) return "";
  if (valueNew > valueOld) return "text-primary";
  if (valueNew < valueOld) return "text-error";
  return "";
}

function variationValue(valueNew?: number | null, valueOld?: number | null) {
  if (!valueNew || !valueOld) return "";
  if (valueNew > valueOld) return `(+ ${(valueNew - valueOld).toFixed(2)})`;
  if (valueNew < valueOld) return `(- ${(valueOld - valueNew).toFixed(2)})`;
  return "";
}
</script>
