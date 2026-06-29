<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useIncidentStore } from "~/stores/incident";
import { useIncidentStatus } from "~/composables/useIncidentStatus";

definePageMeta({ layout: "driver" });
useHead({ title: "Mis incidentes" });

const incidentStore = useIncidentStore();
const { myIncidents, loading } = storeToRefs(incidentStore);
const { incidentType, incidentStatus } = useIncidentStatus();

const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : "");

onMounted(() => incidentStore.getMyIncidents());
</script>

<template>
  <div>
    <div class="d-flex align-center mb-3">
      <h1 class="text-h6 font-weight-bold">Mis incidentes</h1>
      <v-spacer />
      <v-btn color="error" prepend-icon="mdi-plus" to="/chofer/incidente/nuevo">
        Reportar
      </v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <p v-if="!myIncidents.length" class="text-body-2 text-medium-emphasis">
        No reportaste incidentes.
      </p>
      <v-card v-for="i in myIncidents" :key="i.id" variant="outlined" class="mb-2">
        <v-card-text class="py-2 d-flex align-center ga-3">
          <v-avatar :color="incidentType(i.type).color" size="40">
            <v-icon color="white">{{ incidentType(i.type).icon }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="d-flex justify-space-between">
              <span class="font-weight-bold">{{ incidentType(i.type).label }}</span>
              <v-chip :color="incidentStatus(i.status).color" size="x-small" label>
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
