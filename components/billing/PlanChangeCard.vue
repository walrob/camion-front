<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useApi } from "~/composables/useApi";
import { CONTACTO } from "~/composables/useContacto";
import { PLAN_DESTACADOS } from "~/types/plan";

/**
 * Cambio de plan autogestionado, con soporte como alternativa.
 *
 * Los dos caminos conviven a propósito: el admin que ya sabe lo que quiere
 * sube o baja acá mismo; el que prefiere que alguien se lo confirme le escribe
 * a soporte con el pedido ya armado. El backend aplica la regla asimétrica:
 * subir es inmediato y se prorratea; bajar queda agendado para la renovación.
 */
interface OpcionDePlan {
  code: string;
  name: string;
  description: string;
  isNegotiated: boolean;
  precioMensual: number;
  esActual: boolean;
  esAgendado: boolean;
  tipo: "upgrade" | "downgrade";
}

interface Opciones {
  actual: { code: string; name: string } | null;
  agendado: { code: string; name: string; efectivoEl: string } | null;
  planes: OpcionDePlan[];
}

const emit = defineEmits<{ (e: "changed"): void }>();

const { get, post, delete: del } = useApi();
const { money, fmtDate } = useFormatters();
const auth = useAuthStore();
const general = useGeneralStore();

const opciones = ref<Opciones | null>(null);
const cargando = ref(true);
const confirmando = ref<OpcionDePlan | null>(null);
const aplicando = ref(false);
const cancelando = ref(false);

const puedeCambiar = computed(() => auth.isAdmin);
const actual = computed(() => opciones.value?.actual);
const agendado = computed(() => opciones.value?.agendado);

async function cargar() {
  try {
    opciones.value = await get<Opciones>("billing/plan-options");
  } catch {
    // Sin opciones la tarjeta muestra sólo el camino por soporte.
    opciones.value = null;
  } finally {
    cargando.value = false;
  }
}

/** Texto del botón según la relación con el plan actual. */
function accion(p: OpcionDePlan) {
  if (p.esActual) return "Tu plan actual";
  if (p.isNegotiated) return "Consultar";
  return p.tipo === "upgrade" ? `Subir a ${p.name}` : `Bajar a ${p.name}`;
}

async function confirmar() {
  if (!confirmando.value) return;
  aplicando.value = true;
  const plan = confirmando.value;
  try {
    const r: any = await post("billing/plan", { planCode: plan.code });
    if (r?.aplicado) {
      general.setSnackbar({
        color: "success",
        message: `Listo: ya estás en el plan ${plan.name}. Se emitió el cargo por la diferencia de los días que quedan del período.`,
        timeout: 8000,
      });
      // Las features nuevas se ven al instante, sin volver a entrar.
      await auth.fetchSession(true);
    } else {
      general.setSnackbar({
        color: "info",
        message: `Agendado: pasás a ${plan.name} el ${fmtDate(r?.efectivoEl)}. Hasta entonces seguís con ${actual.value?.name}.`,
        timeout: 8000,
      });
    }
    confirmando.value = null;
    await cargar();
    emit("changed");
  } catch (e) {
    general.setErrorSnackbar(e);
  } finally {
    aplicando.value = false;
  }
}

async function cancelarAgendado() {
  cancelando.value = true;
  try {
    await del("billing/plan/scheduled");
    general.setSuccessSnackbar("Se canceló el cambio de plan agendado.");
    await cargar();
    emit("changed");
  } catch (e) {
    general.setErrorSnackbar(e);
  } finally {
    cancelando.value = false;
  }
}

// ── Camino por soporte: el pedido ya va armado, para no explicar de cero. ──
const mensajeSoporte = (p?: OpcionDePlan | null) => {
  const empresa = auth.company?.name ?? "mi empresa";
  const desde = actual.value?.name ? ` (hoy en ${actual.value.name})` : "";
  return p
    ? `Hola, soy de ${empresa}${desde}. Quiero cambiar al plan ${p.name}.`
    : `Hola, soy de ${empresa}${desde}. Quiero consultar por un cambio de plan.`;
};
const whatsappUrl = (p?: OpcionDePlan | null) =>
  `https://api.whatsapp.com/send/?phone=${CONTACTO.whatsapp}&text=${encodeURIComponent(mensajeSoporte(p))}&type=phone_number&app_absent=0`;
const mailUrl = (p?: OpcionDePlan | null) =>
  `mailto:${CONTACTO.email}?subject=${encodeURIComponent("Cambio de plan")}&body=${encodeURIComponent(mensajeSoporte(p))}`;

onMounted(cargar);
</script>

