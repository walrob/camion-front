<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "~/components/shared/PageHeader.vue";
import {
  useComprobantes,
  COMPROBANTE_ACCEPT,
} from "~/composables/useComprobantes";
import { taxConditionLabel } from "~/types/plan";

/**
 * Ficha de una empresa: lo que se ve y lo que se puede hacer sobre ella.
 *
 * Las acciones piden motivo: ese texto va al registro de auditoría y es lo que,
 * meses después, explica por qué se hizo algo.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { get, post, patch } = useApi();
const { money, num } = useFormatters();

const id = String(route.params.id);
const ficha = ref<any>(null);
const planes = ref<any[]>([]);
const cargando = ref(true);
const trabajando = ref(false);
const aviso = ref<{ texto: string; color: string } | null>(null);

const dialogoPlan = ref(false);
const dialogoEstado = ref(false);
const planNuevo = ref("");
const estadoNuevo = ref("");
const motivo = ref("");

/** Identificación de la empresa bajo el título: slug y, si lo tiene, CUIT. */
const subtituloFicha = computed(() => {
  const c = ficha.value?.company;
  if (!c) return undefined;
  return c.cuit ? `${c.slug} · CUIT ${c.cuit}` : c.slug;
});

/** Las migas reemplazan al botón «volver»: dicen dónde estás, no sólo cómo salir. */
const migas = computed(() => [
  { title: 'Plataforma', to: '/superadmin' },
  { title: 'Empresas', to: '/superadmin/empresas' },
  { title: ficha.value?.company?.name ?? 'Empresa', disabled: true },
]);

useHead(() => ({ title: ficha.value?.company?.name ?? "Empresa" }));

const ESTADOS = [
  { value: "trial", title: "En prueba" },
  { value: "active", title: "Activa" },
  { value: "defaulter", title: "En mora" },
  { value: "blocked", title: "Suspendida (solo lectura)" },
  { value: "cancelled", title: "Dada de baja" },
];

const impagos = computed(() =>
  (ficha.value?.periodos ?? []).filter((p: any) => !p.isPaid),
);

// ───────── Comprobantes ─────────

/**
 * Todos los períodos, no sólo los impagos: el comprobante se carga después de
 * emitir la factura, y para entonces el período suele estar pagado.
 */
const periodos = computed(() => ficha.value?.periodos ?? []);

/**
 * Datos con los que hay que emitir. Los declara la empresa en su pantalla de
 * plan; acá son de sólo lectura porque cambiárselos desde el panel sería
 * facturarle a un CUIT que el cliente no eligió.
 */
const facturacion = computed(() => {
  const c = ficha.value?.company;
  if (!c) return null;
  return {
    razonSocial: c.invoiceName || c.name,
    usaRazonSocialPropia: !!c.invoiceName,
    cuit: c.invoiceCuit || c.cuit || "",
    iva: taxConditionLabel(c.invoiceTaxCondition),
    domicilio: c.invoiceAddress || c.address || "",
    email: c.invoiceEmail || "",
    diaDeFacturacion: c.billingDay ?? 1,
  };
});

/** Qué le falta al cliente para que se le pueda emitir bien. */
const faltaParaFacturar = computed(() => {
  const c = ficha.value?.company;
  if (!c) return [];
  const f: string[] = [];
  if (!c.invoiceName) f.push("razón social");
  if (!c.invoiceCuit && !c.cuit) f.push("CUIT");
  if (!c.invoiceTaxCondition) f.push("condición frente al IVA");
  if (!c.invoiceEmail) f.push("email");
  return f;
});

const comprobantes = useComprobantes();
const dialogoComprobante = ref(false);
const periodoElegido = ref<any>(null);
const archivo = ref<File | null>(null);
const numeroDeFactura = ref("");
const subiendo = ref(false);
const abriendo = ref<string | null>(null);

function abrirCarga(periodo: any) {
  periodoElegido.value = periodo;
  archivo.value = null;
  numeroDeFactura.value = periodo.invoiceNumber ?? "";
  dialogoComprobante.value = true;
}

