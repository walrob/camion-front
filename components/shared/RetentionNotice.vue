<script setup lang="ts">
import { computed } from "vue";

/**
 * Aviso de que el plan recorta el histórico visible.
 *
 * Es importante que diga que el dato **está guardado** y no que se borró: la
 * retención es un corte de lectura, no una eliminación (decisión D4 del plan
 * SaaS). Comunicarlo mal convierte una palanca de upgrade en un motivo de baja.
 */
const { limite, plan } = useFeatures();

const meses = computed(() => limite("retentionMonths") as number | null);
const hayCorte = computed(() => !!meses.value);

const texto = computed(() => {
  if (!meses.value) return "";
  const m = meses.value;
  const enAnios = m % 12 === 0 ? m / 12 : null;
  const periodo = enAnios
    ? `${enAnios} ${enAnios === 1 ? "año" : "años"}`
    : `${m} meses`;
  return `Tu plan ${plan.value?.name ?? ""} muestra los últimos ${periodo}.`;
});
</script>

<template>
  <v-alert
    v-if="hayCorte"
    variant="tonal"
    density="compact"
    color="info"
    class="mb-3"
    rounded="lg"
  >
    <div class="d-flex align-center flex-wrap ga-2">
      <v-icon size="18">mdi-history</v-icon>
      <span class="text-body-2">
        {{ texto }}
        <strong>Tus datos anteriores siguen guardados</strong>: se vuelven a ver
        al ampliar el plan.
      </span>
      <v-spacer />
      <v-btn
        size="small"
        variant="text"
        color="info"
        to="/upgrade/indicators"
      >
        Ver histórico completo
      </v-btn>
    </div>
  </v-alert>
</template>
