<script setup lang="ts">
import { BellRingingIcon } from "vue-tabler-icons";

const items = [
  { title: "Click Me 1" },
  { title: "Click Me 2" },
  { title: "Click Me 3" },
  { title: "Click Me 4" },
];
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- Notifications DD -->
  <!-- ---------------------------------------------- -->
  <v-menu :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn
        icon
        variant="text"
        class="custom-hover-primary mx-2 text-muted"
        v-bind="props"
      >
        <v-badge dot color="primary" offset-x="-5" offset-y="-3">
          <BellRingingIcon stroke-width="1.5" size="22" />
        </v-badge>
      </v-btn>
    </template>
    <v-sheet rounded="md" width="200" elevation="10" class="mt-2">
      <v-list class="py-0" density="compact">
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          :value="index"
          color="primary"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-sheet>
  </v-menu>
</template>
