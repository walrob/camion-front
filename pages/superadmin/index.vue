<script setup lang="ts">
import { onMounted, ref } from "vue";

/** Tablero de plataforma: MRR, altas, mora y trials por vencer. */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Tablero de plataforma" });

const { get } = useApi();
const { money, num } = useFormatters();

const datos = ref<any>(null);
const cargando = ref(true);

const ESTADOS: Record<string, { texto: string; color: string }> = {
  trial: { texto: "En prueba", color: "info" },
  active: { texto: "Activas", color: "success" },
  defaulter: { texto: "En mora", color: "warning" },
  blocked: { texto: "Suspendidas", color: "error" },
  cancelled: { texto: "Dadas de baja", color: "grey" },
};

const diasRestantes = (fecha: string) =>
  Math.max(0, Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000));

onMounted(async () => {
  try {
    datos.value = await get("superadmin/dashboard");
  } finally {
    cargando.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">Tablero</h1>
    <p class="text-body-2 text-medium-emphasis mb-5">
      Estado comercial de toda la plataforma.
    </p>

    <div v-if="cargando" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="datos">
      <v-row dense class="mb-2">
        <v-col cols="6" md="3">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-caption text-medium-emphasis">MRR</div>
            <div class="text-h5 font-weight-bold">{{ money(datos.mrr) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-caption text-medium-emphasis">Empresas</div>
            <div class="text-h5 font-weight-bold">{{ num(datos.empresas) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-caption text-medium-emphasis">ARPU</div>
            <div class="text-h5 font-weight-bold">{{ money(datos.arpu) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-caption text-medium-emphasis">Altas del mes</div>
            <div class="text-h5 font-weight-bold">{{ datos.altasDelMes }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" md="5">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-subtitle-1 font-weight-medium mb-3">
              Por estado
            </div>
            <div
              v-for="(cant, estado) in datos.porEstado"
              :key="estado"
              class="d-flex justify-space-between align-center py-2 border-b"
            >
              <v-chip
                :color="ESTADOS[estado]?.color"
                variant="tonal"
                size="small"
              >
                {{ ESTADOS[estado]?.texto ?? estado }}
              </v-chip>
              <strong>{{ cant }}</strong>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-subtitle-1 font-weight-medium mb-1">
              Trials por vencer
            </div>
            <p class="text-caption text-medium-emphasis mb-3">
              Los próximos 7 días. Es la lista de llamados pendientes.
            </p>

            <div
              v-if="!datos.trialsPorVencer.length"
              class="text-body-2 text-medium-emphasis"
            >
              Ningún trial vence esta semana.
            </div>

            <div
              v-for="t in datos.trialsPorVencer"
              :key="t.id"
              class="d-flex justify-space-between align-center py-2 border-b"
            >
              <NuxtLink
                :to="`/superadmin/empresas/${t.id}`"
                class="text-body-2 text-primary"
              >
                {{ t.name }}
              </NuxtLink>
              <v-chip
                size="x-small"
                :color="diasRestantes(t.trialEndsAt) <= 2 ? 'error' : 'warning'"
                variant="tonal"
              >
                {{ diasRestantes(t.trialEndsAt) }} días
              </v-chip>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
