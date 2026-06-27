<template>
  <ResponsiveTable
    :headers="headers"
    :items="data"
    fixed-header
    no-data-text="No hay registros"
  >
  </ResponsiveTable>
</template>

<script setup lang="ts">
import type { ItemResponseFile } from "~/types/project";

const props = defineProps({
  data: {
    type: Array as () => ItemResponseFile[],
    required: true,
  },
  error: {
    type: Boolean,
    default: false,
  },
});

const headers = computed(() => {
  const temp = [
    { title: "Nombre", value: "name", minWidth: "200px" },
    { title: "DNI", value: "dni" },
    { title: "Email", value: "email" },
  ];
  if (props.error) {
    temp.push({
      title: "Fila",
      value: "row",
    });
    temp.push({
      title: "Error",
      value: "error",
      minWidth: "200px",
    });
  }
  return temp;
});
</script>

<style scoped></style>