<template>
  <v-card id="planes" border flat rounded="lg" class="pa-6">
    <div class="text-subtitle-1 font-weight-medium mb-1">Cambiar de plan</div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Podés hacerlo vos ahora mismo o pedirle a soporte que lo haga. Subir de
      plan se aplica al instante y sólo pagás la diferencia de los días que
      quedan del período; bajar queda agendado para la próxima renovación.
    </p>

    <div v-if="cargando" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="primary" size="28" />
    </div>

    <template v-else>
      <v-alert
        v-if="agendado"
        type="info"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-4"
      >
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="flex-grow-1">
            Tu plan pasa a <strong>{{ agendado.name }}</strong> el
            <strong>{{ fmtDate(agendado.efectivoEl) }}</strong>. Hasta entonces
            seguís con todo lo de {{ actual?.name }}.
          </span>
          <v-btn
            v-if="puedeCambiar"
            size="small"
            variant="text"
            :loading="cancelando"
            @click="cancelarAgendado"
          >
            Cancelar el cambio
          </v-btn>
        </div>
      </v-alert>

      <v-row v-if="opciones?.planes.length" dense>
        <v-col
          v-for="p in opciones.planes"
          :key="p.code"
          cols="12"
          sm="6"
          lg="3"
        >
          <v-card
            border
            flat
            rounded="lg"
            class="pa-4 h-100 d-flex flex-column"
            :class="{ 'plan--actual': p.esActual }"
          >
            <div class="d-flex align-center justify-space-between ga-2 mb-1">
              <div class="text-subtitle-1 font-weight-bold">{{ p.name }}</div>
              <v-chip v-if="p.esActual" size="x-small" color="primary" variant="flat">
                Tu plan
              </v-chip>
              <v-chip v-else-if="p.esAgendado" size="x-small" color="info" variant="tonal">
                Agendado
              </v-chip>
            </div>

            <div class="mb-3">
              <template v-if="p.isNegotiated">
                <span class="text-h6 font-weight-bold">A medida</span>
              </template>
              <template v-else>
                <span class="text-h6 font-weight-bold">
                  {{ money(p.precioMensual) }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  /mes con tu flota actual
                </span>
              </template>
            </div>

            <div class="flex-grow-1 mb-4">
              <div
                v-for="b in PLAN_DESTACADOS[p.code] ?? []"
                :key="b"
                class="d-flex align-start ga-2 mb-1"
              >
                <v-icon color="success" size="15" class="mt-1">mdi-check</v-icon>
                <span class="text-body-2">{{ b }}</span>
              </div>
            </div>

            <v-btn
              v-if="p.isNegotiated"
              block
              variant="outlined"
              :href="whatsappUrl(p)"
              target="_blank"
              rel="noopener"
            >
              Consultar
            </v-btn>
            <v-btn
              v-else
              block
              :color="p.tipo === 'upgrade' && !p.esActual ? 'primary' : undefined"
              :variant="p.tipo === 'upgrade' && !p.esActual ? 'flat' : 'outlined'"
              :disabled="p.esActual || p.esAgendado || !puedeCambiar"
              @click="confirmando = p"
            >
              {{ p.esAgendado ? "Agendado" : accion(p) }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <p v-if="!puedeCambiar && opciones" class="text-caption text-medium-emphasis mt-3 mb-0">
        El cambio de plan lo hace el administrador de la cuenta.
      </p>

      <!-- Camino por soporte, siempre visible: es la alternativa, no el fallback. -->
      <v-divider class="my-4" />
      <div class="d-flex align-center flex-wrap ga-2">
        <span class="text-body-2 text-medium-emphasis flex-grow-1">
          ¿Preferís que lo haga soporte? Escribinos y lo cambiamos por vos.
        </span>
        <v-btn
          size="small"
          variant="tonal"
          color="success"
          prepend-icon="mdi-whatsapp"
          :href="whatsappUrl()"
          target="_blank"
          rel="noopener"
        >
          WhatsApp
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-email-outline"
          :href="mailUrl()"
        >
          Mail
        </v-btn>
      </div>
    </template>

    <!-- Confirmación: qué pasa y cuándo, antes de tocar la facturación. -->
    <v-dialog :model-value="!!confirmando" max-width="480" @update:model-value="confirmando = null">
      <v-card v-if="confirmando" rounded="lg" class="pa-6">
        <div class="text-h6 font-weight-bold mb-2">
          {{ confirmando.tipo === "upgrade" ? "Subir" : "Bajar" }} a
          {{ confirmando.name }}
        </div>

        <template v-if="confirmando.tipo === 'upgrade'">
          <p class="text-body-2 mb-2">
            El cambio se aplica <strong>ahora mismo</strong>: las funciones del
            plan {{ confirmando.name }} quedan disponibles al confirmar.
          </p>
          <p class="text-body-2 mb-2">
            Se emite un cargo por la diferencia de los días que quedan del
            período. Desde el próximo, con tu flota actual pagás
            <strong>{{ money(confirmando.precioMensual) }}/mes</strong>.
          </p>
        </template>
        <template v-else>
          <p class="text-body-2 mb-2">
            El cambio queda <strong>agendado para la próxima renovación</strong>.
            Hasta entonces seguís con todo lo de {{ actual?.name }} y podés
            cancelarlo desde acá.
          </p>
          <p class="text-body-2 mb-2">
            Desde ese momento pagás
            <strong>{{ money(confirmando.precioMensual) }}/mes</strong> con tu
            flota actual. Lo que exceda los topes del plan nuevo se desactiva;
            nada se borra, y si volvés a subir se reactiva.
          </p>
        </template>

        <p class="text-caption text-medium-emphasis mb-4">
          ¿Dudas? Podés pedirle a soporte que lo haga:
          <a :href="whatsappUrl(confirmando)" target="_blank" rel="noopener">WhatsApp</a>
          ·
          <a :href="mailUrl(confirmando)">mail</a>.
        </p>

        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" :disabled="aplicando" @click="confirmando = null">
            Cancelar
          </v-btn>
          <v-btn color="primary" :loading="aplicando" @click="confirmar">
            {{ confirmando.tipo === "upgrade" ? "Subir ahora" : "Agendar la baja" }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.plan--actual {
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
