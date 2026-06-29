<script setup lang="ts">
defineProps<{
  icon?: string;
  title?: string;
  text?: string;
  retryText?: string;
}>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="text-center py-10 px-4">
    <v-icon size="44" color="error" class="mb-3">
      {{ icon || "mdi-alert-circle-outline" }}
    </v-icon>
    <p class="text-subtitle-1 font-weight-medium mb-1">
      {{ title || "No se pudo cargar la información" }}
    </p>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ text || "Ocurrió un error al obtener los datos." }}
    </p>
    <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="$emit('retry')">
      {{ retryText || "Reintentar" }}
    </v-btn>
  </div>
</template>
