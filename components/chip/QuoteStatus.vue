<template>
  <v-chip :color="color" size="small" variant="flat">
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
import type { QuoteStatus } from '~/types/enums'

const props = defineProps<{ status: QuoteStatus }>()

const statusMap: Record<QuoteStatus, { color: string; label: string }> = {
  borrador: { color: 'grey', label: 'Borrador' },
  enviado: { color: 'blue', label: 'Enviado' },
  aprobado: { color: 'success', label: 'Aprobado' },
  rechazado: { color: 'error', label: 'Rechazado' },
  cancelado: { color: 'orange', label: 'Cancelado' },
}

const color = computed(() => statusMap[props.status]?.color || 'grey')
const label = computed(() => statusMap[props.status]?.label || props.status)
</script>
