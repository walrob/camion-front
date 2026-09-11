<script setup lang="ts">
import { Feature } from "~/types/plan";
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMaintenanceStore } from "~/stores/maintenance";
import { useMaintenanceStatus } from "~/composables/useMaintenanceStatus";
import MaintenancePlanDialog from "~/components/maintenance/MaintenancePlanDialog.vue";
import MaintenanceOrderDialog from "~/components/maintenance/MaintenanceOrderDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import TableExcelActions from "~/components/shared/TableExcelActions.vue";
import EmptyState from "~/components/shared/EmptyState.vue";

definePageMeta({
  feature: Feature.MAINTENANCE,
  layout: "admin",
  roles: ["admin", "maintenance", "manager"],
});
useHead({ title: "Mantenimiento" });

const store = useMaintenanceStore();
const { plans, upcoming, orders, truckOptions, loading } = storeToRefs(store);
const { triggerType, planStatus, orderStatus } = useMaintenanceStatus();

const tab = ref("upcoming");
const planDialog = ref(false);
const selectedPlan = ref<any | null>(null);
const orderDialog = ref(false);
const selectedOrder = ref<any | null>(null);
const confirm = ref(false);
const toDelete = ref<any | null>(null);
// Filtro del historial de OT: vacío = todas las unidades.
const truckId = ref<string | null>(null);

