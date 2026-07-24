<script setup lang="ts">
import { ref } from "vue";
import { useOeaStore, type OeaItem } from "~/stores/oea";
import { oeaItemStatusOptions } from "~/composables/useOea";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

const props = defineProps<{ item: OeaItem; disabled?: boolean }>();

const oeaStore = useOeaStore();

const status = ref(props.item.status);
const notes = ref(props.item.notes ?? "");
const photoLoaded = ref(false);

// Ícono por estado para la botonera (el composable solo trae label y color).
const statusIcon: Record<string, string> = {
  ok: "mdi-check",
  observed: "mdi-alert",
  na: "mdi-minus",
};

const onStatus = (val: string) => {
  status.value = val;
  oeaStore.updateItem(props.item.id, { status: val });
};
const onNotesBlur = () => {
  if (notes.value !== (props.item.notes ?? ""))
    oeaStore.updateItem(props.item.id, { notes: notes.value });
};
const onPhoto = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await oeaStore.updateItem(props.item.id, {}, file);
    photoLoaded.value = true;
  }
};
</script>

<template>
  <v-card
    border
    flat
    rounded="lg"
    class="mb-3 oea-item"
    :class="`oea-item--${status}`"
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
        Botonera separada (no v-btn-toggle): pegados, un roce en la cabina
        cambia la respuesta de al lado. Van a un tercio del ancho cada uno.
      -->
      <div
        class="d-flex ga-2"
        role="group"
        :aria-label="`Estado de ${item.label}`"
      >
        <v-btn
          v-for="o in oeaItemStatusOptions"
          :key="o.value"
          :disabled="disabled"
          :color="status === o.value ? o.color : undefined"
          :variant="status === o.value ? 'flat' : 'outlined'"
          :aria-pressed="status === o.value"
          :prepend-icon="status === o.value ? statusIcon[o.value] : undefined"
          size="small"
          class="oea-item__status"
          rounded="lg"
          @click="onStatus(o.value)"
        >
          {{ o.label }}
        </v-btn>
      </div>

      <div class="d-flex ga-2 align-center mt-3">
        <VoiceTextField
          v-model="notes"
          :label="status === 'observed' ? 'Detallá la observación' : 'Observaciones'"
          variant="outlined"
          density="comfortable"
          hide-details
          class="flex-grow-1"
          :readonly="disabled"
          @blur="onNotesBlur"
        />
        <IconBtn
          v-if="!disabled"
          tooltip="Tomar foto"
          icon="mdi-camera"
          variant="tonal"
          :color="photoLoaded ? 'success' : undefined"
          class="oea-item__photo"
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
/* Franja lateral: de un vistazo se ve qué quedó observado bajando por la lista. */
.oea-item {
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: transparent;
}
.oea-item--ok {
  border-left-color: rgb(var(--v-theme-success));
}
.oea-item--observed {
  border-left-color: rgb(var(--v-theme-warning));
}

.oea-item__status {
  flex: 1 1 0;
  min-height: 40px;
  min-width: 0;
}

.oea-item__photo {
  width: 40px;
  height: 40px;
}
</style>
