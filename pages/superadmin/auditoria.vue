<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";

/**
 * Registro de acciones de la plataforma.
 *
 * La auditoría existía desde la fase 8 pero sólo se podía leer por API, y una
 * auditoría que hay que consultar con curl no se consulta: en la práctica
 * equivalía a no tenerla. Acá se mira lo que hizo el superadmin —incluidas las
 * lecturas de datos de un cliente y las sesiones de impersonación, que son el
 * privilegio que hay que poder rendir (R8.1)—.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Auditoría" });

const { get } = useApi();
const { fmtDateTime } = useFormatters();
const general = useGeneralStore();

const registros = ref<any[]>([]);
const meta = ref<any>(null);
const acciones = ref<string[]>([]);
const cargando = ref(true);
const pagina = ref(1);

const busqueda = ref("");
const accion = ref<string | null>(null);
const desde = ref("");
const hasta = ref("");

/** Detalle abierto: el `metadata` crudo de una fila. */
const detalle = ref<any>(null);

/**
 * Cómo se lee cada acción.
 *
 * Los códigos (`company.plan_changed`) son estables y sirven para filtrar, pero
 * no para leer de un vistazo una lista de doscientas filas.
 */
const ETIQUETA: Record<string, string> = {
  "company.plan_changed": "Cambio de plan",
  "company.status_changed": "Cambio de estado",
  "company.addon_added": "Add-on contratado",
  "company.addon_removed": "Add-on dado de baja",
  "billing.period_issued": "Período emitido",
  "billing.payment_registered": "Pago registrado",
  "billing.company_defaulted": "Pasó a mora",
  "billing.company_blocked": "Cuenta bloqueada",
  "billing.company_regularized": "Cuenta regularizada",
  "mp.payment_received": "Pago de Mercado Pago",
  "mp.subscription_changed": "Débito automático modificado",
  "mp.event_retried": "Aviso de MP reprocesado",
  "plan.updated": "Plan editado",
  "superadmin.impersonation_started": "Sesión de soporte iniciada",
  "superadmin.viewed_company": "Ficha de empresa consultada",
};

/** Las que hay que poder distinguir de un vistazo. */
const COLOR: Record<string, string> = {
  "superadmin.impersonation_started": "warning",
  "superadmin.viewed_company": "info",
  "billing.company_blocked": "error",
  "billing.company_defaulted": "warning",
  "plan.updated": "primary",
};

const cargar = async () => {
  cargando.value = true;
  try {
    const r: any = await get("audit-log", {
      page: pagina.value,
      limit: 50,
      search: busqueda.value || undefined,
      action: accion.value || undefined,
      desde: desde.value || undefined,
      hasta: hasta.value || undefined,
    });
    registros.value = r.items;
    meta.value = r.meta;
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    cargando.value = false;
  }
};

let debounce: ReturnType<typeof setTimeout>;
watch([busqueda, accion, desde, hasta], () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    pagina.value = 1;
    cargar();
  }, 400);
});

watch(pagina, cargar);

onMounted(async () => {
  await cargar();
  try {
    acciones.value = await get("audit-log/actions");
  } catch {
    // El filtro por acción es una ayuda, no un requisito: si falla, la pantalla
    // sigue sirviendo con el resto de los filtros.
  }
});
</script>

<template>
  <div>
    <PageHeader
      title="Auditoría"
      subtitle="Registro inmutable de las acciones sobre la plataforma, de la más reciente hacia atrás."
      :breadcrumbs="[{ title: 'Plataforma', to: '/superadmin' }, { title: 'Auditoría', disabled: true }]"
    />

    <div class="d-flex flex-wrap ga-3 mb-4">
      <v-text-field
        v-model="busqueda"
        placeholder="Actor, entidad o identificador"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 300px"
      />
      <v-select
        v-model="accion"
        :items="acciones"
        :item-title="(a: string) => ETIQUETA[a] ?? a"
        :item-value="(a: string) => a"
        label="Acción"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 260px"
      />
      <v-text-field
        v-model="desde"
        type="date"
        label="Desde"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 170px"
      />
      <v-text-field
        v-model="hasta"
        type="date"
        label="Hasta"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 170px"
      />
    </div>

    <v-card border flat rounded="lg">
      <div v-if="cargando" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Cuándo</th>
            <th>Quién</th>
            <th>Acción</th>
            <th>Sobre</th>
            <th>Origen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in registros" :key="l.id">
            <td class="text-caption text-no-wrap">
              {{ fmtDateTime(l.createdAt) }}
            </td>
            <td>
              <div class="text-body-2">{{ l.actorEmail ?? "sistema" }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ l.actorRole ?? "cron" }}
              </div>
            </td>
            <td>
              <v-chip
                :color="COLOR[l.action]"
                variant="tonal"
                size="x-small"
              >
                {{ ETIQUETA[l.action] ?? l.action }}
              </v-chip>
              <v-chip
                v-if="l.isImpersonation"
                color="warning"
                variant="flat"
                size="x-small"
                class="ml-1"
              >
                impersonando
              </v-chip>
            </td>
            <td class="text-caption">
              <NuxtLink
                v-if="l.companyId"
                :to="`/superadmin/empresas/${l.companyId}`"
                class="text-primary"
              >
                {{ l.entityType ?? "empresa" }}
              </NuxtLink>
              <span v-else class="text-medium-emphasis">
                {{ l.entityType ?? "plataforma" }}
              </span>
            </td>
            <td class="text-caption text-medium-emphasis">{{ l.ip ?? "—" }}</td>
            <td class="text-right">
              <v-btn
                v-if="l.metadata"
                size="small"
                variant="text"
                icon="mdi-information-outline"
                @click="detalle = l"
              />
            </td>
          </tr>
          <tr v-if="!registros.length">
            <td colspan="6" class="text-center text-medium-emphasis py-6">
              No hay acciones registradas con esos filtros.
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

    <v-dialog :model-value="!!detalle" max-width="560" @update:model-value="detalle = null">
      <v-card v-if="detalle" border flat rounded="lg" class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-1">
          {{ ETIQUETA[detalle.action] ?? detalle.action }}
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
          {{ fmtDateTime(detalle.createdAt) }} · {{ detalle.actorEmail ?? "sistema" }}
        </div>

        <div class="text-caption text-medium-emphasis mb-1">Detalle</div>
        <pre
          class="text-caption pa-3 rounded-lg"
          style="background: rgba(127, 127, 127, 0.1); overflow-x: auto"
          >{{ JSON.stringify(detalle.metadata, null, 2) }}</pre
        >

        <div v-if="detalle.userAgent" class="mt-3">
          <div class="text-caption text-medium-emphasis">Navegador</div>
          <div class="text-caption">{{ detalle.userAgent }}</div>
        </div>

        <div class="d-flex justify-end mt-4">
          <v-btn variant="text" @click="detalle = null">Cerrar</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
