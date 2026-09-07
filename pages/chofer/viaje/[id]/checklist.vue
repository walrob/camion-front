<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { useChecklistStore } from "~/stores/checklist";
import { useSettingsStore } from "~/stores/settings";
import { useGeneralStore } from "~/stores/general";
import { useGeolocation } from "~/composables/useGeolocation";
import ChecklistItemRow from "~/components/trip/ChecklistItemRow.vue";
import ChecklistCompanions from "~/components/trip/ChecklistCompanions.vue";
import SignaturePad from "~/components/trip/SignaturePad.vue";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";

definePageMeta({
  layout: "driver",
});

useHead({ title: "Checklist" });

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

useDriverPage({ title: "Checklist pre-viaje", back: `/chofer/viaje/${id}` });

const tripStore = useTripStore();
const checklistStore = useChecklistStore();
const settings = useSettingsStore();
const general = useGeneralStore();
const { getPosition } = useGeolocation();
const { trip } = storeToRefs(tripStore);
const {
  checklist,
  loading,
  saving,
  isApproved,
  isSigned,
  isRejected,
  isPendingValidation,
  secciones,
  itemsQueSeContestan,
} = storeToRefs(checklistStore);

const pad = ref<InstanceType<typeof SignaturePad> | null>(null);
const hasSignature = ref(false);
const notas = ref("");
const firmando = ref(false);

const exigeUbicacion = computed(() =>
  settings.bool("checklist.requireGeolocation"),
);

/**
 * El avance cuenta sólo lo que el chofer tiene que contestar.
 *
 * Un punto de fotos o de texto libre no se "responde": si entraran en la
 * cuenta, la barra nunca llegaría al final y dejaría de significar algo.
 */
const total = computed(() => itemsQueSeContestan.value.length || 1);
const reviewed = computed(
  () =>
    itemsQueSeContestan.value.filter(
      (i) => i.status === "ok" || i.status === "fail",
    ).length,
);
const failed = computed(
  () => itemsQueSeContestan.value.filter((i) => i.status === "fail").length,
);

/** El formulario con el que se emitió, tal como lo nombra la empresa. */
const formulario = computed(() =>
  [checklist.value?.templateCode, checklist.value?.templateRevision]
    .filter(Boolean)
    .join(" · "),
);

const onNotasBlur = () => {
  if (notas.value !== (checklist.value?.notes ?? ""))
    checklistStore.updateHeader({ notes: notas.value });
};

const onSign = async () => {
  if (!pad.value?.isDirty()) {
    general.setSnackbar({ color: "warning", message: "Firmá antes de aprobar." });
    return;
  }
  const blob = await pad.value.toBlob();
  if (!blob) return;

  firmando.value = true;
  // La ubicación se pide siempre que se pueda, pero sólo frena la firma si la
  // empresa la exige: en un sótano de carga el GPS puede no enganchar, y una
  // planilla que no se puede firmar deja el camión parado.
  const pos = await getPosition();
  if (!pos && exigeUbicacion.value) {
    firmando.value = false;
    general.setSnackbar({
      color: "warning",
      message:
        "Tu empresa exige la ubicación al firmar. Activá el GPS y volvé a intentar.",
    });
    return;
  }

  const ok = await checklistStore.sign(blob, pos);
  firmando.value = false;
  if (ok) router.push(`/chofer/viaje/${id}`);
};

onMounted(async () => {
  settings.load();
  await tripStore.getMyTrip(id);
  await checklistStore.load(id);
  if (!checklist.value && trip.value) {
    await checklistStore.ensure({
      tripId: id,
      truckId: trip.value.truckId,
      driverId: trip.value.driverId,
      // El furgón sale del viaje: son dos patentes y la planilla las pide por
      // separado.
      trailerId: trip.value.trailerId,
    });
  }
  notas.value = checklist.value?.notes ?? "";
});
</script>

