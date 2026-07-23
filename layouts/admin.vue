<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | FleetLog` : "FleetLog";
  },
});

import { useGeneralStore } from "@/stores/general";
const generalStore = useGeneralStore();
const { snackbar } = storeToRefs(generalStore);

import { useAuthStore } from "~/stores/auth";
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const isDemo = computed(() => authStore.isDemo);

import { useTheme } from "vuetify";
const theme = useTheme();
const isDark = user.value?.isTemplateDark;
const newTheme = isDark ? "FleetDark" : "FleetLight";
theme.change(newTheme);
</script>

<template>
  <v-locale-provider>
    <v-app>
      <!-- Cinta de modo demo (solo lectura) -->
      <div v-if="isDemo" class="demo-ribbon">
        <v-icon size="16" class="me-1">mdi-eye-outline</v-icon>
        Modo demo — solo lectura. Podés ver todo y descargar PDFs; no se guardan
        cambios.
      </div>

      <!-- Layout principal -->
      <LayoutFullMain />
      <v-main>
        <v-container fluid class="page-wrapper">
          <div class="maxWidth">
            <NuxtPage />
          </div>
        </v-container>
      </v-main>

      <!-- Snackbar -->
      <v-snackbar
        v-model="snackbar.state"
        :timeout="snackbar.timeout"
        :color="snackbar.color"
        rounded="pill"
      >
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.state = false"> X </v-btn>
        </template>
      </v-snackbar>
    </v-app>
  </v-locale-provider>
</template>

<style scoped lang="scss">
.demo-ribbon {
  position: fixed;
  width: 100%;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  background: rgb(var(--v-theme-accent));
}
</style>
