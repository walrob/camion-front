<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, watch, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentStore } from "~/stores/document";
import { ownerTypeOptions, useDocumentStatus } from "~/composables/useDocumentStatus";
import { useCatalogOptions, CATALOG } from "~/stores/catalog";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import DocumentFormDialog from "~/components/document/DocumentFormDialog.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import TableExcelActions from "~/components/shared/TableExcelActions.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "admin",
  roles: ["admin", "maintenance", "dispatcher", "manager"],
});
useHead({ title: "Documentos" });

// Las categorías las define cada empresa (docs/CONFIGURACION.md §5).
const categoriasDoc = useCatalogOptions(CATALOG.DOCUMENT_CATEGORY);

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

// Plazo hasta el vencimiento: los mismos cortes que el panel
// (`DashboardService.documentExpirations`). Un plazo excluye lo ya vencido.
const expPlazo = ref<string | null>(null);
const expPlazoOptions = [
  { value: "in7", label: "≤ 7 días", desde: 0, hasta: 7 },
  { value: "in30", label: "8 a 30 días", desde: 8, hasta: 30 },
  { value: "in90", label: "31 a 90 días", desde: 31, hasta: 90 },
];
/** Días desde hoy hasta el vencimiento (negativo si ya venció). */
const diasHasta = (expiryDate?: string | null) => {
  if (!expiryDate) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [y, m, d] = expiryDate.slice(0, 10).split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - hoy.getTime()) / 86_400_000);
};

