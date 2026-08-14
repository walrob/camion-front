<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

/**
 * Pagos de todas las empresas y avisos de Mercado Pago.
 *
 * Las dos solapas responden la misma pregunta desde los dos lados: la primera,
 * qué plata entró; la segunda, **qué plata entró y el sistema todavía no
 * reconoce**. Un aviso sin procesar es un pago que el cliente ya hizo y que,
 * mientras nadie lo vea acá, termina en un bloqueo que no le corresponde.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Pagos" });

const { get, post } = useApi();
const { money, fmtDate, fmtDateTime } = useFormatters();
const general = useGeneralStore();

const solapa = ref<"pagos" | "avisos">("pagos");

// ───────── Pagos ─────────

const pagos = ref<any[]>([]);
const metaPagos = ref<any>(null);
const cargandoPagos = ref(true);
const paginaPagos = ref(1);
const busqueda = ref("");
const estado = ref<string | null>(null);
const metodo = ref<string | null>(null);

const ESTADOS = [
  { value: "paid", title: "Acreditado" },
  { value: "pending", title: "Pendiente" },
  { value: "rejected", title: "Rechazado" },
  { value: "refunded", title: "Devuelto" },
  { value: "canceled", title: "Cancelado" },
];

const METODOS = [
  { value: "mercadopago", title: "Mercado Pago" },
  { value: "transfer", title: "Transferencia" },
  { value: "cash", title: "Efectivo" },
  { value: "check", title: "Cheque" },
  { value: "other", title: "Otro" },
];

const COLOR_ESTADO: Record<string, string> = {
  paid: "success",
  pending: "warning",
  rejected: "error",
  refunded: "grey",
  canceled: "grey",
};

const ETIQUETA_ESTADO: Record<string, string> = Object.fromEntries(
  ESTADOS.map((e) => [e.value, e.title]),
);

const ETIQUETA_METODO: Record<string, string> = Object.fromEntries(
  METODOS.map((m) => [m.value, m.title]),
);

const cargarPagos = async () => {
  cargandoPagos.value = true;
  try {
    const r: any = await get("superadmin/payments", {
      page: paginaPagos.value,
      limit: 20,
      search: busqueda.value || undefined,
      estado: estado.value || undefined,
      metodo: metodo.value || undefined,
    });
    pagos.value = r.items;
    metaPagos.value = r.meta;
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    cargandoPagos.value = false;
  }
};

// Los filtros se aplican solos, con espera: cada tecla del buscador no puede
// ser una consulta.
let debounce: ReturnType<typeof setTimeout>;
watch([busqueda, estado, metodo], () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    paginaPagos.value = 1;
    cargarPagos();
  }, 400);
});

watch(paginaPagos, cargarPagos);

// ───────── Avisos de Mercado Pago ─────────

const avisos = ref<any[]>([]);
const metaAvisos = ref<any>(null);
const pendientes = ref(0);
const cargandoAvisos = ref(true);
const paginaAvisos = ref(1);
const soloErrores = ref(true);
const reprocesando = ref<string | null>(null);

const cargarAvisos = async () => {
  cargandoAvisos.value = true;
  try {
    const r: any = await get("superadmin/mp-events", {
      page: paginaAvisos.value,
      limit: 20,
      soloErrores: soloErrores.value ? 1 : undefined,
    });
    avisos.value = r.items;
    metaAvisos.value = r.meta;
    pendientes.value = r.pendientes;
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    cargandoAvisos.value = false;
  }
};

watch([soloErrores], () => {
  paginaAvisos.value = 1;
  cargarAvisos();
});
watch(paginaAvisos, cargarAvisos);

const reprocesar = async (aviso: any) => {
  reprocesando.value = aviso.id;
  try {
    const r: any = await post(`superadmin/mp-events/${aviso.id}/retry`);
    if (r.error) {
      // El motivo se muestra tal cual vino: quien opera necesita leerlo, no
      // recibir un "algo salió mal" que lo obligue a abrir el log.
      general.setSnackbar({ color: "error", message: r.error });
    } else {
      general.setSnackbar({
        color: "success",
        message: "El aviso se procesó correctamente.",
      });
    }
    await cargarAvisos();
    if (solapa.value === "pagos") await cargarPagos();
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    reprocesando.value = null;
  }
};

const acreditado = computed(() =>
  pagos.value
    .filter((p) => p.status === "paid")
    .reduce((a, p) => a + Number(p.amount), 0),
);

onMounted(() => {
  cargarPagos();
  cargarAvisos();
});
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">Pagos</h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Todo lo cobrado, por Mercado Pago o conciliado a mano, y los avisos que
      quedaron sin procesar.
    </p>

    <v-tabs v-model="solapa" color="primary" class="mb-4">
      <v-tab value="pagos">Pagos</v-tab>
      <v-tab value="avisos">
        Avisos de Mercado Pago
        <v-chip
          v-if="pendientes"
          color="error"
          size="x-small"
          variant="flat"
          class="ml-2"
        >
          {{ pendientes }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <!-- ───────── Pagos ───────── -->
    <template v-if="solapa === 'pagos'">
      <div class="d-flex flex-wrap ga-3 mb-4">
        <v-text-field
          v-model="busqueda"
          placeholder="Empresa, referencia o ID de MP"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 320px"
        />
        <v-select
          v-model="estado"
          :items="ESTADOS"
          label="Estado"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 190px"
        />
        <v-select
          v-model="metodo"
          :items="METODOS"
          label="Medio"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 190px"
        />
      </div>

      <v-row dense class="mb-2">
        <v-col cols="6" md="3">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-caption text-medium-emphasis">
              Acreditado en esta página
            </div>
            <div class="text-h6 font-weight-bold">{{ money(acreditado) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-caption text-medium-emphasis">Pagos totales</div>
            <div class="text-h6 font-weight-bold">
              {{ metaPagos?.totalItems ?? 0 }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card border flat rounded="lg">
        <div v-if="cargandoPagos" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Fecha</th>
              <th>Período</th>
              <th>Medio</th>
              <th>Estado</th>
              <th>Referencia</th>
              <th class="text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pagos" :key="p.id">
              <td>
                <NuxtLink
                  :to="`/superadmin/empresas/${p.companyId}`"
                  class="text-primary"
                >
                  {{ p.companyName }}
                </NuxtLink>
              </td>
              <td>{{ fmtDate(p.paidAt) }}</td>
              <td class="text-caption">
                {{ p.periodStart ? fmtDate(p.periodStart) : "—" }}
              </td>
              <td>{{ ETIQUETA_METODO[p.method] ?? p.method }}</td>
              <td>
                <v-chip
                  :color="COLOR_ESTADO[p.status]"
                  variant="tonal"
                  size="x-small"
                >
                  {{ ETIQUETA_ESTADO[p.status] ?? p.status }}
                </v-chip>
              </td>
              <td class="text-caption">
                {{ p.mpPaymentId ?? p.reference ?? "—" }}
              </td>
              <td class="text-right font-weight-medium">
                {{ money(p.amount) }}
              </td>
            </tr>
            <tr v-if="!pagos.length">
              <td colspan="7" class="text-center text-medium-emphasis py-6">
                No hay pagos que coincidan.
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <div
        v-if="metaPagos && metaPagos.totalPages > 1"
        class="d-flex justify-center mt-4"
      >
        <v-pagination
          v-model="paginaPagos"
          :length="metaPagos.totalPages"
          :total-visible="7"
          density="comfortable"
        />
      </div>
    </template>

    <!-- ───────── Avisos de Mercado Pago ───────── -->
    <template v-else>
      <div class="d-flex flex-wrap align-center ga-3 mb-4">
        <v-switch
          v-model="soloErrores"
          color="primary"
          density="compact"
          hide-details
          label="Sólo los que quedaron sin procesar"
        />
      </div>

      <v-alert
        v-if="pendientes"
        type="warning"
        variant="tonal"
        rounded="lg"
        density="comfortable"
        class="mb-4"
      >
        Hay {{ pendientes }} aviso(s) sin procesar. Cada uno puede ser un pago
        hecho que el sistema todavía no acreditó.
      </v-alert>

      <v-card border flat rounded="lg">
        <div v-if="cargandoAvisos" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>Recibido</th>
              <th>Tipo</th>
              <th>Recurso en MP</th>
              <th>Empresa</th>
              <th>Resultado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in avisos" :key="a.id">
              <td class="text-caption">{{ fmtDateTime(a.createdAt) }}</td>
              <td>{{ a.type }}</td>
              <td class="text-caption">{{ a.resourceId }}</td>
              <td>
                <NuxtLink
                  v-if="a.companyId"
                  :to="`/superadmin/empresas/${a.companyId}`"
                  class="text-primary"
                >
                  {{ a.companyName }}
                </NuxtLink>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
              <td>
                <v-chip
                  v-if="a.processedAt"
                  color="success"
                  variant="tonal"
                  size="x-small"
                >
                  Procesado
                </v-chip>
                <div v-else>
                  <v-chip color="error" variant="tonal" size="x-small">
                    Sin procesar
                  </v-chip>
                  <div
                    v-if="a.error"
                    class="text-caption text-error mt-1"
                    style="max-width: 420px"
                  >
                    {{ a.error }}
                  </div>
                </div>
              </td>
              <td class="text-right">
                <v-btn
                  v-if="!a.processedAt"
                  size="small"
                  variant="text"
                  color="primary"
                  :loading="reprocesando === a.id"
                  @click="reprocesar(a)"
                >
                  Reprocesar
                </v-btn>
              </td>
            </tr>
            <tr v-if="!avisos.length">
              <td colspan="6" class="text-center text-medium-emphasis py-6">
                {{
                  soloErrores
                    ? "No hay avisos sin procesar."
                    : "Todavía no llegó ningún aviso de Mercado Pago."
                }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <div
        v-if="metaAvisos && metaAvisos.totalPages > 1"
        class="d-flex justify-center mt-4"
      >
        <v-pagination
          v-model="paginaAvisos"
          :length="metaAvisos.totalPages"
          :total-visible="7"
          density="comfortable"
        />
      </div>
    </template>
  </div>
</template>
