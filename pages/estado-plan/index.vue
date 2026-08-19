<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";

/**
 * Estado comercial de la empresa: qué plan tiene, qué consume y qué debe.
 *
 * Es la pantalla que queda accesible incluso con la cuenta suspendida (lista
 * blanca del `AccountStatusGuard`): dejar a alguien bloqueado sin manera de ver
 * qué debe ni cómo pagar es la forma más segura de perderlo en vez de cobrarle.
 */
definePageMeta({ layout: "admin" });
useHead({ title: "Mi plan" });

const { get, post, delete: del } = useApi();
const { money } = useFormatters();
const auth = useAuthStore();
const general = useGeneralStore();
const route = useRoute();

const cotizacion = ref<any>(null);
const periodos = ref<any[]>([]);
const mp = ref<any>(null);
const cargando = ref(true);
const pagando = ref<string | null>(null);
const activandoDebito = ref(false);

const company = computed(() => auth.company);
const storage = computed(() => auth.storage);

const diasDeTrial = computed(() => {
  if (company.value?.status !== "trial" || !company.value?.trialEndsAt)
    return null;
  const fin = new Date(company.value.trialEndsAt).getTime();
  return Math.max(0, Math.ceil((fin - Date.now()) / 86_400_000));
});

const ESTADOS: Record<string, { texto: string; color: string }> = {
  trial: { texto: "Prueba gratuita", color: "info" },
  active: { texto: "Al día", color: "success" },
  defaulter: { texto: "Con pago pendiente", color: "warning" },
  blocked: { texto: "Suspendida por falta de pago", color: "error" },
  cancelled: { texto: "Dada de baja", color: "error" },
};

const impagos = computed(() => periodos.value.filter((p) => !p.isPaid));

/**
 * Vuelta desde Mercado Pago.
 *
 * MP redirige con `?pago=exitoso` **antes** de mandarnos el aviso, así que en
 * ese momento el período todavía figura impago. Se avisa que la acreditación
 * puede demorar en vez de mostrar un total que se contradice con el mensaje.
 */
const RETORNOS: Record<string, { color: string; mensaje: string }> = {
  exitoso: {
    color: "success",
    mensaje:
      "Recibimos tu pago. La acreditación puede demorar unos minutos: cuando " +
      "Mercado Pago nos confirme, el período figura pagado.",
  },
  pendiente: {
    color: "info",
    mensaje: "El pago quedó pendiente de acreditación en Mercado Pago.",
  },
  fallido: {
    color: "error",
    mensaje: "El pago no se completó. Podés volver a intentarlo.",
  },
};

async function cargar() {
  const [q, subs, estadoMp] = await Promise.all([
    get("billing/quote").catch(() => null),
    get("billing/subscriptions").catch(() => []),
    get("billing/mp/status").catch(() => null),
  ]);
  cotizacion.value = q;
  periodos.value = (subs as any[]) ?? [];
  mp.value = estadoMp;
}

/** Abre el checkout de MP para un período. */
async function pagar(periodo: any) {
  pagando.value = periodo.id;
  try {
    const r: any = await post(`billing/mp/checkout/${periodo.id}`);
    if (!r?.url) throw new Error("Mercado Pago no devolvió el link de pago.");
    // Redirección en la misma pestaña: una ventana nueva se la come el
    // bloqueador de pop-ups justo en el momento de cobrar.
    window.location.href = r.url;
  } catch (e) {
    general.setErrorSnackbar(e);
    pagando.value = null;
  }
}

async function activarDebito() {
  activandoDebito.value = true;
  try {
    const r: any = await post("billing/mp/subscription", {});
    if (r?.url) window.location.href = r.url;
  } catch (e) {
    general.setErrorSnackbar(e);
  } finally {
    activandoDebito.value = false;
  }
}

async function cancelarDebito() {
  try {
    await del("billing/mp/subscription");
    general.setSuccessSnackbar("Se canceló el débito automático.");
    mp.value = await get("billing/mp/status").catch(() => null);
  } catch (e) {
    general.setErrorSnackbar(e);
  }
}

onMounted(async () => {
  const retorno = RETORNOS[String(route.query.pago ?? "")];
  if (retorno) {
    general.setSnackbar({
      color: retorno.color,
      message: retorno.mensaje,
      timeout: 8000,
    });
  }

  try {
    await cargar();
  } finally {
    cargando.value = false;
  }
});
</script>