// El archivo se toma del evento del DOM, como en el resto de los diálogos:
// `v-file-input` entrega `File` o `File[]` según la versión.
function onArchivo(e: Event) {
  archivo.value = (e.target as HTMLInputElement).files?.[0] ?? null;
}

async function subirComprobante() {
  if (!archivo.value || !periodoElegido.value) return;
  subiendo.value = true;
  const ok = await comprobantes.subir(
    id,
    periodoElegido.value.id,
    archivo.value,
    numeroDeFactura.value.trim() || undefined,
  );
  subiendo.value = false;
  if (ok) {
    dialogoComprobante.value = false;
    await cargar();
  }
}

async function verComprobante(periodo: any) {
  abriendo.value = periodo.id;
  await comprobantes.abrirDeEmpresa(id, periodo.id);
  abriendo.value = null;
}

async function quitarComprobante(periodo: any) {
  if (await comprobantes.quitar(id, periodo.id)) await cargar();
}

/** "marzo 2026" a partir del `periodStart`, que llega como `aaaa-mm-dd`. */
function nombreDePeriodo(valor: string): string {
  const d = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(valor).slice(0, 10);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

const cargar = async () => {
  cargando.value = true;
  try {
    const [f, p] = await Promise.all([
      get(`superadmin/companies/${id}`),
      get("plans/public"),
    ]);
    ficha.value = f;
    planes.value = p as any[];
  } finally {
    cargando.value = false;
  }
};

const ejecutar = async (fn: () => Promise<unknown>, exito: string) => {
  trabajando.value = true;
  aviso.value = null;
  try {
    await fn();
    aviso.value = { texto: exito, color: "success" };
    await cargar();
    return true;
  } catch (e: any) {
    aviso.value = {
      texto: e?.response?.data?.message ?? "No se pudo completar la acción.",
      color: "error",
    };
    return false;
  } finally {
    trabajando.value = false;
    motivo.value = "";
  }
};

const abrirPlan = () => {
  planNuevo.value = "";
  motivo.value = "";
  dialogoPlan.value = true;
};

const abrirEstado = () => {
  estadoNuevo.value = ficha.value?.company?.status ?? "";
  motivo.value = "";
  dialogoEstado.value = true;
};

const cambiarPlan = async () => {
  const ok = await ejecutar(
    () =>
      patch(`superadmin/companies/${id}/plan`, {
        planCode: planNuevo.value,
        motivo: motivo.value,
      }),
    "Plan actualizado.",
  );
  if (ok) dialogoPlan.value = false;
};

const cambiarEstado = async () => {
  const ok = await ejecutar(
    () =>
      patch(`superadmin/companies/${id}/status`, {
        status: estadoNuevo.value,
        motivo: motivo.value,
      }),
    "Estado actualizado.",
  );
  if (ok) dialogoEstado.value = false;
};

const emitir = () =>
  ejecutar(
    () => post(`superadmin/companies/${id}/billing/issue`, {}),
    "Período emitido.",
  );

/**
 * Entra al backoffice del cliente con el token de soporte (solo lectura, 30
 * minutos). La sesión del superadmin queda guardada: el «Salir» del banner
 * vuelve a esta ficha sin pedir la contraseña de nuevo.
 */
const impersonar = async () => {
  trabajando.value = true;
  try {
    const r: any = await post(`superadmin/companies/${id}/impersonate`, {
      motivo: "Soporte",
    });
    await auth.entrarComoSoporte(r.token, r.expiresAt, r.user, route.fullPath);
    await router.push("/admin");
  } finally {
    trabajando.value = false;
  }
};

/**
 * Configuración efectiva de la empresa (docs/CONFIGURACION.md §13).
 *
 * Ante un «esto no anda», lo primero que hace falta saber es cómo está
 * configurada esa empresa. Es de **sólo lectura**: quien cambia la
 * configuración de una empresa es su propio admin, desde su pantalla de
 * Configuración. Acá se mira para poder responder, no para tocar.
 */
const config = ref<{ groups: any[]; settings: any[] } | null>(null);
const configError = ref("");

const cargarConfig = async () => {
  try {
    config.value = await get(`superadmin/companies/${id}/settings`);
    configError.value = "";
  } catch (e: any) {
    // Que no se pueda leer la configuración no puede dejar sin ficha a quien
    // está atendiendo un reclamo de facturación: se avisa y se sigue.
    config.value = null;
    configError.value = e?.message ?? "No se pudo leer la configuración.";
  }
};

const ajustesDe = (grupo: string) =>
  (config.value?.settings ?? []).filter((s: any) => s.group === grupo);

/** Lo que la empresa cambió respecto del default: es lo que explica un comportamiento raro. */
const modificados = computed(
  () => (config.value?.settings ?? []).filter((s: any) => !s.isDefault).length,
);

/** El valor como lo lee una persona, no como viaja. */
const comoTexto = (def: any): string => {
  if (def.type === "boolean") return def.value === "true" ? "Sí" : "No";
  if (def.type === "enum")
    return def.options?.find((o: any) => o.value === def.value)?.label ?? def.value;
  return def.value === "" || def.value == null ? "—" : String(def.value);
};

onMounted(() => {
  cargar();
  cargarConfig();
});
</script>

<template>
  <div>

    <div v-if="cargando" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="ficha">
      <PageHeader
        :title="ficha.company.name"
        :subtitle="subtituloFicha"
        :breadcrumbs="migas"
      >
        <template #actions>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-account-group-outline"
            :to="`/superadmin/usuarios?empresa=${ficha.company.id}`"
          >
            Usuarios
          </v-btn>
          <v-chip variant="tonal" size="small">{{ ficha.company.status }}</v-chip>
        </template>
      </PageHeader>

      <v-alert
        v-if="aviso"
        :type="aviso.color as any"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-4"
        closable
        @click:close="aviso = null"
      >
        {{ aviso.texto }}
      </v-alert>

      <v-row dense>
        <!-- Facturación -->
        <v-col cols="12" md="7">
          <v-card border flat rounded="lg" class="pa-5 mb-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-1 font-weight-medium">Facturación</div>
              <v-btn
                size="small"
                variant="tonal"
                :loading="trabajando"
                @click="emitir"
              >
                Emitir período
              </v-btn>
            </div>

            <template v-if="ficha.cotizacion">
              <div
                v-for="l in ficha.cotizacion.desglose.lineas"
                :key="l.concepto"
                class="d-flex justify-space-between py-1"
              >
                <span class="text-body-2 text-medium-emphasis">
                  {{ l.concepto }}
                </span>
                <span class="text-body-2">{{ money(l.importe) }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <strong>Total mensual</strong>
                <strong>{{ money(ficha.cotizacion.desglose.amount) }}</strong>
              </div>
            </template>
          </v-card>

          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-subtitle-1 font-weight-medium">
              Períodos impagos
            </div>
            <p class="text-caption text-medium-emphasis mb-3">
              Un período se salda solo cuando llega el pago por Mercado Pago.
              No se marca a mano: hacerlo dejaba un cobro que no figuraba en
              Pagos y una plata que nunca entró.
            </p>
            <div v-if="!impagos.length" class="text-body-2 text-medium-emphasis">
              Sin deuda.
            </div>
            <div
              v-for="p in impagos"
              :key="p.id"
              class="d-flex justify-space-between align-center py-2 border-b"
            >
              <div>
                <div class="text-body-2">
                  {{ String(p.periodStart).slice(0, 10) }}
                  <v-chip v-if="p.isProrated" size="x-small" class="ml-1">
                    prorrateo
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Vence {{ String(p.expiration).slice(0, 10) }}
                </div>
              </div>
              <strong class="text-body-2">{{ money(p.amount) }}</strong>
            </div>
          </v-card>

          <!-- Datos con los que se emite la factura -->
          <v-card v-if="facturacion" border flat rounded="lg" class="pa-5 mt-4">
            <div class="text-subtitle-1 font-weight-medium">
              Datos de facturación
            </div>
            <p class="text-caption text-medium-emphasis mb-3">
              Los declara el cliente en su pantalla de plan. Acá son de sólo
              lectura: cambiárselos desde el panel sería emitirle a un CUIT que
              no eligió.
            </p>

            <v-alert
              v-if="faltaParaFacturar.length"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Falta {{ faltaParaFacturar.join(", ") }}. Conviene pedirlo antes de
              emitir.
            </v-alert>

            <div class="d-flex justify-space-between ga-4 py-1">
              <span class="text-body-2 text-medium-emphasis">Razón social</span>
              <strong class="text-body-2 text-right">
                {{ facturacion.razonSocial }}
                <v-chip
                  v-if="!facturacion.usaRazonSocialPropia"
                  size="x-small"
                  variant="tonal"
                  class="ml-1"
                >
                  nombre de la cuenta
                </v-chip>
              </strong>
            </div>
            <div class="d-flex justify-space-between ga-4 py-1">
              <span class="text-body-2 text-medium-emphasis">CUIT</span>
              <strong class="text-body-2 text-right">
                {{ facturacion.cuit || "—" }}
              </strong>
            </div>
            <div class="d-flex justify-space-between ga-4 py-1">
              <span class="text-body-2 text-medium-emphasis">
                Condición frente al IVA
              </span>
              <strong class="text-body-2 text-right">{{ facturacion.iva }}</strong>
            </div>
            <div class="d-flex justify-space-between ga-4 py-1">
              <span class="text-body-2 text-medium-emphasis">
                Domicilio fiscal
              </span>
              <strong class="text-body-2 text-right">
                {{ facturacion.domicilio || "—" }}
              </strong>
            </div>
            <div class="d-flex justify-space-between ga-4 py-1">
              <span class="text-body-2 text-medium-emphasis">Email</span>
              <strong class="text-body-2 text-right">
                {{ facturacion.email || "—" }}
              </strong>
            </div>
            <div class="d-flex justify-space-between ga-4 py-1">
              <span class="text-body-2 text-medium-emphasis">Se factura el</span>
              <strong class="text-body-2 text-right">
                {{ facturacion.diaDeFacturacion }} de cada mes
              </strong>
            </div>
          </v-card>

          <!-- Comprobantes por período -->
          <v-card border flat rounded="lg" class="pa-5 mt-4">
            <div class="text-subtitle-1 font-weight-medium">Comprobantes</div>
            <p class="text-caption text-medium-emphasis mb-3">
              El sistema no emite la factura: se emite por fuera y se sube acá.
              El cliente la ve en su pantalla de plan y se la baja solo.
            </p>

            <div
              v-if="!periodos.length"
              class="text-body-2 text-medium-emphasis"
            >
              Todavía no hay períodos emitidos.
            </div>
            <div
              v-for="p in periodos"
              :key="p.id"
              class="d-flex justify-space-between align-center ga-2 py-2 border-b"
            >
              <div>
                <div class="text-body-2 text-capitalize">
                  {{ nombreDePeriodo(p.periodStart) }}
                  <v-chip v-if="p.isProrated" size="x-small" class="ml-1">
                    prorrateo
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ money(p.amount) }} ·
                  <template v-if="p.invoiceKey">
                    {{ p.invoiceNumber ? `Factura ${p.invoiceNumber}` : "cargado" }}
                  </template>
                  <span v-else class="text-warning">sin comprobante</span>
                </div>
              </div>
              <div class="d-flex align-center ga-1">
                <IconBtn
                  v-if="p.invoiceKey"
                  icon="mdi-file-pdf-box"
                  size="small"
                  variant="text"
                  color="primary"
                  :loading="abriendo === p.id"
                  title="Ver comprobante"
                  @click="verComprobante(p)"
                />
                <IconBtn
                  v-if="p.invoiceKey"
                  icon="mdi-close"
                  size="small"
                  variant="text"
                  color="error"
                  title="Dar de baja el comprobante"
                  @click="quitarComprobante(p)"
                />
                <v-btn
                  size="small"
                  variant="tonal"
                  :color="p.invoiceKey ? 'secondary' : 'primary'"
                  :prepend-icon="p.invoiceKey ? 'mdi-autorenew' : 'mdi-upload'"
                  @click="abrirCarga(p)"
                >
                  {{ p.invoiceKey ? "Reemplazar" : "Subir" }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Acciones -->
        <v-col cols="12" md="5">
          <v-card border flat rounded="lg" class="pa-5 mb-4">
            <div class="text-subtitle-1 font-weight-medium mb-3">Acciones</div>

            <v-btn block variant="tonal" class="mb-2" @click="abrirPlan">
              Cambiar plan
            </v-btn>
            <v-btn block variant="tonal" class="mb-2" @click="abrirEstado">
              Cambiar estado
            </v-btn>

            <v-divider class="my-3" />

            <div class="text-caption text-medium-emphasis mb-2">
              Soporte: entrás al sistema del cliente como su administrador, en
              <strong>solo lectura</strong> y por 30 minutos. Queda registrado
              en la auditoría. Para volver acá, usá «Salir» en la barra
              amarilla.
            </div>
            <v-btn
              block
              variant="outlined"
              color="warning"
              prepend-icon="mdi-eye-outline"
              :loading="trabajando"
              @click="impersonar"
            >
              Ver como el cliente
            </v-btn>
          </v-card>

          <v-card border flat rounded="lg" class="pa-5">
            <div class="text-subtitle-1 font-weight-medium mb-3">Uso</div>
            <div class="d-flex justify-space-between py-1">
              <span class="text-body-2 text-medium-emphasis">
                Camiones activos
              </span>
              <strong>
                {{ num(ficha.cotizacion?.unidades?.activeTrucks ?? 0) }}
              </strong>
            </div>
            <div class="d-flex justify-space-between py-1">
              <span class="text-body-2 text-medium-emphasis">Acoplados</span>
              <strong>
                {{ num(ficha.cotizacion?.unidades?.activeTrailers ?? 0) }}
              </strong>
            </div>
            <div class="d-flex justify-space-between py-1">
              <span class="text-body-2 text-medium-emphasis">Add-ons</span>
              <strong>{{ ficha.addonsContratados.length }}</strong>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Configuración efectiva (§13). Sólo lectura: el que la cambia es el
           admin de la empresa, desde su propia pantalla de Configuración. -->
      <v-card border flat rounded="lg" class="pa-5 mt-4">
        <div class="d-flex align-center flex-wrap ga-2 mb-1">
          <div class="text-subtitle-1 font-weight-medium">
            Configuración de la empresa
          </div>
          <v-chip
            v-if="modificados"
            size="x-small"
            color="warning"
            variant="tonal"
          >
            {{ modificados }} fuera del default
          </v-chip>
          <v-spacer />
          <v-btn size="x-small" variant="text" @click="cargarConfig">
            <v-icon start size="16">mdi-refresh</v-icon> Actualizar
          </v-btn>
        </div>
        <p class="text-caption text-medium-emphasis mb-4">
          Lo que esta empresa tiene configurado hoy. Es de sólo lectura: para
          cambiarlo, lo hace su administrador desde Configuración.
        </p>

        <v-alert
          v-if="configError"
          type="warning"
          variant="tonal"
          density="compact"
          rounded="lg"
        >
          {{ configError }}
        </v-alert>

        <div v-else-if="!config" class="text-body-2 text-medium-emphasis">
          Cargando configuración…
        </div>

        <template v-else>
          <div
            v-for="grupo in config.groups"
            :key="grupo.key"
            class="mb-4"
          >
            <div class="text-body-2 font-weight-medium mb-1">
              {{ grupo.label }}
            </div>
            <div
              v-for="def in ajustesDe(grupo.key)"
              :key="def.key"
              class="d-flex align-start justify-space-between ga-4 py-2 border-b"
            >
              <div class="flex-grow-1">
                <div class="text-body-2">{{ def.label }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ def.key }}
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-body-2 font-weight-medium">
                  {{ comoTexto(def) }}
                </div>
                <v-chip
                  v-if="!def.isDefault"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                >
                  modificado
                </v-chip>
                <span v-else class="text-caption text-medium-emphasis">
                  default
                </span>
              </div>
            </div>
          </div>
        </template>
      </v-card>
    </template>

    <!-- Carga del comprobante de un período -->
    <v-dialog v-model="dialogoComprobante" max-width="520">
      <v-card rounded="lg" class="pa-5">
        <div class="text-h6 font-weight-bold mb-1">
          {{ periodoElegido?.invoiceKey ? "Reemplazar" : "Subir" }} comprobante
        </div>
        <div
          v-if="periodoElegido"
          class="text-body-2 text-medium-emphasis mb-4 text-capitalize"
        >
          {{ nombreDePeriodo(periodoElegido.periodStart) }} ·
          {{ money(periodoElegido.amount) }}
        </div>

        <v-alert
          v-if="faltaParaFacturar.length"
          type="warning"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mb-4"
        >
          Al cliente le falta cargar {{ faltaParaFacturar.join(", ") }}.
          Verificá contra qué datos estás emitiendo.
        </v-alert>

        <v-file-input
          :accept="COMPROBANTE_ACCEPT"
          label="Factura en PDF"
          prepend-icon=""
          prepend-inner-icon="mdi-file-pdf-box"
          variant="outlined"
          density="compact"
          show-size
          hide-details="auto"
          class="mb-3"
          @change="onArchivo"
        />

        <v-text-field
          v-model="numeroDeFactura"
          label="Número de comprobante"
          placeholder="0001-00001234"
          variant="outlined"
          density="compact"
          hide-details="auto"
        />
        <p class="text-caption text-medium-emphasis mt-1">
          Opcional, pero es por dónde el cliente reclama una factura.
        </p>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="dialogoComprobante = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :loading="subiendo"
            :disabled="!archivo"
            @click="subirComprobante"
          >
            {{ periodoElegido?.invoiceKey ? "Reemplazar" : "Subir" }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Cambio de plan -->
    <v-dialog v-model="dialogoPlan" max-width="440">
      <v-card rounded="lg" class="pa-5">
        <div class="text-h6 font-weight-bold mb-3">Cambiar plan</div>
        <v-select
          v-model="planNuevo"
          :items="planes"
          item-title="name"
          item-value="code"
          label="Plan nuevo"
          variant="outlined"
          density="comfortable"
        />
        <v-text-field
          v-model="motivo"
          label="Motivo (queda auditado)"
          variant="outlined"
          density="comfortable"
        />
        <p class="text-caption text-medium-emphasis">
          Un upgrade se aplica al instante con prorrateo; un downgrade queda
          agendado para la próxima renovación.
        </p>
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" @click="dialogoPlan = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!planNuevo"
            :loading="trabajando"
            @click="cambiarPlan"
          >
            Aplicar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Cambio de estado -->
    <v-dialog v-model="dialogoEstado" max-width="440">
      <v-card rounded="lg" class="pa-5">
        <div class="text-h6 font-weight-bold mb-3">Cambiar estado</div>
        <v-select
          v-model="estadoNuevo"
          :items="ESTADOS"
          label="Estado"
          variant="outlined"
          density="comfortable"
        />
        <v-text-field
          v-model="motivo"
          label="Motivo (queda auditado)"
          variant="outlined"
          density="comfortable"
        />
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" @click="dialogoEstado = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="trabajando" @click="cambiarEstado">
            Aplicar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
