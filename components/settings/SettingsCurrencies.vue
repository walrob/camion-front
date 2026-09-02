<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useCurrencyStore } from "~/stores/currency";
import { useSettingsStore } from "~/stores/settings";

/**
 * Monedas de la empresa y cotizaciones (docs/CONFIGURACION.md §7).
 *
 * Quien no cruza la frontera no necesita entrar acá: con una sola moneda el
 * resto del sistema no muestra ningún selector.
 */
const store = useCurrencyStore();
const { base, currencies, conocidas, rates, saving } = storeToRefs(store);

const settings = useSettingsStore();
const monedaBase = computed(() => settings.str("locale.baseCurrency") || base.value);

const { fmtDate } = useFormatters();

/** Códigos habilitados, tal como se editan en el selector múltiple. */
const habilitadas = ref<string[]>([]);

const sincronizar = () => {
  habilitadas.value = currencies.value.map((c) => c.code);
};

const guardarMonedas = async () => {
  // La base va siempre: sin ella la empresa se quedaría sin moneda de reporte.
  const codigos = [...new Set([monedaBase.value, ...habilitadas.value])];
  const ok = await store.saveCurrencies(
    codigos.map((code) => {
      const conocida = conocidas.value.find((k) => k.code === code);
      return {
        code,
        symbol: conocida?.symbol,
        decimals: conocida?.decimals,
        isActive: true,
      };
    }),
  );
  if (ok) sincronizar();
};

// ── Cotización del día ────────────────────────────────────────────────────
const hoy = new Date().toISOString().slice(0, 10);
const nueva = ref({ code: "", date: hoy, rate: null as number | null });

const monedasCotizables = computed(() =>
  currencies.value.filter((c) => c.code !== monedaBase.value),
);

const puedeCargar = computed(
  () => !!nueva.value.code && !!nueva.value.date && Number(nueva.value.rate) > 0,
);

const cargarCotizacion = async () => {
  if (!puedeCargar.value) return;
  const ok = await store.saveRate({
    code: nueva.value.code,
    date: nueva.value.date,
    rate: Number(nueva.value.rate),
  });
  if (ok) nueva.value = { code: "", date: hoy, rate: null };
};

onMounted(async () => {
  await store.load(true);
  await settings.load();
  await store.getRates();
  sincronizar();
});
</script>

<template>
  <div>
    <v-alert
      type="info"
      variant="tonal"
      rounded="lg"
      density="comfortable"
      class="mb-5"
    >
      Si tu flota cruza la frontera, habilitá las monedas en las que se gasta. El
      chofer elige la moneda al cargar y el sistema la convierte a
      <strong>{{ monedaBase }}</strong> con la cotización del día, que queda
      guardada en el movimiento: una rendición cerrada no cambia de valor porque
      después se movió el dólar.
    </v-alert>

    <v-card border flat rounded="lg" class="mb-4">
      <v-card-text class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-1">
          Monedas habilitadas
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Tu moneda base es <strong>{{ monedaBase }}</strong> y se cambia en la
          pestaña <em>Ajustes</em>. Es en la que se ven los indicadores y el neto
          de cada rendición.
        </p>

        <v-select
          v-model="habilitadas"
          :items="conocidas"
          item-title="label"
          item-value="code"
          label="Monedas con las que operás"
          variant="outlined"
          density="comfortable"
          multiple
          chips
          closable-chips
          hide-details
          class="mb-4"
        >
          <template #chip="{ props: cp, item }">
            <v-chip v-bind="cp" :text="item.raw.code" size="small" label />
          </template>
        </v-select>

        <div class="d-flex">
          <v-spacer />
          <v-btn color="primary" :loading="saving" @click="guardarMonedas">
            Guardar monedas
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card v-if="monedasCotizables.length" border flat rounded="lg" class="mb-4">
      <v-card-text class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-1">Cotizaciones</div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Cuántos <strong>{{ monedaBase }}</strong> vale una unidad de cada moneda.
          Se aplica a los movimientos de ese día; al cargarla, los que habían
          quedado pendientes se convierten solos.
        </p>

        <v-row dense align="center">
          <v-col cols="12" sm="3">
            <v-select
              v-model="nueva.code"
              :items="monedasCotizables"
              item-title="code"
              item-value="code"
              label="Moneda"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="nueva.date"
              label="Día"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="nueva.rate"
              :label="`Equivale a … ${monedaBase}`"
              type="number"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              block
              :loading="saving"
              :disabled="!puedeCargar"
              @click="cargarCotizacion"
            >
              Cargar
            </v-btn>
          </v-col>
        </v-row>

        <v-table v-if="rates.length" density="compact" class="mt-4">
          <thead>
            <tr>
              <th>Moneda</th>
              <th>Día</th>
              <th class="text-right">Cotización</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rates.slice(0, 12)" :key="r.id">
              <td>{{ r.code }}</td>
              <td>{{ fmtDate(r.date) }}</td>
              <td class="text-right">{{ Number(r.rate).toLocaleString("es-AR") }}</td>
              <td class="text-caption text-medium-emphasis">
                {{ r.source === "manual" ? "Cargada a mano" : r.source }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
</template>
