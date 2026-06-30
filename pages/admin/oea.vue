<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import ResponsiveTable from "~/components/ResponsiveTable.vue";
import OeaDetailDialog from "~/components/oea/OeaDetailDialog.vue";
import { useOeaStore } from "~/stores/oea";
import { useOea, oeaResultOptions } from "~/composables/useOea";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher", "auditor"],
});
useHead({ title: "Planillas OEA" });

const store = useOeaStore();
const { list, meta, loading } = storeToRefs(store);
const { oeaResult } = useOea();

const truckOptions = ref<any[]>([]);
const driverOptions = ref<any[]>([]);
const page = ref(1);

const detailOpen = ref(false);
const detailId = ref<string | null>(null);

const headers = [
  { title: "Fecha", value: "inspectedAt" },
  { title: "Camión", value: "truck.plate" },
  { title: "Chofer", value: "driverName", sortable: false },
  { title: "Viaje", value: "tripNumber" },
  { title: "Resultado", value: "result" },
  { title: "", value: "actions" },
];

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("es-AR") : "-";

const openDetail = (id: string) => {
  detailId.value = id;
  detailOpen.value = true;
};

const apply = () => {
  page.value = 1;
  store.getList(1);
};

onMounted(async () => {
  const { $api } = useNuxtApp();
  const [trucks, drivers] = await Promise.all([
    $api.get("trucks/", { params: { limit: 100 } }),
    $api.get("drivers/", { params: { limit: 100 } }),
  ]);
  truckOptions.value = trucks.data.items;
  driverOptions.value = drivers.data.items;
  store.getList(1);
});
</script>

<template>
  <div>
    <PageHeader
      title="Planillas OEA"
      subtitle="Control de seguridad y auditoría de camiones (Operador Económico Autorizado)"
    />

    <!-- Filtros -->
    <v-card border flat rounded="lg" class="pa-3 mb-4">
      <v-row dense align="center">
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.truckId"
            :items="truckOptions"
            item-value="id"
            :item-title="(t: any) => t.plate"
            label="Camión"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.driverId"
            :items="driverOptions"
            item-value="id"
            :item-title="(d: any) => driverName(d)"
            label="Chofer"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="store.filters.result"
            :items="oeaResultOptions"
            item-title="label"
            item-value="value"
            label="Resultado"
            clearable
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field v-model="store.filters.from" label="Desde" type="date" />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field v-model="store.filters.to" label="Hasta" type="date" />
        </v-col>
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            color="primary"
            prepend-icon="mdi-filter-check-outline"
            :loading="loading"
            @click="apply"
          >
            Aplicar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <ResponsiveTable
      :headers="headers"
      :items="list"
      :loading="loading"
      no-data-text="No hay planillas registradas"
    >
      <template #item.driverName="{ item }">{{ driverName(item.driver) }}</template>
      <template #item.inspectedAt="{ item }">{{ fmtDate(item.inspectedAt) }}</template>
      <template #item.tripNumber="{ item }">{{ item.tripNumber || "-" }}</template>
      <template #item.result="{ item }">
        <v-chip :color="oeaResult(item.result).color" size="small" label>
          {{ oeaResult(item.result).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-eye"
          aria-label="Ver detalle"
          size="small"
          variant="text"
          @click="openDetail(item.id)"
        />
      </template>
    </ResponsiveTable>

    <div v-if="meta && meta.totalPages > 1" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="page"
        :length="meta.totalPages"
        :total-visible="6"
        @update:model-value="store.getList(page)"
      />
    </div>

    <OeaDetailDialog v-model="detailOpen" :inspection-id="detailId" />
  </div>
</template>
