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
  <v-card variant="outlined" class="mb-2">
    <v-card-text class="py-2">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="font-weight-bold">{{ item.label }}</span>
        <v-chip v-if="photoLoaded" size="x-small" color="success" prepend-icon="mdi-camera">
          Foto
        </v-chip>
      </div>

      <v-btn-toggle
        :model-value="status"
        density="comfortable"
        divided
        :disabled="disabled"
        @update:model-value="onStatus"
      >
        <v-btn
          v-for="o in oeaItemStatusOptions"
          :key="o.value"
          :value="o.value"
          :color="status === o.value ? o.color : undefined"
          size="small"
        >
          {{ o.label }}
        </v-btn>
      </v-btn-toggle>

      <div class="d-flex ga-2 align-center mt-2">
        <VoiceTextField
          v-model="notes"
          label="Observaciones"
          variant="outlined"
          density="compact"
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
          size="small"
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
