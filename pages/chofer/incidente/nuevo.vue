<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { useIncidentStore } from "~/stores/incident";
import { useGeolocation } from "~/composables/useGeolocation";
import { useGeneralStore } from "~/stores/general";
import { incidentTypeOptions } from "~/composables/useIncidentStatus";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";

definePageMeta({ layout: "driver", middleware: "auth" });
useHead({ title: "Reportar incidente" });

const router = useRouter();
const tripStore = useTripStore();
const incidentStore = useIncidentStore();
const general = useGeneralStore();
const { getPosition } = useGeolocation();
const { myTrips } = storeToRefs(tripStore);

const selectedType = ref("");
const description = ref("");
const photo = ref<File | null>(null);
const audio = ref<File | null>(null);
const video = ref<File | null>(null);
const saving = ref(false);

const activeTrip = computed(
  () =>
    myTrips.value.find((t) => t.status === "in_progress") ||
    myTrips.value.find((t) => t.status === "assigned"),
);

const pick = (e: Event, target: "photo" | "audio" | "video") => {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null;
  if (target === "photo") photo.value = file;
  if (target === "audio") audio.value = file;
  if (target === "video") video.value = file;
};

const submit = async () => {
  if (!selectedType.value) {
    general.setSnackbar({ color: "warning", message: "Elegí el tipo de incidente." });
    return;
  }
  if (!description.value.trim()) {
    general.setSnackbar({ color: "warning", message: "Describí brevemente el incidente." });
    return;
  }
  if (!activeTrip.value) {
    general.setSnackbar({ color: "error", message: "No tenés un viaje/camión activo." });
    return;
  }
  saving.value = true;
  const pos = await getPosition();
  const files = [photo.value, audio.value, video.value].filter(Boolean) as File[];

  const ok = await incidentStore.createIncident(
    {
      truckId: activeTrip.value.truckId,
      tripId: activeTrip.value.id,
      type: selectedType.value,
      description: description.value,
      lat: pos?.lat,
      lng: pos?.lng,
    },
    files,
  );
  saving.value = false;
  if (ok) router.push("/chofer/incidentes");
};

onMounted(() => tripStore.getMyTrips());
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-3">
      <v-btn icon="mdi-arrow-left" variant="text" to="/chofer/incidentes" />
      <h1 class="text-h6 font-weight-bold">Reportar incidente</h1>
    </div>

    <p class="text-subtitle-2 font-weight-bold mb-2">Tipo</p>
    <div class="type-grid mb-4">
      <v-card
        v-for="t in incidentTypeOptions"
        :key="t.value"
        :color="selectedType === t.value ? t.color : undefined"
        :variant="selectedType === t.value ? 'flat' : 'outlined'"
        class="pa-3 text-center"
        @click="selectedType = t.value"
      >
        <v-icon size="28">{{ t.icon }}</v-icon>
        <div class="text-caption mt-1">{{ t.label }}</div>
      </v-card>
    </div>

    <VoiceTextarea
      v-model="description"
      label="Descripción"
      variant="outlined"
      rows="3"
      auto-grow
      class="mb-3"
    />

    <div class="d-flex flex-column ga-2 mb-4">
      <v-file-input
        label="Foto"
        accept="image/*"
        capture="environment"
        prepend-icon="mdi-camera"
        variant="outlined"
        density="compact"
        hide-details
        @change="(e: Event) => pick(e, 'photo')"
      />
      <v-file-input
        label="Audio"
        accept="audio/*"
        prepend-icon="mdi-microphone"
        variant="outlined"
        density="compact"
        hide-details
        @change="(e: Event) => pick(e, 'audio')"
      />
      <v-file-input
        label="Video"
        accept="video/*"
        capture="environment"
        prepend-icon="mdi-video"
        variant="outlined"
        density="compact"
        hide-details
        @change="(e: Event) => pick(e, 'video')"
      />
    </div>

    <p class="text-caption text-medium-emphasis mb-3">
      <v-icon size="14">mdi-map-marker</v-icon>
      Se registrará tu ubicación al enviar.
    </p>

    <v-btn
      color="error"
      block
      size="large"
      :loading="saving"
      prepend-icon="mdi-send"
      @click="submit"
    >
      Enviar incidente
    </v-btn>
  </div>
</template>

<style scoped>
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
</style>
