<script setup lang="ts">
import { ref } from "vue";
import { useChecklistStore, type ChecklistItem } from "~/stores/checklist";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

const props = defineProps<{ item: ChecklistItem; disabled?: boolean }>();

const checklistStore = useChecklistStore();

const status = ref(props.item.status);
const notes = ref(props.item.notes ?? "");
const photoLoaded = ref(false);

const statusOptions = [
  { value: "ok", label: "OK", color: "success", icon: "mdi-check" },
  { value: "fail", label: "Falla", color: "error", icon: "mdi-alert" },
  { value: "na", label: "N/A", color: "grey-darken-1", icon: "mdi-minus" },
];

const onStatus = (val: string) => {
  status.value = val;
  checklistStore.updateItem(props.item.id, { status: val });
};
const onNotesBlur = () => {
  if (notes.value !== (props.item.notes ?? ""))
    checklistStore.updateItem(props.item.id, { notes: notes.value });
};
const onPhoto = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await checklistStore.updateItem(props.item.id, {}, file);
    photoLoaded.value = true;
  }
};
</script>

<template>
  <v-card
    border
    flat
    rounded="lg"
    class="mb-3 checklist-item"
    :class="`checklist-item--${status}`"
  >
    <v-card-text class="pa-4">
      <div class="d-flex align-center ga-2 mb-3">
        <span class="text-subtitle-1 font-weight-bold">{{ item.label }}</span>
        <v-spacer />
        <v-chip
          v-if="photoLoaded"
          size="small"
          color="success"
          variant="tonal"
          prepend-icon="mdi-camera-check"
        >
          Foto
        </v-chip>
      </div>

      <!--
        Botonera propia en vez de v-btn-toggle: el toggle pega los tres botones
        (`divided`) y con el camión en marcha un roce cambia la respuesta de al
        lado. Acá van separados, a un tercio del ancho cada uno y con 48px de
        alto —el mínimo táctil recomendado—, que además es lo que permite
        contestar con el pulgar sin mirar.
      -->
      <div
        class="d-flex ga-2"
        role="group"
        :aria-label="`Estado de ${item.label}`"
      >
        <v-btn
          v-for="o in statusOptions"
          :key="o.value"
          :disabled="disabled"
          :color="status === o.value ? o.color : undefined"
          :variant="status === o.value ? 'flat' : 'outlined'"
          :aria-pressed="status === o.value"
          :prepend-icon="status === o.value ? o.icon : undefined"
          size="small"
          class="checklist-item__status"
          rounded="lg"
          @click="onStatus(o.value)"
        >
          {{ o.label }}
        </v-btn>
      </div>

      <div class="d-flex ga-2 align-center mt-3">
        <VoiceTextField
          v-model="notes"
          :label="status === 'fail' ? 'Describí la falla' : 'Observaciones'"
          variant="outlined"
          density="comfortable"
          hide-details
          class="flex-grow-1"
          :readonly="disabled"
          @blur="onNotesBlur"
        />
        <v-btn
          v-if="!disabled"
          icon="mdi-camera"
          aria-label="Tomar foto"
          variant="tonal"
          :color="photoLoaded ? 'success' : undefined"
          class="checklist-item__photo"
          @click="($refs.fileInput as HTMLInputElement).click()"
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          @change="onPhoto"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* Franja de color al costado: de un vistazo, y sin leer, se ve qué quedó
   marcado como falla mientras se baja por la lista. */
.checklist-item {
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: transparent;
}
.checklist-item--ok {
  border-left-color: rgb(var(--v-theme-success));
}
.checklist-item--fail {
  border-left-color: rgb(var(--v-theme-error));
}

/* Ancho completo a un tercio cada uno; alto cómodo pero sin ser un bloque:
   40px sigue por encima del mínimo táctil sin dominar la tarjeta. */
.checklist-item__status {
  flex: 1 1 0;
  min-height: 40px;
  min-width: 0;
}

/* El botón de foto acompaña el alto del campo de observaciones. */
.checklist-item__photo {
  width: 40px;
  height: 40px;
}
</style>
