<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import ResponsiveTable from "~/components/ResponsiveTable.vue";
import ReportFilters from "~/components/shared/ReportFilters.vue";
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
const { fmtDate } = useFormatters();

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
  { title: "", value: "actions", sortable: false },
];

const openDetail = (id: string) => {
  detailId.value = id;
  detailOpen.value = true;
};

const apply = () => {
  page.value = 1;
  store.getList(1);
};

// El orden (server-side) recarga desde la primera página; sincronizamos el
// control de paginación local.
const onSort = (sort: { key: string | null; order: "asc" | "desc" | null }) => {
  page.value = 1;
  store.setSort(sort);
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

    <ReportFilters
      :filters="store.filters"
      :truck-options="truckOptions"
      :driver-options="driverOptions"
      @apply="apply"
    >
      <template #extra>
        <v-select
          v-model="store.filters.result"
          :items="oeaResultOptions"
          item-title="label"
          item-value="value"
          label="Resultado"
          clearable
          style="min-width: 160px; max-width: 200px"
        />
      </template>
    </ReportFilters>

    <ResponsiveTable
      :headers="headers"
      :items="list"
      :loading="loading"
      all-items
      sort-server
      no-data-text="No hay planillas registradas"
      @sort="onSort"
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
