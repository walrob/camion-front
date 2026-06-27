<template>
  <div>
    <div class="mb-4">
      <h1 class="text-h6 font-weight-bold">
        Hola{{ authStore.user?.name ? `, ${authStore.user.name}` : "" }}
      </h1>
      <p class="text-body-2 text-medium-emphasis">App del Chofer</p>
    </div>

    <v-card variant="tonal" color="primary" class="pa-5">
      <div class="d-flex align-center ga-3">
        <v-icon size="36">mdi-truck-fast-outline</v-icon>
        <div>
          <p class="text-subtitle-2 font-weight-bold mb-1">Sin viajes aún</p>
          <p class="text-caption text-medium-emphasis mb-0">
            Tus viajes asignados, bitácora y checklist aparecerán acá (Fase 2).
          </p>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "driver",
  middleware: "auth",
});

useHead({ title: "Inicio" });

import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
</script>
