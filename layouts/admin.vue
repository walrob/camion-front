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

import { useTheme } from "vuetify";
const theme = useTheme();
const isDark = user.value?.isTemplateDark;
const newTheme = isDark ? "DarkTheme" : "PurpleTheme";
theme.change(newTheme);
</script>

<template>
  <v-locale-provider>
    <v-app>
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
