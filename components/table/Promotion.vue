<template>
  <ResponsiveTable
    :headers="headers"
    :items="data"
    fixed-header
    :loading="loading"
  >
    <template v-slot:item.name="{ item }">
      <div class="d-flex align-center justify-end justify-sm-start">
        <v-avatar v-if="item.imageUrl" :size="30" class="mr-2">
          <v-img :src="returnUrlImg(item.imageUrl)" />
        </v-avatar>
        {{ item.name }}
      </div>
    </template>

    <template v-slot:item.status="{ item }">
      <ChipStatusActive :data="item.isActive" />
    </template>

    <template v-slot:item.dateFrom="{ item }">
      {{ formatDateLocal(item.startDate) }}
    </template>

    <template v-slot:item.dateTo="{ item }">
      {{ formatDateLocal(item.endDate) }}
    </template>

    <template v-slot:item.description="{ item }">
      {{ item.description.slice(0, 70) }}
      {{ item.description.length > 70 ? "..." : "" }}
    </template>

    <template v-slot:item.actions="{ item }">
      <v-tooltip location="top" text="Editar datos">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            v-bind="props"
            @click="$emit('edit', item)"
          >
            <EditIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <template v-slot:bottom>
      <div class="text-center pt-3">
        <v-pagination
          v-model="page"
          :length="pagination.totalPages"
          density="compact"
          total-visible="5"
        ></v-pagination>
      </div>
    </template>

    <!-- 📱 Slot mobile-item -->
    <template #mobile-item="{ item }">
      <div class="text-body-1 text-textPrimary mb-1 font-weight-bold">
        <span>Name: </span>
        {{ item.name }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        {{ item.description.slice(0, 70) }}
        {{ item.description.length > 70 ? "..." : "" }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Dedse: </strong>
        {{ formatDateLocal(item.startDate) }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Hasta: </strong>
        {{ formatDateLocal(item.endDate) }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Estado: </strong>
        <ChipStatusActive :data="item.isActive" />
      </div>
    </template>
  </ResponsiveTable>
</template>

<script setup lang="ts">
import { EditIcon } from "vue-tabler-icons";
import type { Promotion } from "~/types/project";
import type { Pagination, ResponseConfirm } from "~/types/enums";

const props = defineProps({
  data: {
    type: Array as () => Promotion[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object as () => Pagination,
    required: true,
  },
});

const headers = [
  { title: "", value: "actions", minWidth: "80px" },
  { title: "Nombre", value: "name" },
  { title: "Detalle", value: "description" },
  { title: "Inicio", value: "dateFrom" },
  { title: "Fin", value: "dateTo" },
  { title: "Estado", value: "status" },
];

const emit = defineEmits(["change-pagination", "edit"]);

const page = computed({
  get() {
    return props.pagination.currentPage;
  },
  set(newValue) {
    const payload = {
      ...props.pagination,
      currentPage: newValue,
    };
    emit("change-pagination", payload);
  },
});
</script>

<style scoped></style>
