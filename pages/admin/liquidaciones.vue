<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, computed, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { useSettlementStore } from "~/stores/settlement";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import TablePagination from "~/components/shared/TablePagination.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import type { Settlement } from "~/types/trip";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "auditor"],
});

useHead({ title: "Rendiciones" });

const settlementStore = useSettlementStore();
const { settlements, pendingTrips, loading, pagination } =
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
  { title: "Acciones", value: "actions", sortable: false },
];

const { moneyFixed: money, fmtDate } = useFormatters();
const statusOf = (v: string) =>
  statusOptions.find((s) => s.value === v) ?? { label: v, color: "grey" };

// ── Diálogo "Generar rendición" ──────────────────────────────────────────────
// Solo viajes finalizados que todavía no tienen rendición: si el viaje ya está
// en la tabla de abajo, no se "genera" de nuevo, se recalcula desde su fila.
//
// Chofer y camión no consultan al backend: se derivan de los viajes pendientes
// ya cargados, así solo se ofrecen valores que tienen al menos un viaje para
// rendir (una lista completa de choferes dejaría elegir uno sin resultados).
const genDriver = ref<string | null>(null);
const genTruck = ref<string | null>(null);

const uniqueBy = <T,>(rows: T[], key: (r: T) => string | undefined) => {
  const map = new Map<string, T>();
  rows.forEach((r) => {
    const k = key(r);
    if (k && !map.has(k)) map.set(k, r);
  });
  return [...map.values()];
};