<template>
  <div>
    <PageHeader
      title="Mi plan"
      subtitle="Qué tenés contratado, qué consumís y qué está pendiente de pago"
    />

    <div v-if="cargando" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <v-row dense>
        <!-- Plan y estado -->
        <v-col cols="12" md="7">
          <v-card border flat rounded="lg" class="pa-6">
            <div
              class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4"
            >
              <div>
                <div class="text-caption text-medium-emphasis">Plan actual</div>
                <div class="text-h5 font-weight-bold">
                  {{ auth.plan?.name ?? "Sin plan" }}
                </div>
              </div>
              <v-chip
                v-if="company"
                :color="ESTADOS[company.status]?.color"
                variant="tonal"
                size="small"
              >
                {{ ESTADOS[company.status]?.texto ?? company.status }}
              </v-chip>
            </div>

            <v-alert
              v-if="diasDeTrial !== null"
              :type="diasDeTrial <= 5 ? 'warning' : 'info'"
              variant="tonal"
              density="compact"
              rounded="lg"
              class="mb-4"
            >
              Te quedan <strong>{{ diasDeTrial }} días</strong> de prueba.
              Después de eso la cuenta pasa a solo lectura hasta que actives un
              plan; tus datos no se borran.
            </v-alert>

            <div v-if="cotizacion" class="mt-2">
              <div class="text-subtitle-2 font-weight-medium mb-2">
                Lo que corresponde este mes
              </div>
              <div
                v-for="l in cotizacion.desglose.lineas"
                :key="l.concepto"
                class="d-flex justify-space-between py-2 border-b"
              >
                <div>
                  <div class="text-body-2">{{ l.concepto }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ l.detalle }}
                  </div>
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ money(l.importe) }}
                </div>
              </div>
              <div class="d-flex justify-space-between pt-3">
                <div class="text-subtitle-1 font-weight-bold">
                  Total mensual
                </div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ money(cotizacion.desglose.amount) }}
                </div>
              </div>
              <p class="text-caption text-medium-emphasis mt-2">
                Importes con IVA. Se factura el día
                {{ cotizacion.company?.billingDay ?? 1 }} de cada mes.
              </p>
            </div>
          </v-card>
        </v-col>

        <!-- Consumo -->
        <v-col cols="12" md="5">
          <v-card border flat rounded="lg" class="pa-6 mb-4">
            <div class="text-subtitle-1 font-weight-medium mb-3">Consumo</div>

            <div v-if="cotizacion" class="d-flex justify-space-between py-1">
              <span class="text-body-2 text-medium-emphasis"
                >Camiones activos</span
              >
              <strong>{{ cotizacion.unidades.activeTrucks }}</strong>
            </div>
            <div v-if="cotizacion" class="d-flex justify-space-between py-1">
              <span class="text-body-2 text-medium-emphasis">Acoplados</span>
              <strong>{{ cotizacion.unidades.activeTrailers }}</strong>
            </div>

            <template v-if="storage?.maxGb">
              <v-divider class="my-3" />
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-medium-emphasis">
                  Almacenamiento
                </span>
                <strong>
                  {{ (storage.usedBytes / 1073741824).toFixed(2) }} /
                  {{ storage.maxGb }} GB
                </strong>
              </div>
              <v-progress-linear
                :model-value="
                  (storage.usedBytes / (storage.maxGb * 1073741824)) * 100
                "
                color="primary"
                height="6"
                rounded
              />
              <p
                v-if="storage.siguienteEscalonGb"
                class="text-caption text-medium-emphasis mt-2"
              >
                Podés ampliarlo a {{ storage.siguienteEscalonGb }} GB sin
                cambiar de plan.
              </p>
            </template>
          </v-card>

          <v-card border flat rounded="lg" class="pa-6 mb-4">
            <div class="text-subtitle-1 font-weight-medium mb-2">
              Períodos pendientes
            </div>
            <div
              v-if="!impagos.length"
              class="text-body-2 text-medium-emphasis"
            >
              No tenés pagos pendientes.
            </div>
            <div
              v-for="p in impagos"
              :key="p.id"
              class="d-flex align-center justify-space-between ga-2 py-2 border-b"
            >
              <div>
                <div class="text-body-2">
                  {{ String(p.periodStart).slice(0, 10) }}
                </div>
                <div
                  v-if="p.status === 'overdue'"
                  class="text-caption text-error"
                >
                  Vencido el {{ String(p.expiration).slice(0, 10) }}
                </div>
              </div>
              <div class="d-flex align-center ga-2">
                <strong class="text-body-2">{{ money(p.amount) }}</strong>
                <v-btn
                  v-if="mp?.disponible"
                  size="small"
                  color="primary"
                  variant="tonal"
                  :loading="pagando === p.id"
                  @click="pagar(p)"
                >
                  Pagar
                </v-btn>
              </div>
            </div>
          </v-card>

          <!-- Débito automático -->
          <v-card v-if="mp?.disponible" border flat rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-medium mb-1">
              Débito automático
            </div>

            <template v-if="mp.activo">
              <div class="d-flex align-center ga-2 mb-3">
                <v-chip color="success" variant="tonal" size="small">
                  Activo
                </v-chip>
                <span class="text-caption text-medium-emphasis">
                  {{ mp.payerEmail }}
                </span>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-3">
                Mercado Pago debita el importe del mes en cada vencimiento. Si
                cambia la cantidad de unidades, el monto se ajusta solo.
              </p>
              <v-btn
                size="small"
                variant="text"
                color="error"
                @click="cancelarDebito"
              >
                Cancelar débito automático
              </v-btn>
            </template>

            <template v-else>
              <p class="text-body-2 text-medium-emphasis mb-3">
                Activalo y no tenés que acordarte de pagar todos los meses.
                Empieza a debitar en el próximo período.
              </p>
              <v-alert
                v-if="mp.deudaPendiente > 0"
                type="warning"
                variant="tonal"
                density="compact"
                rounded="lg"
                class="mb-3"
              >
                Primero hay que saldar
                {{ money(mp.deudaPendiente) }} pendientes.
              </v-alert>
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                :disabled="mp.deudaPendiente > 0"
                :loading="activandoDebito"
                @click="activarDebito"
              >
                Activar débito automático
              </v-btn>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
