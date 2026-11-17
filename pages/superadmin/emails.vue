<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";
import {
  ACTIVACION,
  SEGMENTOS,
  type EngagementMetrics,
  type EngagementPreviewItem,
  type EngagementRateRow,
  type EngagementSegment,
} from "~/types/engagement";

/**
 * Emails de activación y re-enganche: cuántos salieron, cuántos se abrieron
 * (clic en el botón) y cuántos terminaron haciendo lo que el email pedía.
 *
 * Además, la vista previa —a quién le saldría qué si el cron corriera ahora—
 * para revisar antes de prender el envío, y el envío de prueba de cada paso a
 * la casilla propia, para ver cómo se ve.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Emails de activación" });

const { get, post } = useApi();
const general = useGeneralStore();

const dias = ref(30);
const metricas = ref<EngagementMetrics | null>(null);
const cargando = ref(true);

const vistaPrevia = ref<EngagementPreviewItem[] | null>(null);
const cargandoVista = ref(false);
const enviando = ref<string | null>(null);

const ORDEN: EngagementSegment[] = [
  "unverified",
  "activation",
  "first_trip",
  "inactive",
];

const cargar = async () => {
  cargando.value = true;
  try {
    metricas.value = await get<EngagementMetrics>(
      "superadmin/engagement/metrics",
      { days: dias.value },
    );
  } catch (e: any) {
    general.setSnackbar({ color: "error", message: e?.message });
  } finally {
    cargando.value = false;
  }
};

const verVistaPrevia = async () => {
  cargandoVista.value = true;
  try {
    vistaPrevia.value = await get<EngagementPreviewItem[]>(
      "superadmin/engagement/preview",
    );
  } catch (e: any) {
    general.setSnackbar({ color: "error", message: e?.message });
  } finally {
    cargandoVista.value = false;
  }
};

const enviarPrueba = async (segment: EngagementSegment, step: number) => {
  enviando.value = `${segment}-${step}`;
  try {
    const r = await post<{ to: string; subject: string; sent: boolean }>(
      "superadmin/engagement/test",
      { segment, step },
    );
    general.setSnackbar(
      r.sent
        ? { color: "success", message: `Te mandamos «${r.subject}» a ${r.to}.` }
        : {
            color: "warning",
            message: "EMAIL_ENABLED=false en el back: no salió ningún email.",
          },
    );
  } catch (e: any) {
    general.setSnackbar({ color: "error", message: e?.message });
  } finally {
    enviando.value = null;
  }
};

/** Pasos por segmento, con los que todavía no se mandaron en cero. */
const filas = computed(() =>
  ORDEN.map((segment) => {
    const total = metricas.value?.segments.find((s) => s.segment === segment);
    const pasos = SEGMENTOS[segment].pasos.map((cuando, i) => {
      const paso = metricas.value?.steps.find(
        (s) => s.segment === segment && s.step === i + 1,
      );
      return { step: i + 1, cuando, ...vacio(segment), ...paso };
    });
    return { segment, total: total ?? vacio(segment), pasos };
  }),
);

function vacio(segment: EngagementSegment): EngagementRateRow {
  return {
    segment,
    sent: 0,
    clicks: 0,
    activated: 0,
    clickRate: 0,
    activationRate: 0,
  };
}

/** En qué estado está el envío, en una frase. */
const estado = computed(() => {
  const m = metricas.value;
  if (!m) return null;
  if (!m.enabled)
    return {
      color: "grey",
      texto: "Apagado (ACTIVATION_EMAILS_ENABLED no es true): el cron no corre.",
    };
  if (m.dryRun)
    return {
      color: "warning",
      texto: "DRY_RUN: el cron evalúa y loguea a quién le escribiría, pero no envía nada.",
    };
  return { color: "success", texto: "Enviando de verdad." };
});

watch(dias, cargar);
onMounted(cargar);
</script>

