<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useOeaStore } from "~/stores/oea";
import { useGeneralStore } from "~/stores/general";
import { useGeolocation } from "~/composables/useGeolocation";
import { oeaSectionLabels } from "~/composables/useOea";
import OeaItemRow from "~/components/oea/OeaItemRow.vue";
import SignaturePad from "~/components/trip/SignaturePad.vue";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

definePageMeta({ layout: "driver" });
useHead({ title: "Planilla OEA" });

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const store = useOeaStore();
const general = useGeneralStore();
const { getPosition } = useGeolocation();
const { current, loading, saving, isSigned } = storeToRefs(store);

const pad = ref<InstanceType<typeof SignaturePad> | null>(null);

// Datos de transporte / documentación (sección 1).
const header = ref({
  tripNumber: "",
  origin: "",
  destination: "",
  cargoDescription: "",
  cargoWeightKg: null as number | null,
  customsSealNumber: "",
  securitySealNumber: "",
  driverDocument: "",
  driverLicense: "",
  notes: "",
});

const sections = computed(() => {
  const items = current.value?.items ?? [];
  const order = ["physical", "security_devices"];
  return order
    .map((sec) => ({
      key: sec,
      label: oeaSectionLabels[sec],
      items: items.filter((i) => i.section === sec),
    }))
    .filter((s) => s.items.length);
});

const saveHeader = async () => {
  const payload: Record<string, any> = { ...header.value };
  if (payload.cargoWeightKg) payload.cargoWeightKg = Number(payload.cargoWeightKg);
  Object.keys(payload).forEach((k) => {
    if (payload[k] === "" || payload[k] == null) delete payload[k];
  });
  const ok = await store.updateHeader(id, payload);
  if (ok) general.setSuccessSnackbar("Datos guardados");
};

const onSign = async () => {
  if (!pad.value?.isDirty()) {
    general.setSnackbar({ color: "warning", message: "Firmá antes de cerrar." });
    return;
  }
  await saveHeader();
  const blob = await pad.value.toBlob();
  if (!blob) return;
  const ok = await store.sign(id, blob);
  if (ok) router.push("/chofer/oea");
};

onMounted(async () => {
  await store.getOne(id);
  const c = current.value;
  if (c) {
    header.value = {
      tripNumber: c.tripNumber ?? "",
      origin: c.origin ?? "",
      destination: c.destination ?? "",
      cargoDescription: c.cargoDescription ?? "",
      cargoWeightKg: c.cargoWeightKg ?? null,
      customsSealNumber: c.customsSealNumber ?? "",
      securitySealNumber: c.securitySealNumber ?? "",
      driverDocument: c.driverDocument ?? "",
      driverLicense: c.driverLicense ?? "",
      notes: c.notes ?? "",
    };
    // Registrar ubicación de la inspección si aún no se completó.
    if (!isSigned.value) {
      const pos = await getPosition();
      if (pos?.lat) store.updateHeader(id, { lat: pos.lat, lng: pos.lng });
    }
  }
});
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-3">
      <v-btn icon="mdi-arrow-left" aria-label="Volver" variant="text" to="/chofer/oea" />
      <h1 class="text-h6 font-weight-bold">Planilla de control OEA</h1>
    </div>

    <v-alert
      v-if="isSigned"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      Planilla firmada y cerrada.
    </v-alert>

    <div v-if="loading && !current" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="current">
      <!-- Sección 1: datos del transporte y documentación -->
      <v-card variant="outlined" class="mb-3">
        <v-card-text>
          <p class="text-subtitle-2 font-weight-bold mb-2">
            Transporte y documentación
          </p>
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="header.tripNumber"
                label="Nº de viaje"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.cargoWeightKg"
                label="Peso carga (kg)"
                type="number"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.origin"
                label="Origen"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.destination"
                label="Destino"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="12">
              <VoiceTextField
                v-model="header.cargoDescription"
                label="Descripción de la carga"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.customsSealNumber"
                label="Precinto aduanero"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.securitySealNumber"
                label="Precinto de seguridad"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.driverDocument"
                label="DNI chofer"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="header.driverLicense"
                label="Licencia"
                variant="outlined"
                density="compact"
                :readonly="isSigned"
              />
            </v-col>
          </v-row>
          <v-btn
            v-if="!isSigned"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-content-save-outline"
            @click="saveHeader"
          >
            Guardar datos
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Secciones 2 y 3: inspección física y dispositivos de seguridad -->
      <template v-for="sec in sections" :key="sec.key">
        <p class="text-subtitle-2 font-weight-bold mt-3 mb-1">{{ sec.label }}</p>
        <OeaItemRow
          v-for="item in sec.items"
          :key="item.id"
          :item="item"
          :disabled="isSigned"
        />
      </template>

      <!-- Firma -->
      <template v-if="!isSigned">
        <p class="text-subtitle-2 font-weight-bold mt-4 mb-1">Firma del chofer</p>
        <SignaturePad ref="pad" />
        <v-btn
          color="primary"
          block
          size="large"
          class="mt-4"
          :loading="saving"
          prepend-icon="mdi-check-decagram"
          @click="onSign"
        >
          Cerrar y firmar
        </v-btn>
      </template>

      <v-btn
        v-else
        color="success"
        block
        size="large"
        class="mt-4"
        prepend-icon="mdi-clipboard-list"
        to="/chofer/oea"
      >
        Volver a planillas
      </v-btn>
    </template>
  </div>
</template>
