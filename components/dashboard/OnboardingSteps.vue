<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  useOnboardingStore,
  type OnboardingStepKey,
} from "~/stores/onboarding";

/**
 * Primeros pasos para el admin de una empresa nueva.
 *
 * Reemplaza al asistente obligatorio de `/initial`: en vez de frenar el ingreso,
 * muestra lo que falta con el progreso real y se oculta sola al terminar (o con
 * "Ocultar"). Un asistente que se marca como hecho al tocar "Empezar" deja de
 * recordar justo lo que quedó sin hacer.
 */
const auth = useAuthStore();
const general = useGeneralStore();
const { $api } = useNuxtApp();
const onboardingStore = useOnboardingStore();
const { steps, hidden, loaded, completed, required, allDone } =
  storeToRefs(onboardingStore);

onMounted(() => {
  if (auth.isAdmin) onboardingStore.getProgress();
});

interface StepInfo {
  title: string;
  hint: string;
  action: string;
  /** Sin destino, la acción se resuelve acá adentro (el logo). */
  to?: string;
}

const STEP_INFO: Record<OnboardingStepKey, StepInfo> = {
  trucks: {
    title: "Cargá tus camiones",
    hint: "Uno por uno o todos juntos desde un Excel.",
    action: "Cargar camiones",
    to: "/admin/flota?tab=trucks",
  },
  // Los dos van a Choferes y no a RRHH: el alta de ahí crea un legajo mínimo y
  // funciona en todos los planes, incluido Control, que no tiene RRHH.
  drivers: {
    title: "Cargá a tus choferes",
    hint: "Nombre, DNI y teléfono alcanzan, o todos juntos desde un Excel. Son ilimitados en todos los planes.",
    action: "Cargar choferes",
    to: "/admin/choferes",
  },
  driverApp: {
    title: "Dale la app a un chofer",
    hint: "Tocá «Dar acceso» en el listado de choferes: así recibe los viajes en el celular.",
    action: "Ir a choferes",
    to: "/admin/choferes",
  },
  expirations: {
    title: "Cargá los vencimientos",
    hint: "VTV, RUTA, seguros, licencias: con la fecha cargada, el sistema te avisa antes de que venzan.",
    action: "Cargar documentos",
    to: "/admin/documentos",
  },
  trip: {
    title: "Creá tu primer viaje",
    hint: "Asignale camión y chofer: le llega al instante en la app.",
    action: "Ir a viajes",
    to: "/admin/viajes",
  },
  tripFinished: {
    title: "Cerrá tu primer viaje",
    hint: "El chofer lo finaliza desde la app y el viaje pasa a los indicadores del panel.",
    action: "Ver viajes",
    to: "/admin/viajes",
  },
  logo: {
    title: "Poné tu logo",
    hint: "Opcional. Aparece en el panel y en los remitos y comprobantes que imprimís.",
    action: "Subir logo",
  },
};

const visible = computed(
  () => auth.isAdmin && loaded.value && !hidden.value && !allDone.value,
);

const progress = computed(() =>
  required.value.length ? (completed.value / required.value.length) * 100 : 0,
);

// ───────────────────────── Logo ─────────────────────────
//
// Se resuelve en un diálogo y no mandando a otra pantalla: es un solo campo, y
// navegar a otro lado para elegir un archivo es el rodeo que hace que el paso
// no se haga nunca.

const showLogo = ref(false);
const logo = ref<File[] | File | null>(null);
const subiendoLogo = ref(false);

const subirLogo = async () => {
  const archivo = Array.isArray(logo.value) ? logo.value[0] : logo.value;
  if (!archivo) return;

  subiendoLogo.value = true;
  try {
    const datos = new FormData();
    datos.append("file", archivo);
    await $api.patch("companies/me/logo", datos);
    await auth.fetchSession(true);
    await onboardingStore.getProgress();
    logo.value = null;
    showLogo.value = false;
    general.setSnackbar({ color: "success", message: "Listo, ya está tu logo." });
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    subiendoLogo.value = false;
  }
};
</script>

<template>
  <v-card v-if="visible" border flat rounded="lg" class="mb-4">
    <v-card-item>
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            Primeros pasos
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ completed }} de {{ required.length }} listos para tener tu
            operación andando
          </div>
        </div>
        <v-btn
          variant="text"
          size="small"
          class="text-none"
          text="Ocultar"
          @click="onboardingStore.hide()"
        />
      </div>
      <v-progress-linear
        :model-value="progress"
        color="primary"
        rounded
        height="6"
        class="mt-3"
      />
    </v-card-item>

    <v-list density="comfortable" class="py-0">
      <v-list-item
        v-for="step in steps"
        :key="step.key"
        :class="{ 'text-medium-emphasis': step.done }"
      >
        <template #prepend>
          <v-icon
            :color="step.done ? 'success' : 'grey'"
            :icon="
              step.done
                ? 'mdi-check-circle'
                : 'mdi-checkbox-blank-circle-outline'
            "
          />
        </template>
        <v-list-item-title
          :class="
            step.done ? 'text-decoration-line-through' : 'font-weight-medium'
          "
        >
          {{ STEP_INFO[step.key].title }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="!step.done" class="text-wrap">
          {{ STEP_INFO[step.key].hint }}
        </v-list-item-subtitle>
        <template v-if="!step.done" #append>
          <v-btn
            v-if="STEP_INFO[step.key].to"
            :to="STEP_INFO[step.key].to"
            color="primary"
            variant="tonal"
            size="small"
            class="text-none ml-2"
            :text="STEP_INFO[step.key].action"
          />
          <v-btn
            v-else
            color="primary"
            variant="tonal"
            size="small"
            class="text-none ml-2"
            :text="STEP_INFO[step.key].action"
            @click="showLogo = true"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="showLogo" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="pt-5 px-6">Poné tu logo</v-card-title>
        <v-card-text class="px-6">
          <p class="text-body-2 text-medium-emphasis mb-4">
            PNG, JPG, WEBP o SVG.
          </p>
          <v-file-input
            v-model="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            label="Elegí el archivo"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn text="Cancelar" @click="showLogo = false" />
          <v-btn
            color="primary"
            variant="flat"
            text="Subir"
            :disabled="!logo"
            :loading="subiendoLogo"
            @click="subirLogo"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
