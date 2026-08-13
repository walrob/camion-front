<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

/** Listado de empresas con sus métricas de uso. */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Empresas" });

const { get } = useApi();
const { num } = useFormatters();

const empresas = ref<any[]>([]);
const cargando = ref(true);
const busqueda = ref("");
const estado = ref<string | null>(null);

const ESTADOS = [
  { value: "trial", title: "En prueba" },
  { value: "active", title: "Activa" },
  { value: "defaulter", title: "En mora" },
  { value: "blocked", title: "Suspendida" },
  { value: "cancelled", title: "Dada de baja" },
];

const COLOR: Record<string, string> = {
  trial: "info",
  active: "success",
  defaulter: "warning",
  blocked: "error",
  cancelled: "grey",
};

const filtradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  return empresas.value.filter((e) => {
    if (estado.value && e.status !== estado.value) return false;
    if (!q) return true;
    return (
      e.name?.toLowerCase().includes(q) || e.slug?.toLowerCase().includes(q)
    );
  });
});

const cargar = async () => {
  cargando.value = true;
  try {
    empresas.value = await get("superadmin/companies");
  } finally {
    cargando.value = false;
  }
};

onMounted(cargar);
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">Empresas</h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ filtradas.length }} de {{ empresas.length }} empresas.
    </p>

    <div class="d-flex flex-wrap ga-3 mb-4">
      <v-text-field
        v-model="busqueda"
        placeholder="Buscar por nombre"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 300px"
      />
      <v-select
        v-model="estado"
        :items="ESTADOS"
        label="Estado"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 200px"
      />
    </div>

    <v-card border flat rounded="lg">
      <div v-if="cargando" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Plan</th>
            <th>Estado</th>
            <th class="text-right">Camiones</th>
            <th class="text-right">Usuarios</th>
            <th class="text-right">Storage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtradas" :key="e.id">
            <td>
              <div class="font-weight-medium">{{ e.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ e.slug }}</div>
            </td>
            <td>{{ e.planName ?? "—" }}</td>
            <td>
              <v-chip :color="COLOR[e.status]" variant="tonal" size="x-small">
                {{ e.status }}
              </v-chip>
            </td>
            <td class="text-right">{{ num(e.camionesActivos) }}</td>
            <td class="text-right">{{ num(e.usuarios) }}</td>
            <td class="text-right">{{ e.storageGbUsados }} GB</td>
            <td class="text-right">
              <v-btn
                size="small"
                variant="text"
                :to="`/superadmin/empresas/${e.id}`"
              >
                Ver
              </v-btn>
            </td>
          </tr>
          <tr v-if="!filtradas.length">
            <td colspan="7" class="text-center text-medium-emphasis py-6">
              Sin resultados.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
