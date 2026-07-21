<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMaintenanceStore } from "~/stores/maintenance";
import { useMaintenanceStatus } from "~/composables/useMaintenanceStatus";
import MaintenancePlanDialog from "~/components/maintenance/MaintenancePlanDialog.vue";
import MaintenanceOrderDialog from "~/components/maintenance/MaintenanceOrderDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";

definePageMeta({
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
const truckId = ref("");

const planHeaders = [
  { title: "Camión", value: "truck.plate" },
  { title: "Plan", value: "name" },
  { title: "Disparador", value: "triggerType" },
  { title: "Próximo", value: "next" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
];
const orderHeaders = [
  { title: "Fecha", value: "date" },
  { title: "Descripción", value: "description" },
  { title: "Costo", value: "cost" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
];

const truckPlans = computed(() =>
  plans.value.filter((p) => p.truckId === truckId.value),
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
const { moneyFixed: money, fmtDate } = useFormatters();

watch(truckId, (id) => {
  if (id) store.getOrders(id);
});

onMounted(async () => {
  await Promise.all([
    store.getUpcoming(),
    store.getPlans(),
    store.getTruckOptions(),
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
        <div class="d-flex mb-3">
          <v-spacer />
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
            <v-btn
              icon="mdi-pencil"
              aria-label="Editar"
              size="small"
              variant="text"
              @click="openEditPlan(item)"
            />
            <v-btn
              icon="mdi-delete"
              aria-label="Eliminar"
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
          <v-select
            v-model="truckId"
            :items="truckOptions"
            item-value="id"
            :item-title="(t: any) => t.plate"
            label="Camión"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 240px"
          />
          <v-spacer />
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            :disabled="!truckId"
            @click="openNewOrder"
          >
            Nueva OT
          </v-btn>
        </div>

        <ResponsiveTable
          v-if="truckId"
          :headers="orderHeaders"
          :items="orders"
          :loading="loading"
          :error="store.error"
          all-items
          @retry="store.getOrders(truckId)"
        >
          <template #item.date="{ item }">{{ fmtDate(item.date) }}</template>
          <template #item.cost="{ item }">{{ money(item.cost) }}</template>
          <template #item.status="{ item }">
            <v-chip :color="orderStatus(item.status).color" size="small" label>
              {{ orderStatus(item.status).label }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              aria-label="Editar"
              size="small"
              variant="text"
              @click="openEditOrder(item)"
            />
          </template>
        </ResponsiveTable>
        <p v-else class="text-body-2 text-medium-emphasis">
          Elegí un camión para ver sus órdenes de trabajo.
        </p>
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
      :truck-id="truckId"
      :plans="truckPlans"
      @saved="store.getUpcoming()"
    />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar plan"
      description="<p>¿Eliminar este plan de mantenimiento?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>
