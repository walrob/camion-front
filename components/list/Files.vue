<template>
  <div v-if="!readonly" class="d-flex justify-end">
    <v-btn
      density="compact"
      variant="text"
      color="primary"
      prepend-icon="mdi-plus"
      @click="newItem"
      >Agregar</v-btn
    >
  </div>

  <div v-if="!listItems?.length" class="text-center text-caption pa-3">
    Sin archivos agregados
  </div>
  <div v-else class="grid-file-list">
    <div v-for="file in listItems" :key="file.name" cols="12" sm="6" md="4">
      <CardFile :file="file" small @view="openPreview" @delete="deleteItem" />
    </div>
  </div>
  <!-- <v-list v-else density="compact">
    <v-list-item v-for="(item, i) in listItems" :key="i">
      <v-list-item-title
        v-text="item.name"
        class="text-body-1"
      ></v-list-item-title>
      <template v-slot:append>
        <v-tooltip v-if="readonly || item.id" location="top" text="Ver">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              variant="text"
              color="primary"
              size="small"
              v-bind="props"
              @click="openPreview(item)"
            >
              <PhotoSearchIcon size="20" stroke-width="1.5" />
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip v-else location="top" text="Eliminar">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              variant="text"
              color="error"
              size="small"
              v-bind="props"
              @click="deleteItem(item.name)"
            >
              <TrashIcon size="20" stroke-width="1.5" />
            </v-btn>
          </template>
        </v-tooltip>
      </template>
    </v-list-item>
  </v-list> -->

  <ModalFile v-model="showDialogFile" @save="saveFile" />
  <ModalViewFile v-model="previewDialog" :file="selectedFile" />
</template>

<script setup lang="ts">
import type { AttachedFileApi } from "~/types/clinical";
import { PlusIcon, TrashIcon, PhotoSearchIcon } from "vue-tabler-icons";
import { useValidations } from "~/composables/useValidations";
const r = useValidations();

const listItems = defineModel<AttachedFileApi[]>();

const props = defineProps({
  readonly: {
    type: Boolean,
    default: false,
  },
});

const showDialogFile = ref(false);
const previewDialog = ref(false);
const selectedFile = ref<any>(null);

function openPreview(file: any) {
  selectedFile.value = file;
  previewDialog.value = true;
}

const newItem = () => {
  showDialogFile.value = true;
};

const deleteItem = (item: string) => {
  listItems.value = listItems.value?.filter((x) => x.name !== item);
};

const saveFile = (value: AttachedFileApi) => {
  listItems.value?.push(value);
};
</script>

<style scoped>
.grid-file-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  align-items: stretch;
}
</style>
