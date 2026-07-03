<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentStore } from "~/stores/document";
import {
  ownerTypeOptions,
  documentCategoryOptions,
  useDocumentStatus,
} from "~/composables/useDocumentStatus";
import DocumentFormDialog from "~/components/document/DocumentFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import EmptyState from "~/components/shared/EmptyState.vue";

definePageMeta({
  layout: "admin",
  roles: ["admin", "maintenance", "dispatcher", "manager"],
});
useHead({ title: "Documentos" });

const store = useDocumentStore();
const { documents, expiring, ownerOptions, loading } = storeToRefs(store);
const {
  documentCategory,
  documentStatus,
  ownerType: ownerTypeLabel,
} = useDocumentStatus();

const tab = ref("manager");
const dialog = ref(false);
const confirm = ref(false);
const toDelete = ref<any | null>(null);

const headers = [
  { title: "Categoría", value: "category" },
  { title: "Número", value: "number" },
  { title: "Emisión", value: "issueDate" },
  { title: "Vencimiento", value: "expiryDate" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions" },
];

const STATUS_HEX: Record<string, string> = {
  valid: "#4CAF50",
  expiring: "#FF9800",
  expired: "#F44336",
};
const statusHex = (s: string) => STATUS_HEX[s] ?? "#9E9E9E";

const canAdd = () => store.ownerType === "company" || !!store.ownerId;

const askDelete = (d: any) => {
  toDelete.value = d;
  confirm.value = true;
};
const onConfirmDelete = async (payload: { resp: boolean }) => {
  if (payload.resp && toDelete.value)
    await store.deleteDocument(toDelete.value.id);
  toDelete.value = null;
};

watch(
  () => store.ownerType,
  async (t) => {
    store.ownerId = null;
    await store.loadOwnerOptions(t);
    store.getDocuments();
  },
);
watch(
  () => [store.ownerId, store.category],
  () => store.getDocuments(),
);

onMounted(async () => {
  await store.loadOwnerOptions(store.ownerType);
  store.getDocuments();
  store.getExpiring();
});
</script>

<template>
  <div>
    <PageHeader
      title="Centro Documental"
      subtitle="Documentación de unidades, choferes y empresa"
    />

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="manager">Gestor</v-tab>
      <v-tab value="expiring">
        Vencimientos
        <v-badge
          v-if="expiring.length"
          :content="expiring.length"
          color="error"
          inline
          class="ml-2"
        />
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- GESTOR -->
      <v-window-item value="manager">
        <div class="d-flex flex-wrap ga-2 align-center mb-3">
          <v-select
            v-model="store.ownerType"
            :items="ownerTypeOptions"
            item-title="label"
            item-value="value"
            label="Entidad"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 180px"
          />
          <v-select
            v-if="store.ownerType !== 'company'"
            v-model="store.ownerId"
            :items="ownerOptions"
            item-title="label"
            item-value="id"
            label="Seleccionar"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 220px"
          />
          <v-select
            v-model="store.category"
            :items="documentCategoryOptions"
            item-title="label"
            item-value="value"
            label="Categoría"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 200px"
          />
          <v-spacer />
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            :disabled="!canAdd()"
            @click="dialog = true"
          >
            Nuevo documento
          </v-btn>
        </div>

        <ResponsiveTable
          :headers="headers"
          :items="documents"
          :loading="loading"
          :error="store.error"
          all-items
          @retry="store.getDocuments()"
        >
          <template #item.category="{ item }">
            {{ documentCategory(item.category).label }}
          </template>
          <template #item.status="{ item }">
            <v-chip
              :color="documentStatus(item.status).color"
              size="small"
              label
            >
              {{ documentStatus(item.status).label }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-file-eye"
              aria-label="Ver archivo"
              size="small"
              variant="text"
              @click="store.openFile(item.id)"
            />
            <v-btn
              icon="mdi-delete"
              aria-label="Eliminar"
              size="small"
              variant="text"
              color="error"
              @click="askDelete(item)"
            />
          </template>
        </ResponsiveTable>
      </v-window-item>

      <!-- VENCIMIENTOS -->
      <v-window-item value="expiring">
        <EmptyState
          v-if="!expiring.length"
          icon="mdi-check-circle-outline"
          text="No hay documentos por vencer ni vencidos."
        />
        <v-card
          v-for="d in expiring"
          :key="d.id"
          border
          flat
          rounded="lg"
          class="mb-3 alert-card"
          :style="`--accent: ${statusHex(d.status)}`"
        >
          <div class="d-flex align-center ga-3 pa-3">
            <v-avatar rounded="lg" size="44">
              <v-icon :color="documentStatus(d.status).color" size="22"
                >mdi-file-alert-outline</v-icon
              >
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-center ga-2 flex-wrap">
                <span class="text-subtitle-2 font-weight-bold">
                  {{ documentCategory(d.category).label }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  {{ ownerTypeLabel(d.ownerType).label }}
                </span>
              </div>
              <div
                class="d-flex align-center ga-1 text-caption text-medium-emphasis mt-1"
              >
                <v-icon size="14">mdi-calendar-clock</v-icon>
                <span>Vence {{ d.expiryDate || "-" }}</span>
              </div>
            </div>
            <v-chip
              :color="documentStatus(d.status).color"
              size="small"
              label
              variant="flat"
            >
              {{ documentStatus(d.status).label }}
            </v-chip>
          </div>
        </v-card>
      </v-window-item>
    </v-window>

    <DocumentFormDialog
      v-model="dialog"
      :owner-type="store.ownerType"
      :owner-id="store.ownerId"
      @saved="store.getDocuments()"
    />
    <ModalConfirm
      v-model="confirm"
      title="Eliminar documento"
      description="<p>¿Eliminar este documento?</p>"
      @save="onConfirmDelete"
    />
  </div>
</template>

<style scoped>
.alert-card {
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}
.alert-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--accent, #9e9e9e);
}
.alert-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.min-w-0 {
  min-width: 0;
}
</style>
