<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useSettlementStore } from "~/stores/settlement";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Settlement } from "~/types/trip";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "auditor"],
});

useHead({ title: "Rendiciones" });

const settlementStore = useSettlementStore();
const { settlements, finishedTrips, loading, pagination } =
  storeToRefs(settlementStore);

const genDialog = ref(false);
const selectedTrip = ref("");
const generating = ref(false);
const confirm = ref(false);
const toClose = ref<Settlement | null>(null);

const statusOptions = [
  { value: "draft", label: "Borrador", color: "warning" },
  { value: "closed", label: "Cerrada", color: "success" },
];

const headers = [
  { title: "Viaje", value: "trip.code" },
  { title: "Chofer", value: "driverName", sortable: false },
  { title: "Gastos", value: "totalExpenses" },
  { title: "Adelantos", value: "totalAdvances" },
  { title: "Neto", value: "netToSettle" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions" },
];

const money = (n?: number) => `$ ${Number(n ?? 0).toFixed(2)}`;
const statusOf = (v: string) =>
  statusOptions.find((s) => s.value === v) ?? { label: v, color: "grey" };

const openGenerate = async () => {
  selectedTrip.value = "";
  await settlementStore.loadFinishedTrips();
  genDialog.value = true;
};
const doGenerate = async () => {
  if (!selectedTrip.value) return;
  generating.value = true;
  const ok = await settlementStore.generate(selectedTrip.value);
  generating.value = false;
  if (ok) genDialog.value = false;
};
const askClose = (s: Settlement) => {
  toClose.value = s;
  confirm.value = true;
};
const onConfirmClose = async (payload: { resp: boolean }) => {
  if (payload.resp && toClose.value) await settlementStore.close(toClose.value.id);
  toClose.value = null;
};
const changePage = (page: number) => {
  pagination.value.currentPage = page;
  settlementStore.getSettlements();
};

onMounted(() => settlementStore.getSettlements());
</script>

<template>
  <div>
    <PageHeader title="Rendiciones" subtitle="Cierres de gastos por viaje o período">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-file-document-plus" @click="openGenerate">
          Generar rendición
        </v-btn>
      </template>
    </PageHeader>

    <div class="d-flex flex-wrap ga-2 align-center mb-3">
      <v-select
        v-model="settlementStore.filterStatus"
        :items="statusOptions"
        item-title="label"
        item-value="value"
        label="Estado"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        style="max-width: 220px"
        @update:model-value="settlementStore.getSettlements()"
      />
    </div>

    <ResponsiveTable :headers="headers" :items="settlements" :loading="loading" :error="settlementStore.error" all-items @retry="settlementStore.getSettlements()">
      <template #item.driverName="{ item }">{{ driverName(item.trip?.driver) }}</template>
      <template #item.totalExpenses="{ item }">{{ money(item.totalExpenses) }}</template>
      <template #item.totalAdvances="{ item }">{{ money(item.totalAdvances) }}</template>
      <template #item.netToSettle="{ item }">
        <span class="font-weight-bold">{{ money(item.netToSettle) }}</span>
      </template>
      <template #item.status="{ item }">
        <v-chip :color="statusOf(item.status).color" size="small" label>
          {{ statusOf(item.status).label }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-file-pdf-box" aria-label="Ver PDF"
          size="small"
          variant="text"
          color="error"
          @click="settlementStore.openPdf(item.id)"
        />
        <v-btn
          v-if="item.status === 'draft'"
          icon="mdi-lock-check"
          size="small"
          variant="text"
          color="success"
          @click="askClose(item)"
        />
      </template>
    </ResponsiveTable>

    <div v-if="pagination.totalPages > 1" class="d-flex justify-center mt-3">
      <v-pagination
        :model-value="pagination.currentPage"
        :length="pagination.totalPages"
        density="comfortable"
        @update:model-value="changePage"
      />
    </div>

    <!-- Diálogo generar -->
    <v-dialog v-model="genDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">Generar rendición</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedTrip"
            :items="finishedTrips"
            item-value="id"
            :item-title="(t: any) => `${t.code} · ${t.origin} → ${t.destination}`"
            label="Viaje finalizado"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="genDialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="generating" :disabled="!selectedTrip" @click="doGenerate">
            Generar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ModalConfirm
      v-model="confirm"
      title="Cerrar rendición"
      description="<p>¿Cerrar esta rendición? No podrá recalcularse.</p>"
      @save="onConfirmClose"
    />
  </div>
</template>
