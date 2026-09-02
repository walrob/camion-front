<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useValidations } from "~/composables/useValidations";
import { useCatalogStore, CATALOG } from "~/stores/catalog";
import { useCurrencyStore } from "~/stores/currency";
import { useGeolocation } from "~/composables/useGeolocation";
import { useTripLogStore } from "~/stores/tripLog";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

const props = defineProps<{
  modelValue: boolean;
  tripId: string;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);

const r = useValidations();
const tripLogStore = useTripLogStore();
const { getPosition } = useGeolocation();

const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const file = ref<File | null>(null);

const emptyForm = () => ({
  type: "fuel",
  amount: null as number | null,
  currency: "",
  liters: null as number | null,
  odometerKm: null as number | null,
  notes: "",
});

const form = ref(emptyForm());

// Los tipos salen del catálogo de la empresa, no de una lista fija. El store
// resuelve servidor → caché → constante, así que en la ruta sin señal el
// selector igual tiene con qué trabajar (docs/CONFIGURACION.md §11).
const catalogStore = useCatalogStore();
const tiposDeGasto = computed(() => catalogStore.activos(CATALOG.EXPENSE_TYPE));

// Monedas de la empresa: con una sola, el formulario es el de siempre.
const currencyStore = useCurrencyStore();
const esMultimoneda = computed(() => currencyStore.esMultimoneda);
const monedaElegida = computed(() =>
  currencyStore.porCodigo(form.value.currency || currencyStore.base),
);
/** En moneda base nunca falta cotización: la conversión es la identidad. */
const sinCotizacion = computed(
  () =>
    esMultimoneda.value &&
    !!form.value.currency &&
    form.value.currency !== currencyStore.base,
);

onMounted(() => {
  catalogStore.load();
  currencyStore.load();
});

const isFuel = computed(() => form.value.type === "fuel");

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = emptyForm();
      // El default es el primer tipo activo: si la empresa desactivó
      // «Combustible», arrancar en él dejaría el formulario en un valor que el
      // backend rechaza.
      const primero = tiposDeGasto.value[0]?.key;
      if (primero) form.value.type = primero;
      form.value.currency = currencyStore.base;
      file.value = null;
    }
  },
);

const onFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
};

const close = () => emit("update:modelValue", false);

const submit = async () => {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  saving.value = true;

  const pos = await getPosition();
  const payload: any = {
    tripId: props.tripId,
    type: form.value.type,
    amount: Number(form.value.amount),
    currency: form.value.currency || undefined,
    notes: form.value.notes || undefined,
    lat: pos?.lat,
    lng: pos?.lng,
  };
  if (isFuel.value && form.value.liters) payload.liters = Number(form.value.liters);
  if (form.value.odometerKm) payload.odometerKm = Number(form.value.odometerKm);

  const ok = await tripLogStore.createEntry(payload, file.value);
  saving.value = false;
  if (ok) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="close">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">Nuevo gasto</v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-select
            v-model="form.type"
            :items="tiposDeGasto"
            item-title="label"
            item-value="key"
            label="Tipo *"
            variant="outlined"
            density="comfortable"
            :rules="[r.isRequired]"
          >
            <template #item="{ props: ip, item }">
              <v-list-item v-bind="ip" :prepend-icon="item.raw.icon" />
            </template>
          </v-select>

          <v-row dense>
            <v-col :cols="esMultimoneda ? 7 : 12">
              <v-text-field
                v-model="form.amount"
                label="Monto *"
                type="number"
                :prefix="monedaElegida.symbol"
                variant="outlined"
                density="comfortable"
                :rules="[r.isRequired]"
              />
            </v-col>
            <!-- Sólo si la empresa opera con más de una moneda: quien no cruza
                 la frontera ve la pantalla de siempre (CONFIGURACION §7.4). -->
            <v-col v-if="esMultimoneda" cols="5">
              <v-select
                v-model="form.currency"
                :items="currencyStore.currencies"
                item-title="code"
                item-value="code"
                label="Moneda"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="sinCotizacion"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Todavía no hay cotización de {{ form.currency }} para hoy. Cargalo
            igual: la oficina la carga después y el gasto se convierte solo.
          </v-alert>

          <v-text-field
            v-if="isFuel"
            v-model="form.liters"
            label="Litros"
            type="number"
            variant="outlined"
            density="comfortable"
          />

          <v-text-field
            v-model="form.odometerKm"
            label="Odómetro (km)"
            type="number"
            variant="outlined"
            density="comfortable"
          />

          <VoiceTextField
            v-model="form.notes"
            label="Observaciones"
            variant="outlined"
            density="comfortable"
          />

          <v-file-input
            label="Foto del comprobante"
            accept="image/*"
            capture="environment"
            prepend-icon=""
            prepend-inner-icon="mdi-camera"
            variant="outlined"
            density="comfortable"
            hide-details
            @change="onFile"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="submit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
