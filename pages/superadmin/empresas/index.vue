<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

/**
 * Listado de empresas con sus métricas de uso.
 *
 * Filtra y pagina **contra el servidor**: cada fila cuesta dos consultas más
 * (usuarios y unidades), así que traerlas todas para filtrar en el navegador
 * hacía que abrir la pantalla se pusiera más caro con cada cliente nuevo.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Empresas" });

const { get } = useApi();
const { num } = useFormatters();
const general = useGeneralStore();

const empresas = ref<any[]>([]);
const meta = ref<any>(null);
const cargando = ref(true);
const pagina = ref(1);
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

const cargar = async () => {
  cargando.value = true;
  try {
    const r: any = await get("superadmin/companies", {
      page: pagina.value,
      limit: 20,
      search: busqueda.value || undefined,
      estado: estado.value || undefined,
    });
    empresas.value = r.items;
    meta.value = r.meta;
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    cargando.value = false;
  }
};

// Los filtros se aplican solos, con espera: cada tecla no puede ser una
// consulta que además cuenta usuarios y unidades de veinte empresas.
let debounce: ReturnType<typeof setTimeout>;
watch([busqueda, estado], () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    pagina.value = 1;
    cargar();
  }, 400);
});

watch(pagina, cargar);

onMounted(cargar);
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">Empresas</h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ meta?.totalItems ?? 0 }} empresas.
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
          <tr v-for="e in empresas" :key="e.id">
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
          <tr v-if="!empresas.length">
            <td colspan="7" class="text-center text-medium-emphasis py-6">
              Sin resultados.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <div v-if="meta && meta.totalPages > 1" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="pagina"
        :length="meta.totalPages"
        :total-visible="7"
        density="comfortable"
      />
    </div>
  </div>
</template>