const genDriverOptions = computed(() =>
  uniqueBy(pendingTrips.value, (t: any) => t.driver?.id)
    .map((t: any) => ({ id: t.driver.id, label: driverName(t.driver) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
);

const genTruckOptions = computed(() =>
  uniqueBy(pendingTrips.value, (t: any) => t.truck?.id)
    .map((t: any) => ({ id: t.truck.id, label: t.truck.plate }))
    .sort((a, b) => a.label.localeCompare(b.label)),
);

const genTripOptions = computed(() =>
  pendingTrips.value
    .filter(
      (t: any) =>
        (!genDriver.value || t.driver?.id === genDriver.value) &&
        (!genTruck.value || t.truck?.id === genTruck.value),
    )
    .map((t: any) => ({
      id: t.id,
      label: t.code,
      subtitle: [
        `${t.origin} → ${t.destination}`,
        t.truck?.plate,
        fmtDate(t.plannedStartAt),
      ]
        .filter(Boolean)
        .join(" · "),
    })),
);

// El código solo no alcanza para reconocer el viaje: la segunda línea muestra
// recorrido, patente y fecha.
const tripItemProps = (item: any) => ({
  title: item.label,
  subtitle: item.subtitle,
});

// Si al filtrar el viaje elegido ya no está en la lista, se deselecciona: si no,
// el botón "Generar" quedaría habilitado con algo que no se ve.
watch([genDriver, genTruck], () => {
  if (
    selectedTrip.value &&
    !genTripOptions.value.some((t) => t.id === selectedTrip.value)
  ) {
    selectedTrip.value = "";
  }
});

const openGenerate = async () => {
  selectedTrip.value = "";
  genDriver.value = null;
  genTruck.value = null;
  await settlementStore.loadPendingTrips();
  genDialog.value = true;
};
const doGenerate = async () => {
  if (!selectedTrip.value) return;
  generating.value = true;
  const ok = await settlementStore.generate(selectedTrip.value);
  generating.value = false;
  if (ok) genDialog.value = false;
};
// Recalcular una rendición ya existente: mismo endpoint que "Generar", que para
// un viaje ya rendido actualiza totales y rehace el PDF. Solo en borrador.
const recalculating = ref<string | null>(null);
const recalculate = async (s: Settlement) => {
  recalculating.value = s.id;
  await settlementStore.generate(s.tripId);
  recalculating.value = null;
};

const askClose = (s: Settlement) => {
  toClose.value = s;
  confirm.value = true;
};
const onConfirmClose = async (payload: { resp: boolean }) => {
  if (payload.resp && toClose.value)
    await settlementStore.close(toClose.value.id);
  toClose.value = null;
};
// Al buscar volvemos a la primera página: la anterior puede no existir con el
// nuevo resultado.
const onSearch = useDebounceFn(() => {
  pagination.value.currentPage = 1;
  settlementStore.getSettlements();
}, 350);

const changePage = (page: number) => {
  pagination.value.currentPage = page;
  settlementStore.getSettlements();
};

onMounted(() => settlementStore.getSettlements());
</script>

<template>
  <div>
    <PageHeader
      title="Rendiciones"
      subtitle="Cierres de gastos por viaje o período"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-file-document-plus"
          @click="openGenerate"
        >
          Generar rendición
        </v-btn>
      </template>
    </PageHeader>

    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <VoiceTextField
        v-model="settlementStore.search"
        label="Buscar viaje / chofer"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="min-width: 240px; max-width: 360px"
        @update:model-value="onSearch"
      />
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

    <ResponsiveTable
      :headers="headers"
      :items="settlements"
      :loading="loading"
      :error="settlementStore.error"
      all-items
      sort-server
      @retry="settlementStore.getSettlements()"
      @sort="settlementStore.setSort"
    >
      <template #item.driverName="{ item }">{{
        driverName(item.trip?.driver)
      }}</template>
      <template #item.totalExpenses="{ item }">{{
        money(item.totalExpenses)
      }}</template>
      <template #item.totalAdvances="{ item }">{{
        money(item.totalAdvances)
      }}</template>
      <template #item.netToSettle="{ item }">
        <span class="font-weight-bold">{{ money(item.netToSettle) }}</span>
      </template>
      <template #item.status="{ item }">
        <v-chip :color="statusOf(item.status).color" size="small" label>
          {{ statusOf(item.status).label }}
        </v-chip>
      </template>
      <!--
        El PDF siempre se puede ver: si la rendición todavía no tiene uno, el
        back lo arma en el momento. Recalcular solo tiene sentido en borrador
        (el back rechaza las cerradas) y es lo que corresponde cuando el chofer
        cargó gastos después de generarla.
      -->
      <template #item.actions="{ item }">
        <v-tooltip text="Ver PDF" location="top">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp"
              icon="mdi-file-pdf-box"
              aria-label="Ver PDF"
              size="small"
              variant="text"
              color="error"
              @click="settlementStore.openPdf(item.id)"
            />
          </template>
        </v-tooltip>
        <v-tooltip
          v-if="item.status === 'draft'"
          text="Recalcular con los gastos actuales"
          location="top"
        >
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp"
              icon="mdi-refresh"
              aria-label="Recalcular"
              size="small"
              variant="text"
              color="warning"
              :loading="recalculating === item.id"
              @click="recalculate(item)"
            />
          </template>
        </v-tooltip>
        <v-tooltip
          v-if="item.status === 'draft'"
          text="Cerrar rendición"
          location="top"
        >
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp"
              icon="mdi-lock-check"
              aria-label="Cerrar rendición"
              size="small"
              variant="text"
              color="success"
              @click="askClose(item)"
            />
          </template>
        </v-tooltip>
      </template>
    </ResponsiveTable>

    <TablePagination
      :page="pagination.currentPage"
      :length="pagination.totalPages"
      @change="changePage"
    />

    <!-- Diálogo generar -->
    <v-dialog v-model="genDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold"
          >Generar rendición</v-card-title
        >
        <v-card-text>
          <!--
            Elegir el viaje de una sola lista era imposible cuando hay muchos:
            el chofer y el camión son los datos con los que uno lo recuerda, así
            que van primero y van achicando la lista de viajes. Son opcionales:
            si ya sabés el código, escribilo directo en el último campo.
          -->
          <v-autocomplete
            v-model="genDriver"
            :items="genDriverOptions"
            item-title="label"
            item-value="id"
            label="Chofer (opcional)"
            density="comfortable"
            clearable
            no-data-text="Sin choferes con viajes finalizados"
            class="mb-3"
          />
          <v-autocomplete
            v-model="genTruck"
            :items="genTruckOptions"
            item-title="label"
            item-value="id"
            label="Camión (opcional)"
            density="comfortable"
            clearable
            no-data-text="Sin camiones con viajes finalizados"
            class="mb-3"
          />
          <v-autocomplete
            v-model="selectedTrip"
            :items="genTripOptions"
            item-title="label"
            item-value="id"
            :item-props="tripItemProps"
            label="Viaje finalizado"
            density="comfortable"
            clearable
            no-data-text="Ningún viaje coincide con ese chofer y camión"
          />
          <p class="text-caption text-medium-emphasis mt-1 mb-0">
            {{ genTripOptions.length }}
            {{ genTripOptions.length === 1 ? "viaje" : "viajes" }} para rendir
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="genDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="generating"
            :disabled="!selectedTrip"
            @click="doGenerate"
          >
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
