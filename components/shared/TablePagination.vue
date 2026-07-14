<script setup lang="ts">
// Pie de paginación de las tablas de listado. Se oculta solo cuando hay una única
// página. Emite `change` con el número de página elegido; la página decide qué
// recargar. Reemplaza el bloque v-pagination que se repetía idéntico en los
// listados (choferes, viajes, RRHH, rendiciones).
defineProps<{ page: number; length: number }>();
defineEmits<{ change: [page: number] }>();
</script>

<template>
  <div v-if="length > 1" class="d-flex justify-center mt-3">
    <v-pagination
      :model-value="page"
      :length="length"
      density="comfortable"
      :total-visible="6"
      @update:model-value="$emit('change', $event)"
    />
  </div>
</template>
