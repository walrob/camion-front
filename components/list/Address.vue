<template>
  <div v-if="!readonly" class="d-flex justify-end">
    <v-btn
      density="compact"
      variant="text"
      color="primary"
      prepend-icon="mdi-plus"
      @click="openNewAddress"
    >
      Agregar dirección
    </v-btn>
  </div>

  <div v-if="!items?.length" class="text-center text-caption pa-3">
    Sin direcciones agregadas
  </div>

  <v-list v-else density="compact">
    <v-list-item v-for="(item, i) in items" :key="i">
      <v-list-item-title class="text-body-2">
        {{ formatAddress(item) }}

        <v-icon v-if="item.isDefault" color="success" size="small" class="ml-2">
          mdi-check-bold
        </v-icon>
      </v-list-item-title>

      <template #append>
        <v-btn
          v-if="!readonly && !item.isDefault"
          icon
          variant="text"
          color="primary"
          size="small"
          @click="$emit('select-default', item)"
        >
          <HomeCheckIcon size="20" />
        </v-btn>

        <v-btn
          v-if="!readonly"
          icon
          variant="text"
          color="error"
          size="small"
          @click="$emit('delete', item)"
        >
          <TrashIcon size="20" />
        </v-btn>
      </template>
    </v-list-item>
  </v-list>

  <!-- MODAL -->
  <v-dialog v-model="dialog" max-width="500">
    <UiModalCard title="Nueva dirección">
      <FormAddressWithGeo v-model="tempAddress" @submit="handleSave" />
      <template #footer>
        <v-btn variant="text" @click="dialog = false"> Cancelar </v-btn>

        <v-btn
          color="primary"
          variant="tonal"
          type="submit"
          form="address-form"
        >
          Guardar
        </v-btn>
      </template>
    </UiModalCard>
  </v-dialog>
</template>

<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";
import { TrashIcon, HomeCheckIcon } from "vue-tabler-icons";
import type { UserAddress } from "~/types/project";

defineProps<{
  items: UserAddress[];
  readonly?: boolean;
}>();

const emit = defineEmits(["delete", "save", "select-default"]);

const dialog = ref(false);

const tempAddress = ref<UserAddress | null>(null);

const handleSave = () => {
  if (tempAddress.value) {
    emit("save", tempAddress.value);
    dialog.value = false;
  }
};

const openNewAddress = () => {
  tempAddress.value = null;
  dialog.value = true;
};

const formatAddress = (a: UserAddress) =>
  [a.street, a.city, a.province].filter(Boolean).join(" · ");
</script>
