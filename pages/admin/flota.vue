<script setup lang="ts">
import { ref, watch } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";
import FleetTrucksTab from "~/components/fleet/FleetTrucksTab.vue";
import FleetTrailersTab from "~/components/fleet/FleetTrailersTab.vue";
import FleetFleetsTab from "~/components/fleet/FleetFleetsTab.vue";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher", "maintenance"],
});

useHead({ title: "Flota" });

// Desde el panel se llega directo a la pestaña que corresponde (?tab=trucks);
// el estado del camión (?status) lo aplica la pestaña al montarse.
const route = useRoute();
const TABS = ["fleets", "trucks", "trailers"];
const tab = ref(
  typeof route.query.tab === "string" && TABS.includes(route.query.tab)
    ? route.query.tab
    : "fleets",
);
// El buscador (Ctrl+K) puede pedir otra pestaña estando ya en Flota.
watch(
  () => route.query.tab,
  (t) => {
    if (typeof t === "string" && TABS.includes(t)) tab.value = t;
  },
);

// «Nuevo camión» / «Nuevo acoplado» desde el buscador o el menú Crear.
const trucksTab = ref<InstanceType<typeof FleetTrucksTab> | null>(null);
const trailersTab = ref<InstanceType<typeof FleetTrailersTab> | null>(null);
useAccionDeQuery("nuevo", (que) => {
  if (que === "acoplado") {
    tab.value = "trailers";
    trailersTab.value?.openNew();
  } else {
    tab.value = "trucks";
    trucksTab.value?.openNew();
  }
});
</script>

<template>
  <div>
    <PageHeader title="Flota" subtitle="Flotas, camiones y acoplados" />

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="fleets">Flotas</v-tab>
      <v-tab value="trucks">Camiones</v-tab>
      <v-tab value="trailers">Acoplados</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="fleets" eager>
        <FleetFleetsTab />
      </v-window-item>
      <v-window-item value="trucks" eager>
        <FleetTrucksTab ref="trucksTab" />
      </v-window-item>
      <v-window-item value="trailers" eager>
        <FleetTrailersTab ref="trailersTab" />
      </v-window-item>
    </v-window>
  </div>
</template>
