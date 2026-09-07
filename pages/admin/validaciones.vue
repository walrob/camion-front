<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import PageHeader from "~/components/shared/PageHeader.vue";
import EmptyState from "~/components/shared/EmptyState.vue";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";
import { useChecklistStore, type Checklist } from "~/stores/checklist";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher"],
});
useHead({ title: "Validaciones de Tráfico" });

/**
 * Bandeja de Tráfico: planillas pre-viaje firmadas que **no liberan** la unidad.
 *
 * La firma del chofer cierra su declaración; no la aprueba. Mientras una
 * planilla esté acá, el camión no puede iniciar el viaje: es esta pantalla la
 * que lo destraba, y queda registrado quién lo hizo y con qué observación.
 */
const store = useChecklistStore();
const { pendientes, loading, saving } = storeToRefs(store);
const { fmtDate } = useFormatters();

const dialogo = ref(false);
const aprobando = ref(true);
const actual = ref<Checklist | null>(null);
const nota = ref("");

const abrir = (checklist: Checklist, approved: boolean) => {
  actual.value = checklist;
  aprobando.value = approved;
  nota.value = "";
  dialogo.value = true;
};

/** No liberar sin motivo no le sirve a nadie: ni al chofer que espera ni a la
 *  auditoría que lo lee después. El backend lo exige; acá se avisa antes. */
const puedeConfirmar = computed(
  () => aprobando.value || !!nota.value.trim(),
);

const confirmar = async () => {
  if (!actual.value || !puedeConfirmar.value) return;
  const ok = await store.validate(actual.value.id, {
    approved: aprobando.value,
    notes: nota.value.trim() || undefined,
  });
  if (ok) dialogo.value = false;
};

/** Por qué esta planilla quedó esperando: lo que Tráfico necesita mirar. */
const motivos = (checklist: Checklist) => {
  const fallas = (checklist.items ?? []).filter((i) => i.status === "fail");
  const salida: { texto: string; color: string; icon: string }[] = fallas.map(
    (i) => ({
      texto: i.notes ? `${i.label} — ${i.notes}` : i.label,
      color: "error",
      icon: "mdi-alert",
    }),
  );
  const companions = checklist.companions ?? [];
  if (checklist.hasCompanion || companions.length) {
    salida.push({
      texto: companions.length
        ? `Acompañante: ${companions
            .map(
              (c) =>
                `${c.fullName}${c.document ? ` (${c.document})` : ""}${
                  c.insuranceRequested ? "" : " — SIN SEGURO"
                }`,
            )
            .join("; ")}`
        : "Declaró acompañante sin cargar los datos",
      color: "warning",
      icon: "mdi-account-multiple",
    });
  }
  return salida;
};

onMounted(() => store.getPendientes());
</script>

<template>
  <div>
    <PageHeader
      title="Validaciones de Tráfico"
      subtitle="Planillas pre-viaje firmadas cuya unidad todavía no está liberada"
    />

    <v-alert type="info" variant="tonal" rounded="lg" density="comfortable" class="mb-5">
      Mientras una planilla esté acá, el chofer <strong>no puede iniciar el
      viaje</strong>. Liberar la unidad o rechazarla queda registrado con tu
      nombre y la hora.
    </v-alert>

    <div v-if="loading && !pendientes.length" class="d-flex justify-center my-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState
      v-else-if="!pendientes.length"
      icon="mdi-check-all"
      text="No hay ninguna planilla esperando validación. Todas las unidades que firmaron quedaron resueltas."
    />

    <v-card
      v-for="c in pendientes"
      :key="c.id"
      border
      flat
      rounded="lg"
      class="mb-4"
    >
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-2 flex-wrap">
          <v-icon color="warning">mdi-clock-alert-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold">
            Viaje {{ c.tripId?.slice(0, 8) }}
          </span>
          <v-chip
            v-if="c.templateCode || c.templateRevision"
            size="x-small"
            label
            variant="outlined"
          >
            {{ [c.templateCode, c.templateRevision].filter(Boolean).join(" · ") }}
          </v-chip>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">
            Firmada {{ fmtDate(c.signedAt) }}
          </span>
        </div>

        <div
          v-for="(m, i) in motivos(c)"
          :key="i"
          class="d-flex align-start ga-2 py-1 text-body-2"
        >
          <v-icon size="16" :color="m.color">{{ m.icon }}</v-icon>
          <span>{{ m.texto }}</span>
        </div>

        <v-alert
          v-if="c.notes"
          variant="tonal"
          density="compact"
          class="mt-3"
          icon="mdi-comment-text-outline"
        >
          {{ c.notes }}
        </v-alert>

        <div class="d-flex ga-2 mt-4 flex-wrap">
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-check-decagram"
            @click="abrir(c, true)"
          >
            Liberar unidad
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            prepend-icon="mdi-close-octagon"
            @click="abrir(c, false)"
          >
            No liberar
          </v-btn>
          <v-spacer />
          <v-btn
            variant="text"
            prepend-icon="mdi-truck"
            :to="`/admin/viajes?trip=${c.tripId}`"
          >
            Ver viaje
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogo" max-width="520">
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold">
          {{ aprobando ? "Liberar la unidad" : "No liberar la unidad" }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            <template v-if="aprobando">
              La unidad queda habilitada y el chofer va a poder iniciar el viaje.
            </template>
            <template v-else>
              La planilla queda rechazada y el viaje no se puede iniciar. El
              chofer va a ver el motivo que escribas.
            </template>
          </p>
          <VoiceTextarea
            v-model="nota"
            :label="aprobando ? 'Observación (opcional)' : 'Motivo *'"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogo = false">Cancelar</v-btn>
          <v-btn
            :color="aprobando ? 'success' : 'error'"
            :loading="saving"
            :disabled="!puedeConfirmar"
            @click="confirmar"
          >
            {{ aprobando ? "Liberar" : "Rechazar" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
