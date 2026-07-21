<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTripStore } from "~/stores/trip";
import { useChecklistStore } from "~/stores/checklist";
import { useGeneralStore } from "~/stores/general";
import ChecklistItemRow from "~/components/trip/ChecklistItemRow.vue";
import SignaturePad from "~/components/trip/SignaturePad.vue";

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
const general = useGeneralStore();
const { trip } = storeToRefs(tripStore);
const { checklist, loading, saving, isApproved } = storeToRefs(checklistStore);

const pad = ref<InstanceType<typeof SignaturePad> | null>(null);
const hasSignature = ref(false);

const items = computed(() => checklist.value?.items ?? []);
const total = computed(() => items.value.length || 1);
const reviewed = computed(
  () => items.value.filter((i) => i.status === "ok" || i.status === "fail").length,
);
const failed = computed(() => items.value.filter((i) => i.status === "fail").length);

const onSign = async () => {
  if (!pad.value?.isDirty()) {
    general.setSnackbar({ color: "warning", message: "Firmá antes de aprobar." });
    return;
  }
  const blob = await pad.value.toBlob();
  if (!blob) return;
  const ok = await checklistStore.sign(blob);
  if (ok) router.push(`/chofer/viaje/${id}`);
};

onMounted(async () => {
  await tripStore.getMyTrip(id);
  await checklistStore.load(id);
  if (!checklist.value && trip.value) {
    await checklistStore.ensure({
      tripId: id,
      truckId: trip.value.truckId,
      driverId: trip.value.driverId,
    });
  }
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

    <div v-if="loading && !checklist" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="checklist">
      <!--
        Todos los ítems nacen en "N/A" (es el default de la entidad en el back),
        así que sin este resumen el checklist se ve igual recién abierto que
        contestado y se puede firmar sin haber mirado nada. La barra cuenta solo
        lo que el chofer marcó como OK o Falla.
      -->
      <v-card
        v-if="!isApproved"
        border
        flat
        rounded="lg"
        class="pa-3 mb-3"
      >
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
          Los ítems empiezan en N/A. Marcá OK o Falla en los que revises.
        </p>
      </v-card>

      <ChecklistItemRow
        v-for="item in checklist.items"
        :key="item.id"
        :item="item"
        :disabled="isApproved"
      />

      <template v-if="!isApproved">
        <p class="text-subtitle-2 font-weight-bold mt-4 mb-1">Firma del chofer</p>
        <SignaturePad ref="pad" @change="hasSignature = $event" />

        <v-btn
          color="primary"
          block
          size="large"
          class="mt-4"
          :loading="saving"
          prepend-icon="mdi-check-decagram"
          @click="onSign"
        >
          Aprobar y firmar
        </v-btn>
      </template>

      <v-btn
        v-else
        color="success"
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