<template>
  <div>
    <PageHeader
      title="Emails de activación"
      subtitle="Correo sin confirmar, sin primer viaje, primer viaje e inactividad"
    >
      <template #actions>
        <v-btn-toggle
          v-model="dias"
          mandatory
          density="compact"
          variant="outlined"
          color="primary"
          divided
        >
          <v-btn :value="7" class="text-none">7 días</v-btn>
          <v-btn :value="30" class="text-none">30 días</v-btn>
          <v-btn :value="90" class="text-none">90 días</v-btn>
        </v-btn-toggle>
      </template>
    </PageHeader>

    <div v-if="cargando && !metricas" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="metricas">
      <v-alert
        v-if="estado"
        :color="estado.color"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ estado.texto }}
        <span class="text-medium-emphasis">
          · {{ metricas.businessHoursNow ? "Ahora es" : "Ahora no es" }}
          horario de envío (lunes a viernes, 9 a 19 h)
          · {{ metricas.optedOut }} persona(s) dadas de baja
        </span>
      </v-alert>

      <v-card border flat rounded="lg" class="mb-6">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>Segmento / paso</th>
              <th class="text-right">Enviados</th>
              <th class="text-right">Clics</th>
              <th class="text-right">Activación posterior</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="f in filas" :key="f.segment">
              <tr class="bg-grey-lighten-4">
                <td>
                  <strong>{{ SEGMENTOS[f.segment].letra }}.
                    {{ SEGMENTOS[f.segment].nombre }}</strong>
                  <div class="text-caption text-medium-emphasis">
                    Activación: {{ ACTIVACION[f.segment] }}
                  </div>
                </td>
                <td class="text-right font-weight-bold">{{ f.total.sent }}</td>
                <td class="text-right font-weight-bold">
                  {{ f.total.clicks }}
                  <span class="text-caption">({{ f.total.clickRate }} %)</span>
                </td>
                <td class="text-right font-weight-bold">
                  {{ f.total.activated }}
                  <span class="text-caption">({{ f.total.activationRate }} %)</span>
                </td>
                <td></td>
              </tr>
              <tr v-for="p in f.pasos" :key="`${f.segment}-${p.step}`">
                <td class="pl-8 text-body-2">
                  Paso {{ p.step }} · {{ p.cuando }}
                </td>
                <td class="text-right">{{ p.sent }}</td>
                <td class="text-right">
                  {{ p.clicks }}
                  <span class="text-caption text-medium-emphasis">({{ p.clickRate }} %)</span>
                </td>
                <td class="text-right">
                  {{ p.activated }}
                  <span class="text-caption text-medium-emphasis">({{ p.activationRate }} %)</span>
                </td>
                <td class="text-right">
                  <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    class="text-none"
                    prepend-icon="mdi-email-fast-outline"
                    :loading="enviando === `${f.segment}-${p.step}`"
                    @click="enviarPrueba(f.segment, p.step)"
                  >
                    Enviarme una prueba
                  </v-btn>
                </td>
              </tr>
            </template>
          </tbody>
        </v-table>
      </v-card>

      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <div class="text-subtitle-1 font-weight-bold">Vista previa</div>
          <div class="text-body-2 text-medium-emphasis">
            A quién le saldría qué si el cron corriera ahora. No envía nada e
            ignora el horario.
          </div>
        </div>
        <v-btn
          variant="tonal"
          color="primary"
          class="text-none"
          prepend-icon="mdi-eye-outline"
          :loading="cargandoVista"
          @click="verVistaPrevia"
        >
          Ver vista previa
        </v-btn>
      </div>

      <v-card v-if="vistaPrevia" border flat rounded="lg">
        <div
          v-if="!vistaPrevia.length"
          class="text-body-2 text-medium-emphasis pa-4"
        >
          Ahora no le tocaría ningún email a nadie.
        </div>
        <v-table v-else density="compact">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Destinatario</th>
              <th>Segmento</th>
              <th>Asunto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in vistaPrevia" :key="`${v.userId}-${v.segment}`">
              <td>{{ v.companyName }}</td>
              <td class="text-body-2">{{ v.email }}</td>
              <td class="text-no-wrap">
                {{ SEGMENTOS[v.segment].letra }}{{ v.step }} ·
                {{ SEGMENTOS[v.segment].nombre }}
              </td>
              <td>{{ v.subject }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </template>
  </div>
</template>