const filteredExpiring = computed(() => {
  const q = expSearch.value.trim().toLowerCase();
  const plazo = expPlazoOptions.find((p) => p.value === expPlazo.value);
  return expiring.value.filter((d) => {
    if (expStatus.value && d.status !== expStatus.value) return false;
    if (expOwnerType.value && d.ownerType !== expOwnerType.value) return false;
    if (plazo) {
      const dias = diasHasta(d.expiryDate);
      if (dias === null || dias < plazo.desde || dias > plazo.hasta) return false;
    }
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

// Sin dueño elegido la tabla lista toda la entidad, así que hace falta ver de
// quién es cada documento. Con un dueño (o para la empresa) la columna sobra.
const showOwner = computed(
  () => store.ownerType !== "company" && !store.ownerId,
);
const headers = computed(() => [
  ...(showOwner.value ? [{ title: "Dueño", value: "owner.label" }] : []),
  { title: "Categoría", value: "category" },
  { title: "Número", value: "number" },
  { title: "Emisión", value: "issueDate" },
  { title: "Vencimiento", value: "expiryDate" },
  { title: "Estado", value: "status" },
  { title: "Acciones", value: "actions", sortable: false },
]);

// Texto del vacío según el filtro: no es lo mismo "no hay nada cargado" que
// "este camión no tiene documentos".
const OWNER_PLURAL: Record<string, string> = {
  truck: "camiones",
  trailer: "acoplados",
  driver: "choferes",
};
const selectedOwnerLabel = computed(
  () => ownerOptions.value.find((o) => o.id === store.ownerId)?.label,
);
const emptyText = computed(() => {
  if (store.ownerType === "company")
    return "La empresa todavía no tiene documentos cargados.";
  if (store.ownerId)
    return `${selectedOwnerLabel.value ?? "Este registro"} no tiene documentos cargados.`;
  return `Todavía no hay documentos de ${OWNER_PLURAL[store.ownerType] ?? "esta entidad"}. Elegí uno en el selector para ver solo los suyos, o cargá el primero.`;
});

const STATUS_HEX: Record<string, string> = {
  valid: "#4CAF50",
  expiring: "#FF9800",
  expired: "#F44336",
};
const statusHex = (s: string) => STATUS_HEX[s] ?? "#9E9E9E";

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

const route = useRoute();
// Bandera para que los watchers no interfieran mientras aplicamos la
// preselección por query (?ownerType&ownerId) al entrar desde Flota.
const applyingQuery = ref(false);

watch(
  () => store.ownerType,
  async (t) => {
    // Al preseleccionar desde otra pantalla (?ownerType&ownerId) no reseteamos
    // el dueño elegido: eso lo maneja el flujo de query en onMounted.
    if (applyingQuery.value) return;
    store.ownerId = null;
    await store.loadOwnerOptions(t);
    store.getDocuments();
  },
);
watch(
  () => [store.ownerId, store.category],
  () => {
    if (applyingQuery.value) return;
    store.getDocuments();
  },
);

/**
 * Desde el panel se llega a la pestaña Vencimientos con el corte ya aplicado
 * (?tab=expiring&ventana=expired|in7|in30|in90). Los plazos piden la lista
 * hasta su tope en días: la bandeja normal sólo trae lo que entra en la
 * ventana de aviso de la empresa y dejaría vacío el corte "31 a 90 días".
 */
const aplicarVentana = (ventana: string): number | undefined => {
  if (ventana === "expired") {
    expStatus.value = "expired";
    return undefined;
  }
  const plazo = expPlazoOptions.find((p) => p.value === ventana);
  if (!plazo) return undefined;
  expPlazo.value = plazo.value;
  return plazo.hasta;
};

onMounted(async () => {
  const qType = route.query.ownerType;
  const qId = route.query.ownerId;
  const qTab = route.query.tab;
  const qVentana = route.query.ventana;

  let diasVencimientos: number | undefined;
  if (qTab === "expiring") {
    tab.value = "expiring";
    if (typeof qVentana === "string") diasVencimientos = aplicarVentana(qVentana);
  }

  // Llegada desde Flota (u otra pantalla) con el dueño ya elegido.
  if (typeof qType === "string") {
    applyingQuery.value = true;
    store.ownerType = qType;
    await store.loadOwnerOptions(qType);
    store.ownerId = typeof qId === "string" ? qId : null;
    applyingQuery.value = false;
    store.getDocuments();
  } else {
    await store.loadOwnerOptions(store.ownerType);
    store.getDocuments();
  }
  store.getExpiring(diasVencimientos);
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
            :label="ownerTypeLabel(store.ownerType).label"
            placeholder="Todos"
            persistent-placeholder
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 220px"
          />
          <v-select
            v-model="store.category"
            :items="categoriasDoc"
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
          <TableExcelActions
            export-url="documents/export/"
            export-name="documentos.xlsx"
            :export-params="{
              ownerType: store.ownerType,
              ownerId: store.ownerType === 'company' ? undefined : store.ownerId,
              category: store.category,
            }"
            import-url="documents/import/"
            template-url="documents/import/template/"
            entidad="documentos"
            :disabled="!documents.length"
            @imported="store.getDocuments()"
          />
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
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
          search-label="Buscar dueño / número / categoría"
          empty-icon="mdi-file-document-outline"
          :no-data-text="emptyText"
          @retry="store.getDocuments()"
        >
          <template #empty>
            <EmptyState icon="mdi-file-document-outline" :text="emptyText">
              <template #action>
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="dialog = true"
                >
                  Nuevo documento
                </v-btn>
              </template>
            </EmptyState>
          </template>
          <template #item.owner.label="{ item }">
            <span class="d-flex align-center ga-1">
              <v-icon size="16" class="text-medium-emphasis">
                {{ ownerIcon(item.ownerType) }}
              </v-icon>
              {{ item.owner?.label || "—" }}
              <span
                v-if="item.owner?.sublabel"
                class="text-caption text-medium-emphasis"
              >
                · {{ item.owner.sublabel }}
              </span>
            </span>
          </template>
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
            <!-- Sin adjunto no hay nada que ver: el botón no aparece. -->
            <IconBtn
              v-if="item.fileKey"
              tooltip="Ver archivo"
              icon="mdi-file-eye"
              size="small"
              variant="text"
              @click="store.openFile(item.id)"
            />
            <IconBtn
              tooltip="Eliminar documento"
              icon="mdi-delete"
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
          <v-select
            v-model="expPlazo"
            :items="expPlazoOptions"
            item-title="label"
            item-value="value"
            label="Plazo"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 180px"
          />
          <v-spacer />
          <TableExcelActions
            export-url="documents/expiring/export/"
            export-name="vencimientos.xlsx"
            :export-params="{ days: store.expiringDays ?? undefined }"
            :disabled="!expiring.length"
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
                <IconBtn
                  v-if="d.fileKey"
                  tooltip="Ver archivo"
                  icon="mdi-file-eye"
                  size="small"
                  variant="text"
                  @click="store.openFile(d.id)"
                />
                <IconBtn
                  v-if="d.owner?.phone"
                  tooltip="Enviar WhatsApp"
                  icon="mdi-whatsapp"
                  color="success"
                  size="small"
                  variant="text"
                  @click="openWhatsApp(d.owner.phone)"
                />
                <IconBtn
                  v-if="d.owner?.userId && canMessage"
                  tooltip="Enviar mensaje"
                  icon="mdi-message-text-outline"
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
