<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    maxWidth?: number | string;
    /** Estado de guardado (spinner en el botón principal). */
    loading?: boolean;
    saveText?: string;
    cancelText?: string;
    saveDisabled?: boolean;
  }>(),
  { maxWidth: 640, saveText: "Guardar", cancelText: "Cancelar" },
);

defineEmits<{
  "update:modelValue": [value: boolean];
  save: [];
  cancel: [];
}>();
</script>

<template>
  <!--
    Shell reutilizable para diálogos de formulario:
    título fijo + cuerpo scrollable + acciones pegajosas abajo.
    Ideal para formularios largos en mobile (no se pierde el botón Guardar).
  -->
  <v-dialog
    :model-value="modelValue"
    :max-width="maxWidth"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="text-h6 font-weight-bold py-4">{{ title }}</v-card-title>
      <v-divider />

      <v-card-text class="py-4">
        <slot />
      </v-card-text>

      <v-divider />
      <v-card-actions class="px-4 py-3">
        <slot name="actions-prepend" />
        <v-spacer />
        <v-btn variant="text" @click="$emit('cancel')">{{ cancelText }}</v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="saveDisabled"
          @click="$emit('save')"
        >
          {{ saveText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
