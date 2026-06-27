<template>
  <v-chip :color="color" size="small" variant="flat">
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
import type { ProductionOrderStatus } from '~/types/enums'

const props = defineProps<{ status: ProductionOrderStatus }>()

const statusMap: Record<ProductionOrderStatus, { color: string; label: string }> = {
  pendiente: { color: 'grey', label: 'Pendiente' },
  en_proceso: { color: 'blue', label: 'En proceso' },
  completado: { color: 'success', label: 'Completado' },
  entregado: { color: 'teal', label: 'Entregado' },
  cancelado: { color: 'orange', label: 'Cancelado' },
}

const color = computed(() => statusMap[props.status]?.color || 'grey')
const label = computed(() => statusMap[props.status]?.label || props.status)
</script>
