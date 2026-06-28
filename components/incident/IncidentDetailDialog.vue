<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useIncidentStore } from "~/stores/incident";
import {
  incidentStatusOptions,
  useIncidentStatus,
} from "~/composables/useIncidentStatus";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

const props = defineProps<{ modelValue: boolean; incidentId: string | null }>();
const emit = defineEmits(["update:modelValue"]);

const incidentStore = useIncidentStore();
const { incident, attachments, staffUsers } = storeToRefs(incidentStore);
const { incidentType, incidentSeverity, incidentStatus } = useIncidentStatus();

const assignTo = ref("");
const comment = ref("");

watch(
  () => props.modelValue,
  async (open) => {
    if (open && props.incidentId) {
      await incidentStore.getIncident(props.incidentId);
      if (!staffUsers.value.length) await incidentStore.loadStaffUsers();
      assignTo.value = incident.value?.assignedToUserId ?? "";
      comment.value = "";
    }
  },
);

const close = () => emit("update:modelValue", false);
const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : "");
const openUrl = (url: string) => window.open(url, "_blank");

const doAssign = () => {
  if (assignTo.value && incident.value)
    incidentStore.assign(incident.value.id, assignTo.value);
};
const setStatus = (status: string) => {
  if (incident.value) incidentStore.changeStatus(incident.value.id, status);
};
const sendComment = async () => {
  if (comment.value.trim() && incident.value) {
    await incidentStore.comment(incident.value.id, comment.value);
    comment.value = "";
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="720" scrollable @update:model-value="close">
    <v-card v-if="incident">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon :color="incidentType(incident.type).color">
          {{ incidentType(incident.type).icon }}
        </v-icon>
        <span class="text-h6 font-weight-bold">{{ incidentType(incident.type).label }}</span>
        <v-chip :color="incidentSeverity(incident.severity).color" size="small" label>
          {{ incidentSeverity(incident.severity).label }}
        </v-chip>
        <v-spacer />
        <span class="text-caption">{{ incident.code }}</span>
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 mb-1">{{ incident.description }}</p>
        <div class="text-caption text-medium-emphasis mb-3">
          {{ incident.truck?.plate }} ·
          {{ incident.driver?.user?.name }} · {{ fmt(incident.createdAt) }}
          <a
            v-if="incident.lat && incident.lng"
            :href="`https://maps.google.com/?q=${incident.lat},${incident.lng}`"
            target="_blank"
            class="ml-1"
          >
            <v-icon size="14">mdi-map-marker</v-icon> Ubicación
          </a>
        </div>

        <!-- Adjuntos -->
        <div v-if="attachments.length" class="mb-3">
          <p class="text-subtitle-2 font-weight-bold mb-1">Evidencia</p>
          <div class="d-flex flex-wrap ga-2">
            <template v-for="a in attachments" :key="a.id">
              <img
                v-if="a.kind === 'image'"
                :src="a.url"
                class="att-thumb"
                @click="openUrl(a.url)"
              />
              <audio v-else-if="a.kind === 'audio'" :src="a.url" controls />
              <video v-else-if="a.kind === 'video'" :src="a.url" controls class="att-video" />
              <a v-else :href="a.url" target="_blank">Archivo</a>
            </template>
          </div>
        </div>

        <!-- Asignación + estado -->
        <v-row dense class="mb-2">
          <v-col cols="12" sm="7">
            <v-select
              v-model="assignTo"
              :items="staffUsers"
              item-title="name"
              item-value="id"
              label="Responsable"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="doAssign"
            />
          </v-col>
          <v-col cols="12" sm="5" class="d-flex align-center ga-1">
            <v-btn
              v-for="s in incidentStatusOptions"
              :key="s.value"
              :color="incident.status === s.value ? s.color : undefined"
              :variant="incident.status === s.value ? 'flat' : 'tonal'"
              size="x-small"
              @click="setStatus(s.value)"
            >
              {{ s.label }}
            </v-btn>
          </v-col>
        </v-row>

        <!-- Timeline -->
        <p class="text-subtitle-2 font-weight-bold mb-1">Historial</p>
        <v-timeline side="end" density="compact" class="mb-2">
          <v-timeline-item
            v-for="ev in incident.events"
            :key="ev.id"
            size="x-small"
            dot-color="primary"
          >
            <div class="text-caption text-medium-emphasis">{{ fmt(ev.at) }}</div>
            <div class="text-body-2">
              <strong>{{ ev.action }}</strong>
              <span v-if="ev.note"> — {{ ev.note }}</span>
            </div>
          </v-timeline-item>
        </v-timeline>

        <div class="d-flex ga-2">
          <VoiceTextField
            v-model="comment"
            label="Agregar comentario"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <v-btn icon="mdi-send" color="primary" variant="tonal" @click="sendComment" />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.att-thumb {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}
.att-video {
  max-width: 200px;
  border-radius: 8px;
}
</style>
