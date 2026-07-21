<script setup lang="ts">
import { watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useOeaStore } from "~/stores/oea";
import { useOea, oeaSectionLabels } from "~/composables/useOea";

const props = defineProps<{
  modelValue: boolean;
  inspectionId: string | null;
}>();

const emit = defineEmits(["update:modelValue"]);

const store = useOeaStore();
const { current, loading } = storeToRefs(store);
const { oeaResult, oeaItemStatus } = useOea();

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.inspectionId) store.getOne(props.inspectionId);
  },
);

const sections = computed(() => {
  const items = current.value?.items ?? [];
  return ["physical", "security_devices"]
    .map((sec) => ({
      key: sec,
      label: oeaSectionLabels[sec],
      items: items.filter((i) => i.section === sec),
    }))
    .filter((s) => s.items.length);
});

// Aquí se muestra el momento exacto de la inspección: fecha + hora.
const { fmtDateTime: fmtDate } = useFormatters();

const close = () => emit("update:modelValue", false);

const dataRows = computed(() => {
  const c = current.value;
  if (!c) return [];
  return [
    { label: "Camión", value: c.truck?.plate },
    { label: "Chofer", value: driverName(c.driver) },
    { label: "Nº de viaje", value: c.tripNumber },
    { label: "Origen → Destino", value: c.origin ? `${c.origin} → ${c.destination}` : null },
    { label: "Carga", value: c.cargoDescription },
    { label: "Peso (kg)", value: c.cargoWeightKg },
    { label: "Precinto aduanero", value: c.customsSealNumber },
    { label: "Precinto de seguridad", value: c.securitySealNumber },
    { label: "DNI chofer", value: c.driverDocument },
    { label: "Licencia", value: c.driverLicense },
    { label: "Inspección", value: fmtDate(c.inspectedAt) },
    { label: "Firmada", value: c.signedAt ? fmtDate(c.signedAt) : "Sin firmar" },
  ].filter((r) => r.value != null && r.value !== "");
});
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="1040" scrollable @update:model-value="close">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-bold">Planilla OEA</span>
        <v-chip
          v-if="current"
          :color="oeaResult(current.result).color"
          size="small"
          label
        >
          {{ oeaResult(current.result).label }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <div v-if="loading && !current" class="d-flex justify-center my-6">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!--
          En md+ la planilla se abre en dos columnas: a la izquierda los datos
          del viaje, a la derecha los ítems inspeccionados. Así entra completa
          sin scroll; en mobile las columnas se apilan como antes.
        -->
        <v-row v-else-if="current" dense>
          <v-col cols="12" md="5">
            <v-sheet border rounded="lg" class="pa-3">
              <div class="text-subtitle-2 font-weight-bold mb-2">Datos del viaje</div>
              <div
                v-for="row in dataRows"
                :key="row.label"
                class="d-flex align-start justify-space-between ga-3 py-1 oea-data-row"
              >
                <span class="text-caption text-medium-emphasis">{{ row.label }}</span>
                <span class="text-body-2 font-weight-medium text-end">{{ row.value }}</span>
              </div>
            </v-sheet>
          </v-col>

          <v-col cols="12" md="7">
            <v-sheet
              v-for="sec in sections"
              :key="sec.key"
              border
              rounded="lg"
              class="pa-3 mb-2"
            >
              <div class="text-subtitle-2 font-weight-bold mb-1">{{ sec.label }}</div>
              <v-list density="compact" class="py-0 bg-transparent">
                <v-list-item
                  v-for="item in sec.items"
                  :key="item.id"
                  class="px-0"
                >
                  <template #title>
                    <span class="text-body-2">{{ item.label }}</span>
                  </template>
                  <template #subtitle>
                    <span v-if="item.notes" class="text-caption">{{ item.notes }}</span>
                  </template>
                  <template #append>
                    <v-chip :color="oeaItemStatus(item.status).color" size="x-small" label>
                      {{ oeaItemStatus(item.status).label }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-sheet>

            <v-alert
              v-if="current.notes"
              type="info"
              variant="tonal"
              density="compact"
            >
              {{ current.notes }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Línea suave entre datos, más liviana que la grilla de una v-table. */
.oea-data-row + .oea-data-row {
  border-top: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
}
</style>
