<script setup lang="ts">
import { ref } from "vue";
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
const tabInicial = useRoute().query.tab;
const tab = ref(
  typeof tabInicial === "string" &&
    ["fleets", "trucks", "trailers"].includes(tabInicial)
    ? tabInicial
    : "fleets",
);
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
        <FleetTrucksTab />
      </v-window-item>
      <v-window-item value="trailers" eager>
        <FleetTrailersTab />
      </v-window-item>
    </v-window>
  </div>
</template>
