<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Panel</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Bienvenido{{ authStore.user?.name ? `, ${authStore.user.name}` : "" }}
        </p>
      </div>
    </div>

    <v-card variant="tonal" color="primary" class="pa-6">
      <div class="d-flex align-center ga-3">
        <v-icon size="40">mdi-truck-fast-outline</v-icon>
        <div>
          <p class="text-subtitle-1 font-weight-bold mb-1">
            Sistema de Gestión de Flota
          </p>
          <p class="text-body-2 text-medium-emphasis">
            El dashboard gerencial se implementa en la Fase 8. Usá el menú lateral
            para navegar los módulos disponibles.
          </p>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "auth",
});

useHead({ title: "Panel" });

import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
</script>
