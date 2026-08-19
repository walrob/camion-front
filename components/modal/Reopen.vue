<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";

/**
 * Diálogo único para reabrir algo cerrado: incidente, alerta, orden de taller
 * o liquidación.
 *
 * El motivo es obligatorio acá y también en el backend, que es donde vale. Se
 * pide igual en la pantalla para que el rechazo no llegue como un error rojo
 * después de haber apretado el botón: quien reabre tiene que escribir por qué
 * antes de que pase nada.
 */
const props = defineProps({
  title: { type: String, default: "Reabrir" },
  /** Qué se reabre, en una línea. Se muestra arriba del campo. */
  description: { type: String, default: "" },
  /** Texto del botón de confirmación. */
  confirmText: { type: String, default: "Reabrir" },
  loading: Boolean,
});

const abierto = defineModel<boolean>();
const emit = defineEmits<{ confirm: [motivo: string] }>();

const motivo = ref("");
const formRef = ref();

/** El mismo mínimo que exige el backend, para no discutirle al usuario. */
const LARGO_MINIMO = 5;

const reglas = [
  (v: string) =>
    (v ?? "").trim().length >= LARGO_MINIMO || "Contá brevemente por qué.",
];

// El motivo no se recuerda entre aperturas: es de esta reapertura, no del
// diálogo.
watch(abierto, (v) => {
  if (v) motivo.value = "";
});

const confirmar = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  emit("confirm", motivo.value.trim());
};
</script>

<template>
  <v-dialog v-model="abierto" max-width="480">
    <UiModalCard :title="title">
      <p v-if="description" class="text-body-2 text-medium-emphasis mb-4">
        {{ description }}
      </p>

      <v-form ref="formRef" @submit.prevent="confirmar">
        <v-textarea
          v-model="motivo"
          label="Motivo de la reapertura"
          placeholder="Ej.: el problema volvió a aparecer en el viaje 1043."
          variant="outlined"
          rows="3"
          autofocus
          counter="300"
          maxlength="300"
          :rules="reglas"
        />
      </v-form>

      <p class="text-caption text-medium-emphasis mb-0">
        Queda registrado en la auditoría con tu usuario y la fecha.
      </p>

      <template #footer>
        <v-btn variant="text" :disabled="loading" @click="abierto = false">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="loading"
          @click="confirmar"
        >
          {{ confirmText }}
        </v-btn>
      </template>
    </UiModalCard>
  </v-dialog>
</template>
