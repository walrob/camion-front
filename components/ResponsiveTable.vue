<template>
  <div>
    <!-- ⚠️ Estado de error con reintento (prioritario si no hay datos) -->
    <ErrorState
      v-if="error && !items.length && !loading"
      :text="errorText"
      @retry="$emit('retry')"
    />

    <!-- 💻 DESKTOP -->
    <template v-else-if="smAndUp">
      <!-- Skeleton mientras carga la primera vez -->
      <v-skeleton-loader
        v-if="loading && !items.length"
        type="table-thead, table-row@6"
      />

      <!--
        Footer interno SIEMPRE oculto: la paginación se hace con <v-pagination>
        (abajo en modo cliente, o el que provee el padre en modo server-side).
        En modo cliente el v-data-table pagina el set completo (mantiene el orden
        al ordenar columnas) y <v-pagination> controla la página.
      -->
      <v-data-table
        v-else
        :headers="headers"
        :items="items"
        :loading="loading"
        :fixed-header="fixedHeader"
        :no-data-text="noDataText"
        v-model:page="page"
        :items-per-page="allItems ? -1 : itemsPerPage"
        hide-default-footer
        v-bind="$attrs"
      >
        <!-- 🔁 Forward de todos los slots (permite item.*, bottom, etc.) -->
        <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps ?? {}" />
        </template>

        <!-- Estado vacío accionable -->
        <template #no-data>
          <slot name="empty">
            <EmptyState :icon="emptyIcon" :text="noDataText" />
          </slot>
        </template>
      </v-data-table>
    </template>

    <!-- 📱 MOBILE -->
    <div v-else>
      <!-- Skeleton de tarjetas -->
      <template v-if="loading && !items.length">
        <v-skeleton-loader
          v-for="n in 4"
          :key="n"
          type="article"
          class="mb-3"
        />
      </template>

      <template v-else-if="items && items.length">
        <v-card
          v-for="(item, index) in pagedItems"
          :key="item.id || index"
          class="mb-3"
          elevation="1"
        >
          <v-card-text>
            <!-- 👇 slot opcional para personalizar mobile -->
            <slot name="mobile-item" :item="item" :index="index">
              <div
                v-for="header in headers"
                :key="header.value"
                class="flex justify-between border-b py-1 text-sm"
              >
                <span class="font-weight-bold">{{ header.title }}: </span>
                <span>{{ resolveValue(item, header.value) }}</span>
              </div>
            </slot>

            <div class="flex gap-1">
              <slot name="item.actions" :item="item" />
            </div>
          </v-card-text>
        </v-card>
      </template>

      <!-- Estado vacío accionable (mobile) -->
      <slot v-else name="empty">
        <EmptyState :icon="emptyIcon" :text="noDataText" />
      </slot>

      <slot name="bottom" />
    </div>

    <!--
      Paginación por <v-pagination> en modo cliente (desktop y mobile).
      En modo server-side (all-items) el padre renderiza su propio control.
    -->
    <div
      v-if="!allItems && pageCount > 1"
      class="d-flex justify-center mt-3"
    >
      <v-pagination
        v-model="page"
        :length="pageCount"
        :total-visible="6"
        density="comfortable"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import EmptyState from "~/components/shared/EmptyState.vue";
import ErrorState from "~/components/shared/ErrorState.vue";
const { smAndUp } = useDisplay();

defineEmits(["retry"]);

interface Header {
  title: string;
  value: string;
  minWidth?: string;
}

const props = defineProps({
  headers: { type: Array as () => Header[], required: true },
  items: { type: Array as () => any[], required: true },
  loading: { type: Boolean, default: false },
  fixedHeader: { type: Boolean, default: true },
  noDataText: { type: String, default: "No hay datos registrados" },
  emptyIcon: { type: String, default: "mdi-inbox-outline" },
  // all-items: muestra todos los ítems sin paginación interna. Se usa cuando el
  // padre pagina del lado del servidor y renderiza su propio <v-pagination>.
  allItems: { type: Boolean, default: false },
  itemsPerPage: { type: Number, default: 10 },
  error: { type: Boolean, default: false },
  errorText: { type: String, default: "Ocurrió un error al obtener los datos." },
});

// Página actual (modo cliente). Se reinicia al cambiar el conjunto de datos.
const page = ref(1);

const pageCount = computed(() =>
  props.allItems
    ? 1
    : Math.max(1, Math.ceil((props.items?.length ?? 0) / props.itemsPerPage)),
);

// Slice de la página actual para la vista mobile (el v-data-table pagina solo).
const pagedItems = computed(() =>
  props.allItems
    ? props.items
    : props.items.slice(
        (page.value - 1) * props.itemsPerPage,
        page.value * props.itemsPerPage,
      ),
);

// Al filtrar/recargar cambia la cantidad de ítems: volver a la primera página.
watch(
  () => props.items,
  () => {
    page.value = 1;
  },
);

const resolveValue = (obj: any, path: string) => {
  return path.split(".").reduce((o, key) => o?.[key], obj) ?? "-";
};
</script>
