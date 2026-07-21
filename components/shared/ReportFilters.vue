<script setup lang="ts">
// Barra de filtros de reportes: flota / camión / chofer / rango de fechas. La
// usan los tableros que filtran por flota (Combustible, Indicadores) y —con
// `show-fleet="false"` y un filtro extra por el slot— también OEA.
//
// Va sobre el fondo de la página, sin card: es la misma fila transparente que
// usan las pantallas de listado (Viajes, Choferes, Flota…). Los campos toman
// variant/density de los defaults globales de Vuetify.
//
// Los filtros se aplican solos al cambiar, como en el resto de la app: no hay
// botón "Aplicar". El watch es profundo sobre `filters` para que también
// dispare con los filtros propios de cada página (slot `extra`), y espera un
// momento para que tocar varios campos seguidos no genere una consulta por
// cada uno —los reportes agregan y son caros—.
//
// El objeto `filters` se muta por referencia (es el mismo proxy reactivo de
// `store.filters`), igual que cuando las páginas hacían `v-model="store.filters.x"`.
const props = defineProps<{
  filters: Record<string, any>;
  truckOptions?: any[];
  driverOptions?: any[];
  fleetOptions?: any[];
  /** Muestra el selector de flota (tableros que agregan por flota). */
  showFleet?: boolean;
}>();

const emit = defineEmits<{ apply: [] }>();

let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.filters,
  () => {
    clearTimeout(timer);
    timer = setTimeout(() => emit("apply"), 350);
  },
  { deep: true },
);

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="d-flex flex-wrap ga-2 align-center mb-4">
    <v-select
      v-if="showFleet"
      v-model="filters.fleetId"
      :items="fleetOptions"
      item-title="name"
      item-value="id"
      label="Flota"
      clearable
      style="min-width: 160px; max-width: 200px"
    />
    <v-select
      v-model="filters.truckId"
      :items="truckOptions"
      item-value="id"
      :item-title="(t: any) => t.plate"
      label="Camión"
      clearable
      style="min-width: 160px; max-width: 200px"
    />
    <v-select
      v-model="filters.driverId"
      :items="driverOptions"
      item-value="id"
      :item-title="(d: any) => driverName(d)"
      label="Chofer"
      clearable
      style="min-width: 160px; max-width: 220px"
    />

    <!-- Filtros específicos de la página (ej. Resultado en OEA). -->
    <slot name="extra" />

    <v-text-field
      v-model="filters.from"
      label="Desde"
      type="date"
      style="max-width: 170px"
    />
    <v-text-field
      v-model="filters.to"
      label="Hasta"
      type="date"
      style="max-width: 170px"
    />
  </div>
</template>
