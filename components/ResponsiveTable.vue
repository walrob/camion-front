<template>
  <div>
    <!-- 💻 DESKTOP -->
    <v-data-table
      v-if="smAndUp"
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
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </v-data-table>

    <!-- 📱 MOBILE -->
    <div v-else>
      <template v-if="items && items.length">
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

      <div v-else class="text-center align-center text-body-1 mt-5">
        {{ noDataText }}
      </div>

      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";
const { smAndUp } = useDisplay();

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
  allItems: { type: Boolean, default: false },
});

const resolveValue = (obj: any, path: string) => {
  return path.split(".").reduce((o, key) => o?.[key], obj) ?? "-";
};
</script>
