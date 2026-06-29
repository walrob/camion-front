<script setup lang="ts">
import { ref, onMounted } from "vue";
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

const tripStore = useTripStore();
const checklistStore = useChecklistStore();
const general = useGeneralStore();
const { trip } = storeToRefs(tripStore);
const { checklist, loading, saving, isApproved } = storeToRefs(checklistStore);

const pad = ref<InstanceType<typeof SignaturePad> | null>(null);
const hasSignature = ref(false);

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
    <div class="d-flex align-center ga-2 mb-3">
      <v-btn icon="mdi-arrow-left" variant="text" :to="`/chofer/viaje/${id}`" />
      <h1 class="text-h6 font-weight-bold">Checklist pre-viaje</h1>
    </div>

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
