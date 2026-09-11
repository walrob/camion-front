<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAlertRuleStore, type AlertRule } from "~/stores/alertRule";
import { Feature } from "~/types/plan";

/**
 * Reglas del motor de alertas: qué avisa el sistema y con qué umbral
 * (docs/CONFIGURACION.md §6.3).
 *
 * Dos permisos distintos: prender/apagar entra con la configuración; cambiar un
 * umbral es «Umbrales de alerta personalizables», del plan Gestión.
 */
const store = useAlertRuleStore();
const { rules, loading, saving } = storeToRefs(store);

const { has } = useFeatures();
const puedeUmbrales = computed(() => has(Feature.ALERT_THRESHOLDS));

/** Copia editable: nada cambia hasta que se aprieta Guardar. */
const borrador = ref<AlertRule[]>([]);
const sincronizar = () => (borrador.value = rules.value.map((r) => ({ ...r })));
watch(rules, sincronizar, { immediate: true });

const cambios = computed(() =>
  borrador.value.filter((b) => {
    const original = rules.value.find((r) => r.key === b.key);
    return (
      !!original &&
      (original.enabled !== b.enabled || String(original.value) !== String(b.value))
    );
  }),
);

const guardar = async () => {
  if (!cambios.value.length) return;
  await store.save(
    cambios.value.map((r) => ({
      key: r.key,
      enabled: r.enabled,
      value: r.value ?? undefined,
    })),
  );
};

const COLOR_NIVEL: Record<string, string> = {
  red: "error",
  orange: "warning",
  yellow: "amber",
  green: "success",
};

onMounted(() => store.getRules());
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
      Qué avisa el sistema solo y a partir de qué valor. Todas vienen activas con
      los valores de siempre: si no tocás nada, seguís recibiendo las mismas
      alertas.
    </v-alert>

    <v-card v-if="!puedeUmbrales" border flat rounded="lg" class="mb-4">
      <v-card-text class="pa-5 d-flex align-center ga-4 flex-wrap">
        <v-icon color="medium-emphasis" size="24">mdi-lock-outline</v-icon>
        <div class="min-w-0 flex-grow-1">
          <div class="text-subtitle-2 font-weight-bold">
            Cambiar los umbrales viene con el plan Gestión
          </div>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Con tu plan podés prender y apagar reglas; los valores quedan en los
            de fábrica.
          </p>
        </div>
        <v-btn color="primary" variant="tonal" to="/upgrade/alert_thresholds">
          Ver qué incluye
        </v-btn>
      </v-card-text>
    </v-card>

    <div v-if="loading && !rules.length" class="d-flex justify-center my-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card v-else border flat rounded="lg">
      <v-card-text class="pa-5">
        <div
          v-for="(regla, i) in borrador"
          :key="regla.key"
          :class="['regla', { 'regla--con-linea': i > 0 }]"
        >
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-icon :color="COLOR_NIVEL[regla.level]" size="14">mdi-circle</v-icon>

            <div class="regla__texto">
              <div class="text-body-2 font-weight-medium d-flex align-center ga-2">
                {{ regla.label }}
                <v-chip v-if="regla.personalizada" size="x-small" label variant="tonal">
                  Configurada
                </v-chip>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">{{ regla.help }}</p>
            </div>

            <v-text-field
              v-if="regla.threshold"
              v-model="regla.value"
              :label="regla.threshold.label"
              :suffix="regla.threshold.unit === 'monto' ? '' : regla.threshold.unit"
              :prefix="regla.threshold.unit === 'monto' ? '$' : ''"
              :min="regla.threshold.min"
              :max="regla.threshold.max"
              :disabled="!puedeUmbrales || !regla.enabled"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              class="regla__umbral"
            />

            <!-- Las reglas de incidentes y RRHH no se apagan: silenciar el aviso
                 de un accidente es perder el motivo por el que existe la app. -->
            <v-tooltip
              v-if="regla.siempreActiva"
              text="Es parte del funcionamiento del sistema: no se puede desactivar"
              location="top"
            >
              <template #activator="{ props }">
                <v-icon v-bind="props" size="18" color="medium-emphasis">
                  mdi-lock-outline
                </v-icon>
              </template>
            </v-tooltip>
            <v-switch
              v-else
              v-model="regla.enabled"
              color="primary"
              density="compact"
              hide-details
              class="regla__switch"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-slide-y-reverse-transition>
      <div v-if="cambios.length" class="barra-guardado mt-4">
        <v-card border flat rounded="lg" class="pa-3 d-flex align-center ga-3">
          <v-icon color="warning" size="20">mdi-content-save-alert-outline</v-icon>
          <span class="text-body-2">
            {{ cambios.length }}
            {{ cambios.length === 1 ? "regla modificada" : "reglas modificadas" }}
          </span>
          <v-spacer />
          <v-btn variant="text" size="small" @click="sincronizar">Descartar</v-btn>
          <v-btn
            color="primary"
            size="small"
            :loading="saving"
            prepend-icon="mdi-check"
            @click="guardar"
          >
            Guardar
          </v-btn>
        </v-card>
      </div>
    </v-slide-y-reverse-transition>
  </div>
</template>

<style scoped lang="scss">
.regla {
  padding: 14px 0;

  &--con-linea {
    border-top: 1px solid rgb(var(--v-theme-borderColor));
  }

  // Base 0 y no auto: con base auto el bloque mide lo que mide la descripción
  // entera, y una larga empuja el campo y el switch a la fila de abajo. Con
  // base 0 el texto se acomoda al espacio que queda y la fila se mantiene.
  &__texto {
    flex: 1 1 0;
    min-width: 0;
  }

  &__umbral {
    flex: 0 0 190px;
  }

  &__switch {
    flex: 0 0 auto;
  }
}

// En pantallas chicas no entra todo en una fila: el texto ocupa la fila
// completa y el campo y el switch bajan.
@media (max-width: 599px) {
  .regla__texto {
    // 100 % menos el punto de color y su gap, para que queden en la misma línea.
    flex-basis: calc(100% - 26px);
  }
}

.barra-guardado {
  position: sticky;
  bottom: 16px;
  z-index: 5;
}
</style>
