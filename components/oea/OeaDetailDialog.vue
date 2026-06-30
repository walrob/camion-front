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

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString("es-AR") : "-";

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
  <v-dialog :model-value="modelValue" max-width="640" scrollable @update:model-value="close">
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

        <template v-else-if="current">
          <v-table density="compact" class="mb-3">
            <tbody>
              <tr v-for="row in dataRows" :key="row.label">
                <td class="text-medium-emphasis">{{ row.label }}</td>
                <td class="font-weight-medium">{{ row.value }}</td>
              </tr>
            </tbody>
          </v-table>

          <template v-for="sec in sections" :key="sec.key">
            <p class="text-subtitle-2 font-weight-bold mt-2 mb-1">{{ sec.label }}</p>
            <v-list density="compact" class="py-0">
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
          </template>

          <v-alert
            v-if="current.notes"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ current.notes }}
          </v-alert>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
