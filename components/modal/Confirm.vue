<template>
  <v-dialog v-model="dialog" max-width="400">
    <UiModalCard :title="title">
      <v-row>
        <v-col cols="12">
          <div v-html="description"></div>
        </v-col>
      </v-row>

      <template #footer>
        <v-btn text="Cancelar" variant="text" @click="response(false)"></v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          text="Confirmar"
          @click="response(true)"
        ></v-btn>
      </template>
    </UiModalCard>
  </v-dialog>
</template>

<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";
import type { ResponseConfirm } from "~/types/enums";

const props = defineProps({
  title: {
    type: String,
    default: "Confirmar",
  },
  description: {
    type: String,
    default:
      "<p>¿Está seguro de realizar la operación?</p><p>No se podrá revertir el cambio</p>",
  },
  detail: {
    type: String,
    default: "Aplicar a todos los profesionales",
  },
});

const dialog = defineModel<boolean>();

const emit = defineEmits(["save"]);

const response = (value: boolean) => {
  const payload: ResponseConfirm = {
    resp: value,
  };
  emit("save", payload);
  dialog.value = false;
};
</script>