const planHeaders = [
  { title: "Camión", value: "truck.plate" },
  { title: "Plan", value: "name" },
  { title: "Disparador", value: "triggerType" },
  { title: "Próximo", value: "next" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
];
// Sin camión elegido se ve todo el taller: hace falta la patente por fila.
const orderHeaders = computed(() => [
  ...(truckId.value ? [] : [{ title: "Camión", value: "truck.plate" }]),
  { title: "Fecha", value: "date" },
  { title: "Descripción", value: "description" },
  { title: "Costo", value: "cost" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
]);

const selectedPlate = computed(
  () => truckOptions.value.find((t) => t.id === truckId.value)?.plate,
);
const ordersEmptyText = computed(() =>
  truckId.value
    ? `${selectedPlate.value ?? "Este camión"} no tiene órdenes de trabajo.`
    : "Todavía no hay órdenes de trabajo. Elegí un camión para ver solo las suyas, o cargá la primera.",
);

const nextLabel = (p: any) =>
  p.triggerType === "date"
    ? fmtDate(p.nextDueAt)
    : p.nextDueKm != null
      ? `${p.nextDueKm} ${p.triggerType === "hours" ? "h" : "km"}`
      : "-";

const openNewPlan = () => {
  selectedPlan.value = null;
  planDialog.value = true;
};
const openEditPlan = (p: any) => {
  selectedPlan.value = p;
  planDialog.value = true;
};
const askDeletePlan = (p: any) => {
  toDelete.value = p;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value) await store.deletePlan(toDelete.value.id);
  toDelete.value = null;
};
const openNewOrder = () => {
  selectedOrder.value = null;
  orderDialog.value = true;
};
const openEditOrder = (o: any) => {
  selectedOrder.value = o;
  orderDialog.value = true;
};

// ── Órdenes finalizadas ─────────────────────────────────────────────────────
// Una OT finalizada no se edita: sus kilómetros y su fecha son la base desde la
// que el plan cuenta el próximo service. Se reabre con motivo y ahí sí.
const ordenCerrada = (o: any) => o?.status === "done";

const reapertura = ref<{ abierto: boolean; id: string }>({
  abierto: false,
  id: "",
});
const reabriendo = ref(false);

const pedirReapertura = (o: any) => {
  reapertura.value = { abierto: true, id: o.id };
};

const confirmarReapertura = async (motivo: string) => {
  reabriendo.value = true;
  const ok = await store.reopenOrder(reapertura.value.id, motivo);
  reabriendo.value = false;
  if (ok) reapertura.value.abierto = false;
};
const { moneyFixed: money, fmtDate } = useFormatters();

watch(truckId, (id) => store.getOrders(id));

onMounted(async () => {
  await Promise.all([
    store.getUpcoming(),
    store.getPlans(),
    store.getTruckOptions(),
    store.getOrders(truckId.value),
  ]);
});
</script>

<template>
  <div>
    <PageHeader
      title="Mantenimiento"
      subtitle="Planes preventivos y órdenes de trabajo"
    />

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="upcoming">Próximos</v-tab>
      <v-tab value="plans">Planes</v-tab>
      <v-tab value="orders">Órdenes</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- PRÓXIMOS -->
      <v-window-item value="upcoming">
        <p v-if="!upcoming.length" class="text-body-2 text-medium-emphasis">
          No hay servicios próximos.
        </p>
        <v-card
          v-for="u in upcoming"
          :key="u.plan.id"
          border
          flat
          rounded="lg"
          class="mb-3 accent-card"
          :style="`--accent: ${u.remaining < 0 ? '#F44336' : '#FF9800'}`"
        >
          <div class="pa-3">
            <div class="d-flex align-center ga-2">
              <v-avatar rounded="lg" size="40">
                <v-icon
                  :color="u.remaining < 0 ? 'error' : 'warning'"
                  size="20"
                >
                  mdi-wrench-clock
                </v-icon>
              </v-avatar>
              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <span class="text-subtitle-2 font-weight-bold">
                    {{ u.plan.truck?.plate }} · {{ u.plan.name }}
                  </span>
                  <v-chip
                    :color="u.remaining < 0 ? 'error' : 'warning'"
                    size="x-small"
                    label
                    variant="tonal"
                  >
                    {{ u.remaining < 0 ? "Vencido" : "Próximo" }}
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ u.reason }}
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-window-item>

      <!-- PLANES -->
      <v-window-item value="plans">
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-spacer />
          <TableExcelActions
            export-url="maintenance/plans/export/"
            export-name="planes-mantenimiento.xlsx"
            import-url="maintenance/plans/import/"
            template-url="maintenance/plans/import/template/"
            entidad="planes"
            :disabled="!plans.length"
            @imported="store.getPlans()"
          />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewPlan">
            Nuevo plan
          </v-btn>
        </div>
        <ResponsiveTable
          :headers="planHeaders"
          :items="plans"
          :loading="loading"
          :error="store.error"
          all-items
          searchable
          search-label="Buscar plan / camión"
          @retry="store.getPlans()"
        >
          <template #item.triggerType="{ item }">
            <v-chip
              :color="triggerType(item.triggerType).color"
              size="x-small"
              label
            >
              {{ triggerType(item.triggerType).label }}
            </v-chip>
          </template>
          <template #item.next="{ item }">{{ nextLabel(item) }}</template>
          <template #item.status="{ item }">
            <v-chip :color="planStatus(item.status).color" size="small" label>
              {{ planStatus(item.status).label }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <IconBtn
              tooltip="Editar plan"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="openEditPlan(item)"
            />
            <IconBtn
              tooltip="Eliminar plan"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="askDeletePlan(item)"
            />
          </template>
        </ResponsiveTable>
      </v-window-item>

      <!-- ÓRDENES -->
      <v-window-item value="orders">
        <div class="d-flex flex-wrap ga-2 align-center mb-4">
          <v-autocomplete
            v-model="truckId"
            :items="truckOptions"
            item-value="id"
            :item-title="(t: any) => t.plate"
            label="Camión"
            placeholder="Todos"
            persistent-placeholder
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 240px"
          />
          <v-spacer />
          <!--
            Solo descarga: una orden de trabajo mueve el estado del camión y
            actualiza el plan preventivo al cerrarse. Cargarlas desde un Excel
            saltearía esa cadena y dejaría la flota describiendo algo falso.
          -->
          <TableExcelActions
            export-url="maintenance/orders/export/"
            export-name="ordenes-mantenimiento.xlsx"
            :export-params="{ truckId: truckId || undefined }"
            :disabled="!orders.length"
          />
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openNewOrder"
          >
            Nueva OT
          </v-btn>
        </div>

        <ResponsiveTable
          :headers="orderHeaders"
          :items="orders"
          :loading="loading"
          :error="store.error"
          all-items
          searchable
          search-label="Buscar patente / descripción"
          empty-icon="mdi-wrench-outline"
          :no-data-text="ordersEmptyText"
          @retry="store.getOrders()"
        >
          <template #empty>
            <EmptyState icon="mdi-wrench-outline" :text="ordersEmptyText">
              <template #action>
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="openNewOrder"
                >
                  Nueva OT
                </v-btn>
              </template>
            </EmptyState>
          </template>
          <template #item.date="{ item }">{{ fmtDate(item.date) }}</template>
          <template #item.cost="{ item }">{{ money(item.cost) }}</template>
          <template #item.status="{ item }">
            <v-chip :color="orderStatus(item.status).color" size="small" label>
              {{ orderStatus(item.status).label }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <IconBtn
              tooltip="Orden de trabajo (PDF)"
              icon="mdi-file-pdf-box"
              size="small"
              variant="text"
              color="error"
              @click="store.openOrderPdf(item.id)"
            />
            <IconBtn
              v-if="!ordenCerrada(item)"
              tooltip="Editar orden"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="openEditOrder(item)"
            />
            <IconBtn
              v-else
              tooltip="Reabrir orden para corregirla"
              icon="mdi-lock-open-variant-outline"
              size="small"
              variant="text"
              @click="pedirReapertura(item)"
            />
          </template>
        </ResponsiveTable>
      </v-window-item>
    </v-window>

    <MaintenancePlanDialog
      v-model="planDialog"
      :plan="selectedPlan"
      @saved="store.getUpcoming()"
    />
    <MaintenanceOrderDialog
      v-model="orderDialog"
      :order="selectedOrder"
      :truck-id="truckId ?? ''"
      @saved="store.getUpcoming()"
    />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar plan"
      description="<p>¿Eliminar este plan de mantenimiento?</p>"
      @save="onConfirmDelete"
    />
    <ModalReopen
      v-model="reapertura.abierto"
      title="Reabrir orden de trabajo"
      description="Vuelve a quedar en proceso para poder corregirla."
      :loading="reabriendo"
      @confirm="confirmarReapertura"
    />
  </div>
</template>
