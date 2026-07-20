<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useIncidentStore } from "~/stores/incident";
import { useIncidentStatus } from "~/composables/useIncidentStatus";
import EmptyState from "~/components/shared/EmptyState.vue";

definePageMeta({ layout: "driver" });
useHead({ title: "Mis incidentes" });
useDriverPage({ title: "Mis incidentes" });

const incidentStore = useIncidentStore();
const { myIncidents, loading } = storeToRefs(incidentStore);
const { incidentType, incidentStatus } = useIncidentStatus();

const { fmtDateTime: fmt } = useFormatters();

onMounted(() => incidentStore.getMyIncidents());
</script>

<template>
  <div>
    <Teleport defer to="#driver-hero-actions">
      <v-btn
        color="white"
        variant="flat"
        class="text-error"
        prepend-icon="mdi-plus"
        to="/chofer/incidente/nuevo"
      >
        Reportar
      </v-btn>
    </Teleport>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <EmptyState
        v-if="!myIncidents.length"
        icon="mdi-shield-check-outline"
        text="No reportaste incidentes."
      />
      <v-card
        v-for="i in myIncidents"
        :key="i.id"
        rounded="lg"
        border
        flat
        class="mb-3"
      >
        <v-card-text class="py-3 d-flex align-center ga-3">
          <v-avatar
            :color="incidentType(i.type).color"
            size="40"
            variant="tonal"
          >
            <v-icon :color="incidentType(i.type).color">{{
              incidentType(i.type).icon
            }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="d-flex justify-space-between">
              <span class="font-weight-bold">{{
                incidentType(i.type).label
              }}</span>
              <v-chip
                :color="incidentStatus(i.status).color"
                size="x-small"
                label
              >
                {{ incidentStatus(i.status).label }}
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ i.code }} · {{ fmt(i.createdAt) }}
            </div>
            <div class="text-body-2">{{ i.description }}</div>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
