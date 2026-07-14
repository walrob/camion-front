<script setup lang="ts">
// Card de filtros de reportes: flota / camión / chofer / rango de fechas + botón
// "Aplicar". La usan los tableros que filtran por flota (Combustible, Indicadores)
// y —con `show-fleet="false"` y un filtro extra por el slot— también OEA.
//
// El objeto `filters` se muta por referencia (es el mismo proxy reactivo de
// `store.filters`), igual que cuando las páginas hacían `v-model="store.filters.x"`.
defineProps<{
  filters: Record<string, any>;
  truckOptions?: any[];
  driverOptions?: any[];
  fleetOptions?: any[];
  loading?: boolean;
  /** Muestra el selector de flota (tableros que agregan por flota). */
  showFleet?: boolean;
}>();

defineEmits<{ apply: [] }>();
</script>

<template>
  <v-card border flat rounded="lg" class="pa-3 mb-4">
    <v-row dense align="center">
      <v-col v-if="showFleet" cols="12" sm="6" md="2">
        <v-select
          v-model="filters.fleetId"
          :items="fleetOptions"
          item-title="name"
          item-value="id"
          label="Flota"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="filters.truckId"
          :items="truckOptions"
          item-value="id"
          :item-title="(t: any) => t.plate"
          label="Camión"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="filters.driverId"
          :items="driverOptions"
          item-value="id"
          :item-title="(d: any) => driverName(d)"
          label="Chofer"
          clearable
        />
      </v-col>

      <!-- Filtros específicos de la página (ej. Resultado en OEA). -->
      <slot name="extra" />

      <v-col cols="6" sm="3" md="2">
        <v-text-field v-model="filters.from" label="Desde" type="date" />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field v-model="filters.to" label="Hasta" type="date" />
      </v-col>
      <v-col cols="12" class="d-flex justify-end">
        <v-btn
          color="primary"
          prepend-icon="mdi-filter-check-outline"
          :loading="loading"
          @click="$emit('apply')"
        >
          Aplicar
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>