<template>
  <div>
    <v-alert
      v-if="isApproved"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Checklist aprobado. Ya podés iniciar el viaje.
    </v-alert>

    <!-- Firmada pero sin liberar. Es el malentendido más caro de la planilla:
         el chofer firmó, todo parece hecho, y la unidad NO puede ir al cliente
         hasta que Tráfico la valide. Se dice con todas las letras. -->
    <v-alert
      v-else-if="isPendingValidation"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="font-weight-bold mb-1">Esperando validación de Tráfico</div>
      La planilla quedó firmada, pero la unidad <strong>no está liberada</strong>.
      No te dirijas al cliente hasta que tu operador de tráfico la valide.
    </v-alert>

    <!-- Falló un punto que la empresa marcó como crítico: el checklist queda
         firmado igual —es el registro de lo que se encontró— pero rechazado, y
         el viaje no arranca hasta que lo resuelvan. -->
    <v-alert
      v-else-if="isRejected"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Checklist rechazado: falló un punto crítico. Avisá al despacho; el viaje no
      se puede iniciar así.
      <div v-if="checklist?.validationNotes" class="mt-2 text-body-2">
        <strong>Tráfico:</strong> {{ checklist.validationNotes }}
      </div>
    </v-alert>

    <div v-if="loading && !checklist" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="checklist">
      <!-- El código y la revisión del formulario con el que se está firmando.
           Es lo que una auditoría pide por nombre, así que tiene que estar a la
           vista y quedar en el registro. -->
      <p v-if="formulario" class="text-caption text-medium-emphasis mb-2">
        Formulario {{ formulario }}
      </p>

      <!--
        Todos los ítems nacen en "N/A" (es el default de la entidad en el back),
        así que sin este resumen el checklist se ve igual recién abierto que
        contestado y se puede firmar sin haber mirado nada. La barra cuenta solo
        lo que el chofer marcó como OK o Falla.
      -->
      <v-card v-if="!isSigned" border flat rounded="lg" class="pa-3 mb-3">
        <div class="d-flex align-center ga-2 mb-2">
          <span class="text-body-2 font-weight-bold">
            {{ reviewed }} de {{ total }} revisados
          </span>
          <v-spacer />
          <v-chip v-if="failed" color="error" size="small" variant="tonal">
            {{ failed }} {{ failed === 1 ? "falla" : "fallas" }}
          </v-chip>
        </div>
        <v-progress-linear
          :model-value="(reviewed / total) * 100"
          :color="failed ? 'error' : 'success'"
          height="8"
          rounded
        />
        <p class="text-caption text-medium-emphasis mt-2 mb-0">
          Los ítems empiezan en N/A. Marcá la respuesta en los que revises.
        </p>
      </v-card>

      <ChecklistCompanions :disabled="isSigned" />

      <!-- Los puntos van agrupados por bloque —tractor, equipo de frío,
           furgón—: leída como una lista corrida de quince preguntas, el chofer
           pierde de vista qué está mirando. Sin secciones definidas, la
           plantilla se dibuja igual que siempre. -->
      <template v-for="(seccion, i) in secciones" :key="seccion.name ?? `s-${i}`">
        <div
          v-if="seccion.name"
          class="text-subtitle-2 font-weight-bold mt-4 mb-2"
        >
          {{ seccion.name }}
        </div>
        <ChecklistItemRow
          v-for="item in seccion.items"
          :key="item.id"
          :item="item"
          :disabled="isSigned"
        />
      </template>

      <!-- «Desarrolle cualquier otro punto que considere importante»: hasta
           ahora no tenía dónde ir y terminaba metido en la observación de un
           ítem que no era. -->
      <v-card border flat rounded="lg" class="mb-3">
        <v-card-text class="pa-4">
          <div class="text-subtitle-2 font-weight-bold mb-2">
            Otras observaciones
          </div>
          <VoiceTextarea
            v-model="notas"
            label="Cualquier otro punto que consideres importante"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
            hide-details
            :readonly="isSigned"
            @blur="onNotasBlur"
          />
        </v-card-text>
      </v-card>

      <template v-if="!isSigned">
        <v-alert
          v-if="exigeUbicacion"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Al firmar se registra tu ubicación: tu empresa la exige en esta
          planilla.
        </v-alert>

        <p class="text-subtitle-2 font-weight-bold mt-4 mb-1">Firma del chofer</p>
        <SignaturePad ref="pad" @change="hasSignature = $event" />

        <v-btn
          color="primary"
          block
          size="large"
          class="mt-4"
          :loading="saving || firmando"
          prepend-icon="mdi-check-decagram"
          @click="onSign"
        >
          Firmar planilla
        </v-btn>
      </template>

      <v-btn
        v-else
        :color="isRejected ? 'error' : isPendingValidation ? 'warning' : 'success'"
        block
        size="large"
        class="mt-4"
        prepend-icon="mdi-truck"
        :to="`/chofer/viaje/${id}`"
      >
        Volver al viaje
      </v-btn>
    </template>
  </div>
</template>
