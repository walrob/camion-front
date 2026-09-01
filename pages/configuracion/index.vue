<script setup lang="ts">
import { ref } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";
import SettingsAjustes from "~/components/settings/SettingsAjustes.vue";
import SettingsChecklist from "~/components/settings/SettingsChecklist.vue";
import SettingsCatalogs from "~/components/settings/SettingsCatalogs.vue";
import { Feature } from "~/types/plan";

/**
 * Configuración de la empresa: dónde el sistema se adapta a cómo trabaja cada
 * cliente en vez de imponerle una forma (docs/CONFIGURACION.md).
 */
definePageMeta({
  feature: Feature.SETTINGS,
  layout: "admin",
  roles: ["admin"],
});

useHead({ title: "Configuración" });

const tab = ref("ajustes");
</script>

<template>
  <div>
    <PageHeader
      title="Configuración"
      subtitle="Adaptá el sistema a la forma de trabajar de tu empresa"
    />

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="ajustes">Ajustes</v-tab>
      <v-tab value="checklist">Checklist</v-tab>
      <v-tab value="catalogos">Catálogos</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="ajustes">
        <SettingsAjustes />
      </v-window-item>
      <v-window-item value="checklist">
        <SettingsChecklist />
      </v-window-item>
      <v-window-item value="catalogos">
        <SettingsCatalogs />
      </v-window-item>
    </v-window>
  </div>
</template>
