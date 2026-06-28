<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Flota` : "Flota";
  },
});

import { useGeneralStore } from "@/stores/general";
const generalStore = useGeneralStore();
const { snackbar } = storeToRefs(generalStore);

import { usePwa } from "~/composables/usePwa";
const { canInstall, isOnline, promptInstall } = usePwa();

import { useOfflineQueue } from "~/composables/useOfflineQueue";
const { pendingCount } = useOfflineQueue();

// Navegación inferior de la app del chofer. Botones grandes, una mano.
const navItems = [
  { value: "inicio", title: "Inicio", icon: "mdi-home-outline", to: "/chofer" },
  { value: "viaje", title: "Viaje", icon: "mdi-truck-outline", to: "/chofer" },
  {
    value: "incidentes",
    title: "Incidentes",
    icon: "mdi-alert-outline",
    to: "/chofer/incidentes",
  },
  {
    value: "documentos",
    title: "Docs",
    icon: "mdi-file-document-outline",
    to: "/chofer/documentos",
  },
  {
    value: "mensajes",
    title: "Mensajes",
    icon: "mdi-message-outline",
    to: "/chofer/mensajes",
  },
];
</script>

<template>
  <v-locale-provider>
    <v-app>
      <v-app-bar density="compact" color="primary" flat>
        <v-app-bar-title class="text-subtitle-1 font-weight-bold">FleetLog</v-app-bar-title>
        <template #append>
          <v-chip v-if="!isOnline" color="white" size="small" variant="flat" class="mr-2">
            <v-icon start size="14">mdi-wifi-off</v-icon> Sin conexión
          </v-chip>
          <v-chip v-if="pendingCount > 0" color="amber" size="small" variant="flat" class="mr-2">
            <v-icon start size="14">mdi-sync</v-icon> {{ pendingCount }} pend.
          </v-chip>
          <v-btn v-if="canInstall" size="small" variant="text" @click="promptInstall">
            <v-icon start>mdi-download</v-icon> Instalar
          </v-btn>
        </template>
      </v-app-bar>

      <v-main>
        <v-container fluid class="pa-3" style="padding-bottom: 80px">
          <NuxtPage />
        </v-container>
      </v-main>

      <!-- Barra de navegación inferior (placeholders; cada fase enlaza su pantalla) -->
      <v-bottom-navigation grow color="primary" height="68">
        <v-btn
          v-for="item in navItems"
          :key="item.value"
          :to="item.to"
          :value="item.value"
        >
          <v-icon size="24">{{ item.icon }}</v-icon>
          <span class="text-caption">{{ item.title }}</span>
        </v-btn>
      </v-bottom-navigation>

      <!-- Snackbar global -->
      <v-snackbar
        v-model="snackbar.state"
        :timeout="snackbar.timeout"
        :color="snackbar.color"
        rounded="pill"
      >
        {{ snackbar.message }}
      </v-snackbar>
    </v-app>
  </v-locale-provider>
</template>
