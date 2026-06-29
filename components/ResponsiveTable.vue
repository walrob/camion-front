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

      <v-data-table
        v-else
        :headers="headers"
        :items="items"
        :loading="loading"
        :fixed-header="fixedHeader"
        :no-data-text="noDataText"
        :disable-pagination="allItems"
        :hide-default-footer="allItems"
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
          v-for="(item, index) in items"
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
  </div>
</template>

<script setup lang="ts">
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
  allItems: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  errorText: { type: String, default: "Ocurrió un error al obtener los datos." },
});

const resolveValue = (obj: any, path: string) => {
  return path.split(".").reduce((o, key) => o?.[key], obj) ?? "-";
};
</script>
