<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, watch, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentStore } from "~/stores/document";
import {
  ownerTypeOptions,
  documentCategoryOptions,
  useDocumentStatus,
} from "~/composables/useDocumentStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import DocumentFormDialog from "~/components/document/DocumentFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "admin",
  roles: ["admin", "maintenance", "dispatcher", "manager"],
});
useHead({ title: "Documentos" });

const { fmtDate } = useFormatters();
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

// Filtros client-side de la pestaña Vencimientos (la lista ya viene completa).
const expSearch = ref("");
const expStatus = ref<string | null>(null);
const expOwnerType = ref<string | null>(null);
// Solo "por vencer" y "vencido" aplican a esta bandeja.
const expStatusOptions = [
  { value: "expiring", label: "Por vencer" },
  { value: "expired", label: "Vencido" },
];

const filteredExpiring = computed(() => {
  const q = expSearch.value.trim().toLowerCase();
  return expiring.value.filter((d) => {
    if (expStatus.value && d.status !== expStatus.value) return false;
    if (expOwnerType.value && d.ownerType !== expOwnerType.value) return false;
    if (!q) return true;
    const haystack = [
      documentCategory(d.category).label,
      d.owner?.label,
      d.owner?.sublabel,
      d.number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
});

const headers = [
  { title: "Categoría", value: "category" },
  { title: "Número", value: "number" },
  { title: "Emisión", value: "issueDate" },
  { title: "Vencimiento", value: "expiryDate" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
];

const STATUS_HEX: Record<string, string> = {
  valid: "#4CAF50",
  expiring: "#FF9800",
  expired: "#F44336",
};
const statusHex = (s: string) => STATUS_HEX[s] ?? "#9E9E9E";

const canAdd = () => store.ownerType === "company" || !!store.ownerId;

const OWNER_ICON: Record<string, string> = {
  truck: "mdi-truck",
  trailer: "mdi-truck-trailer",
  driver: "mdi-account",
  company: "mdi-office-building",
};
const ownerIcon = (t: string) => OWNER_ICON[t] ?? "mdi-file";

// La bandeja de mensajes no está habilitada para mantenimiento (ver roles de
// /admin/mensajes), así que solo mostramos el botón a quien puede usarla.
const auth = useAuthStore();
const canMessage = computed(
  () => auth.isAdmin || auth.isManager || auth.isDispatcher,
);

const messageDriver = (userId: string) =>
  navigateTo({ path: "/admin/mensajes", query: { user: userId } });

const openWhatsApp = (phone: string) => {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits) window.open(`https://wa.me/${digits}`, "_blank");
};

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
        <div class="d-flex flex-wrap ga-2 align-center mb-4">
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
          searchable
          search-label="Buscar número / categoría"
          @retry="store.getDocuments()"
        >
          <template #item.category="{ item }">
            {{ documentCategory(item.category).label }}
          </template>
          <template #item.issueDate="{ item }">
            {{ fmtDate(item.issueDate) }}
          </template>
          <template #item.expiryDate="{ item }">
            {{ fmtDate(item.expiryDate) }}
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
        <div
          v-if="expiring.length"
          class="d-flex flex-wrap ga-2 align-center mb-4"
        >
          <VoiceTextField
            v-model="expSearch"
            label="Buscar dueño / categoría / número"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="min-width: 240px; max-width: 360px"
          />
          <v-select
            v-model="expStatus"
            :items="expStatusOptions"
            item-title="label"
            item-value="value"
            label="Estado"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 180px"
          />
          <v-select
            v-model="expOwnerType"
            :items="ownerTypeOptions"
            item-title="label"
            item-value="value"
            label="Entidad"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 180px"
          />
        </div>

        <EmptyState
          v-if="!expiring.length"
          icon="mdi-check-circle-outline"
          text="No hay documentos por vencer ni vencidos."
        />
        <EmptyState
          v-else-if="!filteredExpiring.length"
          icon="mdi-filter-off-outline"
          text="Sin resultados para el filtro."
        />
        <v-card
          v-for="d in filteredExpiring"
          :key="d.id"
          border
          flat
          rounded="lg"
          class="mb-3 accent-card"
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
                <v-chip size="x-small" label variant="tonal">
                  {{ ownerTypeLabel(d.ownerType).label }}
                </v-chip>
              </div>

              <!-- Dueño: nombre del chofer / patente del camión -->
              <div class="d-flex align-center ga-1 mt-1">
                <v-icon size="14" class="text-medium-emphasis">
                  {{ ownerIcon(d.ownerType) }}
                </v-icon>
                <span class="text-body-2 font-weight-medium">
                  {{ d.owner?.label || "—" }}
                </span>
                <span
                  v-if="d.owner?.sublabel"
                  class="text-caption text-medium-emphasis"
                >
                  · {{ d.owner.sublabel }}
                </span>
              </div>

              <div
                class="d-flex align-center ga-3 text-caption text-medium-emphasis mt-1 flex-wrap"
              >
                <span v-if="d.number" class="d-flex align-center ga-1">
                  <v-icon size="14">mdi-pound</v-icon>{{ d.number }}
                </span>
                <span class="d-flex align-center ga-1">
                  <v-icon size="14">mdi-calendar-clock</v-icon>Vence
                  {{ fmtDate(d.expiryDate) }}
                </span>
              </div>
            </div>

            <div class="d-flex flex-column align-end ga-2">
              <v-chip
                :color="documentStatus(d.status).color"
                size="small"
                label
                variant="flat"
              >
                {{ documentStatus(d.status).label }}
              </v-chip>
              <div class="d-flex ga-1">
                <v-btn
                  v-if="d.fileKey"
                  icon="mdi-file-eye"
                  aria-label="Ver archivo"
                  size="small"
                  variant="text"
                  @click="store.openFile(d.id)"
                />
                <v-btn
                  v-if="d.owner?.phone"
                  icon="mdi-whatsapp"
                  aria-label="WhatsApp"
                  color="success"
                  size="small"
                  variant="text"
                  @click="openWhatsApp(d.owner.phone)"
                />
                <v-btn
                  v-if="d.owner?.userId && canMessage"
                  icon="mdi-message-text-outline"
                  aria-label="Enviar mensaje"
                  color="primary"
                  size="small"
                  variant="text"
                  @click="messageDriver(d.owner.userId)"
                />
              </div>
            </div>
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
