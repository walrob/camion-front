<template>
  <v-chip :color="color" size="small" variant="flat">
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
import type { Priority } from '~/types/enums'

const props = defineProps<{ priority: Priority }>()

const priorityMap: Record<Priority, { color: string; label: string }> = {
  baja: { color: 'grey', label: 'Baja' },
  normal: { color: 'blue', label: 'Normal' },
  alta: { color: 'orange', label: 'Alta' },
  urgente: { color: 'error', label: 'Urgente' },
}

const color = computed(() => priorityMap[props.priority]?.color || 'grey')
const label = computed(() => priorityMap[props.priority]?.label || props.priority)
</script>
