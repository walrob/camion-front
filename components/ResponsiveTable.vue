<template>
  <div>
    <!--
      Buscador propio de la tabla (opt-in con `searchable`). Filtra en cliente
      sobre el conjunto ya cargado, así que solo se usa en las tablas que traen
      todo; las paginadas por servidor traen su propio buscador desde la página,
      que consulta al back.
    -->
    <div v-if="searchable" class="d-flex flex-wrap ga-2 align-center mb-4">
      <VoiceTextField
        v-model="search"
        :label="searchLabel"
        clearable
        style="min-width: 240px; max-width: 360px"
      />
    </div>

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
        :headers="tableHeaders"
        :items="filteredItems"
        :loading="loading"
        :fixed-header="fixedHeader"
        :no-data-text="noDataText"
        v-model:page="page"
        :items-per-page="allItems ? -1 : itemsPerPage"
        hide-default-footer
        v-bind="$attrs"
        @update:sort-by="onSortBy"
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

      <template v-else-if="filteredItems.length">
        <v-card
          v-for="(item, index) in pagedItems"
          :key="item.id || index"
          class="mb-3"
          elevation="1"
        >
          <v-card-text>
            <!-- 👇 slot opcional para personalizar mobile -->
            <slot name="mobile-item" :item="item" :index="index">
              <!--
                Sin personalización, la tarjeta reusa los mismos slots de columna
                que la tabla de escritorio (`item.<key>`). Así una fecha, un monto
                o un chip se ven igual en las dos vistas: antes acá se imprimía el
                valor crudo del backend (una fecha salía "2026-05-20").
              -->
              <div
                v-for="header in mobileHeaders"
                :key="header.value"
                class="flex justify-between border-b py-1 text-sm"
              >
                <span class="font-weight-bold">{{ header.title }}: </span>
                <span>
                  <slot
                    v-if="$slots[`item.${header.value}`]"
                    :name="`item.${header.value}`"
                    :item="item"
                  />
                  <template v-else>
                    {{ resolveValue(item, header.value) }}
                  </template>
                </span>
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
import VoiceTextField from "~/components/form/VoiceTextField.vue";
const { smAndUp } = useDisplay();

const emit = defineEmits(["retry", "sort"]);

interface Header {
  title: string;
  value: string;
  minWidth?: string;
  /** Por defecto ordena; se pone en `false` en columnas calculadas o de acciones. */
  sortable?: boolean;
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
  // Delega el ordenamiento al servidor: al clickear una columna emite `sort` con
  // { key, order } y el padre recarga pidiendo ese orden. Se usa en las tablas
  // paginadas por servidor (donde ordenar solo en cliente reordenaría la página
  // visible). En las tablas que cargan todo, se omite y v-data-table ordena solo.
  sortServer: { type: Boolean, default: false },
  // Muestra el buscador propio de la tabla (filtra en cliente sobre `items`).
  // No usarlo en tablas paginadas por servidor: filtraría solo la página visible.
  searchable: { type: Boolean, default: false },
  searchLabel: { type: String, default: "Buscar" },
});

// v-data-table emite un arreglo de descriptores; tomamos el primero (orden simple)
// y lo propagamos. Un arreglo vacío = se quitó el orden (vuelve al default del back).
const onSortBy = (sortByArr: { key: string; order?: "asc" | "desc" }[]) => {
  if (!props.sortServer) return;
  const first = sortByArr?.[0];
  emit(
    "sort",
    first
      ? { key: first.key, order: first.order ?? "asc" }
      : { key: null, order: null },
  );
};

// Las páginas declaran las columnas con `value` (el formato viejo de Vuetify 2).
// Vuetify 3 identifica la columna por `key` y, cuando falta, deja `sortable` en
// false —por eso ninguna tabla ordenaba—. Acá se completa `key` a partir de
// `value` y se ordena por defecto: la excepción son "acciones" y lo que la
// página marque explícitamente (columnas armadas en el template, que el back no
// sabe ordenar).
const tableHeaders = computed(() =>
  props.headers.map((h) => ({
    ...h,
    key: (h as any).key ?? h.value,
    sortable: h.sortable ?? h.value !== "actions",
  })),
);

// La columna de acciones se renderiza aparte al pie de la tarjeta: incluirla en
// el listado de campos la duplicaría (y sin slots mostraba "Acciones: -").
const mobileHeaders = computed(() =>
  props.headers.filter((h) => h.value !== "actions"),
);

// Página actual (modo cliente). Se reinicia al cambiar el conjunto de datos.
const page = ref(1);

// Búsqueda en cliente: compara el texto contra el valor crudo de cada columna
// (sin la de acciones), ignorando mayúsculas y tildes —"camion" encuentra
// "Camión"—. Se busca sobre todos los ítems, no sobre la página visible.
const search = ref("");

const normalize = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const filteredItems = computed(() => {
  const q = normalize(props.searchable ? search.value : "").trim();
  if (!q) return props.items;
  return props.items.filter((item) =>
    mobileHeaders.value.some((h) =>
      normalize(resolveValue(item, h.value)).includes(q),
    ),
  );
});

const pageCount = computed(() =>
  props.allItems
    ? 1
    : Math.max(1, Math.ceil(filteredItems.value.length / props.itemsPerPage)),
);

// Slice de la página actual para la vista mobile (el v-data-table pagina solo).
const pagedItems = computed(() =>
  props.allItems
    ? filteredItems.value
    : filteredItems.value.slice(
        (page.value - 1) * props.itemsPerPage,
        page.value * props.itemsPerPage,
      ),
);

// Al filtrar/recargar/buscar cambia la cantidad de ítems: volver a la primera página.
watch([() => props.items, search], () => {
  page.value = 1;
});

const resolveValue = (obj: any, path: string) => {
  return path.split(".").reduce((o, key) => o?.[key], obj) ?? "-";
};
</script>
