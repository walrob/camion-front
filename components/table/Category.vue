<template>
  <ResponsiveTable
    :headers="headers"
    :items="data"
    fixed-header
    :loading="loading"
    all-items
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

    <template v-slot:item.update="{ item }">
      {{ formatDateLocal(item.updatedAt) }}
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
      <v-tooltip v-if="item.isActive" location="top" text="Desactivar">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            v-bind="props"
            @click="blockItem(item)"
          >
            <FolderXIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-else location="top" text="Activar">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="success"
            v-bind="props"
            @click="enableItem(item)"
          >
            <FolderCheckIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <!-- 📱 Slot mobile-item -->
    <template #mobile-item="{ item }">
      <div class="text-body-1 text-textPrimary mb-1 font-weight-bold">
        <span>Name: </span>
        {{ item.name }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Estado: </strong>
        <ChipStatusActive :data="item.isActive" />
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <strong>Actualizado: </strong>
        {{ formatDateLocal(item.updatedAt) }}
      </div>
    </template>
  </ResponsiveTable>

  <ModalConfirm
    v-model="showConfirm"
    :title="titleConfirm"
    :description="textConfirm"
    @save="confirmSave"
  />
</template>

<script setup lang="ts">
import { EditIcon, FolderCheckIcon, FolderXIcon } from "vue-tabler-icons";
import type { Category } from "~/types/project";
import type { ResponseConfirm } from "~/types/enums";

const props = defineProps({
  data: {
    type: Array as () => Category[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const headers = [
  { title: "", value: "actions", minWidth: "80px" },
  { title: "ID", value: "id" },
  { title: "Nombre", value: "name" },
  { title: "Estado", value: "status" },
  { title: "Actualizado", value: "update" },
];

const emit = defineEmits(["edit", "change-active"]);

const showConfirm = ref(false);
const textConfirm = ref("");
const titleConfirm = ref("");
const categoryData = ref<Category | undefined>(undefined);

const enableItem = (item: Category) => {
  categoryData.value = item;
  textConfirm.value = `<p>Se habilitará la categoría <b>${item.name}</b></p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Habilitar categoría";
  showConfirm.value = true;
};

const blockItem = (item: Category) => {
  categoryData.value = item;
  textConfirm.value = `<p>Se bloqueará la categoría <b>${item.name}</b></p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Bloquear categoría";
  showConfirm.value = true;
};

const confirmSave = (value: ResponseConfirm) => {
  if (value.resp) {
    emit("change-active", categoryData.value);
    showConfirm.value = false;
  }
};
</script>

<style scoped></style>
