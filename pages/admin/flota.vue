<script setup lang="ts">
import { ref } from "vue";
import FleetTrucksTab from "~/components/fleet/FleetTrucksTab.vue";
import FleetTrailersTab from "~/components/fleet/FleetTrailersTab.vue";
import FleetFleetsTab from "~/components/fleet/FleetFleetsTab.vue";

definePageMeta({
  layout: "admin",
  roles: ["admin", "manager", "dispatcher", "maintenance"],
});

useHead({ title: "Flota" });

const tab = ref("trucks");
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Flota</h1>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="trucks">Camiones</v-tab>
      <v-tab value="trailers">Acoplados</v-tab>
      <v-tab value="fleets">Flotas</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="trucks" eager>
        <FleetTrucksTab />
      </v-window-item>
      <v-window-item value="trailers" eager>
        <FleetTrailersTab />
      </v-window-item>
      <v-window-item value="fleets" eager>
        <FleetFleetsTab />
      </v-window-item>
    </v-window>
  </div>
</template>
