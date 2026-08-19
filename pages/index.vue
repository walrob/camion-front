<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { DirectiveBinding } from "vue";

import { CONTACTO } from "~/composables/useContacto";

/**
 * Landing pública.
 *
 * Los textos salen de `docs/MODELO-COMERCIAL.md`: los tres dolores del §4.3, el
 * diferencial frente a la competencia del §8.3 y los precios del §3.2. No es
 * texto de relleno — es la propuesta comercial escrita.
 *
 * La página está armada como un argumento, no como un catálogo: portada
 * (promesa) → problema → cómo se resuelve → por qué acá y no un sistema
 * importado → cómo se empieza → cuánto sale → objeciones. Cada sección existe
 * para desactivar la duda que aparece justo después de la anterior.
 */
definePageMeta({ layout: "public" });

const { get } = useApi();
const { money } = useFormatters();

/** Días de prueba. Debe coincidir con `DIAS_DE_TRIAL` del backend. */
const DIAS_DE_PRUEBA = 30;

/**
 * Precios de respaldo, con los valores del modelo comercial.
 *
 * La landing se pre-renderiza en el build, cuando la API puede no estar
 * disponible (riesgo R7.3). Se muestra esto y se refresca en el cliente: es
 * preferible un precio de hace un deploy que una tarjeta vacía.
 *
 * `features` y `limits` replican la migración `SeedPlans`: sin ellos la
 * comparativa de planes se abriría vacía cuando la API no responde.
 */
const PLANES_FALLBACK = [
  {
    code: "control",
    name: "Control",
    description:
      "Dejá el cuaderno. Sabé qué tenés en la calle y qué se te vence.",
    baseFee: 59000,
    pricePerVehicle: 7900,
    isNegotiated: false,
    features: [
      "fleet",
      "documents",
      "alerts",
      "trips",
      "checklists",
      "messages",
      "incidents",
      "driver_app",
    ],
    limits: {
      retentionMonths: 12,
      storageGb: 2,
      alertRules: 3,
      maintenancePlans: 0,
      roles: ["admin", "manager", "dispatcher", "driver"],
    },
  },
  {
    code: "operacion",
    name: "Operación",
    description:
      "Todo el viaje bajo control, del checklist hasta la rendición.",
    baseFee: 129000,
    pricePerVehicle: 12900,
    isNegotiated: false,
    features: [
      "fleet",
      "documents",
      "alerts",
      "trips",
      "checklists",
      "messages",
      "incidents",
      "driver_app",
      "export_excel",
      "trip_log",
      "settlements",
      "fuel",
      "maintenance",
      "oea",
      "incidents_kanban",
      "hr_basic",
    ],
    limits: {
      retentionMonths: 24,
      storageGb: 50,
      alertRules: 10,
      maintenancePlans: 10,
      roles: ["admin", "manager", "dispatcher", "driver", "maintenance", "hr"],
    },
  },
  {
    code: "gestion",
    name: "Gestión",
    description:
      "Decidí con números: costo por kilómetro, por camión y por chofer.",
    baseFee: 249000,
    pricePerVehicle: 18900,
    isNegotiated: false,
    features: [
      "fleet",
      "documents",
      "alerts",
      "trips",
      "checklists",
      "messages",
      "incidents",
      "driver_app",
      "export_excel",
      "trip_log",
      "settlements",
      "fuel",
      "maintenance",
      "oea",
      "incidents_kanban",
      "hr_basic",
      "fuel_ranking",
      "indicators",
      "hr_full",
      "alert_thresholds",
      "auditor_role",
      "scheduled_reports",
    ],
    limits: {
      retentionMonths: 60,
      storageGb: 250,
      alertRules: null,
      maintenancePlans: null,
      roles: [
        "admin",
        "manager",
        "dispatcher",
        "driver",
        "maintenance",
        "hr",
        "auditor",
      ],
    },
  },
  {
    code: "corporate",
    name: "Corporate",
    description: "Varias empresas, una sola operación.",
    baseFee: 490000,
    pricePerVehicle: 10900,
    isNegotiated: true,
    features: [
      "fleet",
      "documents",
      "alerts",
      "trips",
      "checklists",
      "messages",
      "incidents",
      "driver_app",
      "export_excel",
      "trip_log",
      "settlements",
      "fuel",
      "maintenance",
      "oea",
      "incidents_kanban",
      "hr_basic",
      "fuel_ranking",
      "indicators",
      "hr_full",
      "alert_thresholds",
      "auditor_role",
      "scheduled_reports",
      "api",
      "multi_company",
      "sso",
      "sandbox",
    ],
    limits: {
      retentionMonths: null,
      storageGb: null,
      alertRules: null,
      maintenancePlans: null,
      roles: [
        "admin",
        "manager",
        "dispatcher",
        "driver",
        "maintenance",
        "hr",
        "auditor",
      ],
    },
  },
];

const planes = ref(PLANES_FALLBACK);

onMounted(async () => {
  try {
    const data = await get<typeof PLANES_FALLBACK>("plans/public");
    if (Array.isArray(data) && data.length) planes.value = data;
  } catch {
    // Se queda con los precios de respaldo: mejor eso que una sección vacía.
  }
});

// ── Comparativa de planes ───────────────────────────────────────────────────
// El detalle completo no puede vivir en las tarjetas sin arruinar la lectura de
// precios, pero tampoco puede exigir escribirle a ventas: va en un modal.
const comparativaAbierta = ref(false);
const planComparado = ref<string | null>(null);

const abrirComparativa = (code: string | null = null) => {
  planComparado.value = code;
  comparativaAbierta.value = true;
};

// ── Calculadora: el argumento de venta es que se cotiza con dos números ──────
const camiones = ref(12);
const planElegido = ref("operacion");

const planesCotizables = computed(() =>
  planes.value.filter((p) => !p.isNegotiated),
);

const planActual = computed(
  () =>
    planes.value.find((p) => p.code === planElegido.value) ?? planes.value[1],
);

// Se factura lo que hay: los planes no tienen mínimo de unidades, así que la
// cuenta es la que se ve — abono + camiones, sin letra chica.
const total = computed(
  () =>
    Number(planActual.value?.baseFee ?? 0) +
    camiones.value * Number(planActual.value?.pricePerVehicle ?? 0),
);

const porCamion = computed(() =>
  camiones.value > 0 ? total.value / camiones.value : 0,
);

// ── Contenido ───────────────────────────────────────────────────────────────

/** Sellos de la portada: lo que un transportista argentino reconoce al toque. */
const CUMPLIMIENTO = [
  { icono: "mdi-shield-check-outline", texto: "CNRT y LiNTI" },
  {
    icono: "mdi-file-document-check-outline",
    texto: "Planilla OEA — 7 puntos AFIP",
  },
  { icono: "mdi-draw-pen", texto: "Firma digital del chofer" },
  { icono: "mdi-wifi-off", texto: "Opera sin señal" },
];

/**
 * Números de portada. Son propiedades del producto, verificables — no métricas
 * de clientes: inventar "500 flotas confían en nosotros" se nota y se paga caro.
 */
const METRICAS = [
  {
    valor: `${DIAS_DE_PRUEBA} días`,
    texto: "de prueba con acceso completo, sin tarjeta",
  },
  {
    valor: "Sin señal",
    texto: "la app del chofer carga igual y sincroniza sola",
  },
  {
    valor: "7 puntos",
    texto: "de la planilla OEA de AFIP, firmados desde el celular",
  },
  { valor: "Ilimitados", texto: "choferes y usuarios, en todos los planes" },
];

const DOLORES = [
  {
    icono: "mdi-notebook-outline",
    titulo: "El cuaderno del chofer",
    texto:
      "Los gastos del viaje se anotan en papel y se pierden. A fin de mes nadie sabe qué se gastó ni en qué.",
    costo: "Plata que no se rinde",
  },
  {
    icono: "mdi-calendar-alert",
    titulo: "Los vencimientos",
    texto:
      "VTV, seguro, LiNTI, psicofísico. Te enterás cuando te para Gendarmería, no antes.",
    costo: "Multas y camiones parados",
  },
  {
    icono: "mdi-help-circle-outline",
    titulo: "El costo por kilómetro",
    texto:
      "Es el número que define si ganás o perdés en cada viaje, y hoy no lo tenés.",
    costo: "Tarifas cotizadas a ojo",
  },
];

const MODULOS = [
  {
    icono: "mdi-cellphone-check",
    titulo: "App del chofer",
    texto:
      "Funciona sin señal y sincroniza sola. Con dictado por voz y foto del ticket.",
  },
  {
    icono: "mdi-receipt-text-outline",
    titulo: "Rendiciones",
    texto: "Se arman solas con lo que cargó el chofer: gastos menos adelantos.",
  },
  {
    icono: "mdi-gas-station-outline",
    titulo: "Combustible",
    texto: "km/l y costo por km, por camión y por chofer.",
  },
  {
    icono: "mdi-bell-ring-outline",
    titulo: "Alertas",
    texto: "Una bandeja por prioridad en lugar de 400 mensajes de WhatsApp.",
  },
  {
    icono: "mdi-wrench-outline",
    titulo: "Mantenimiento",
    texto: "Planes preventivos por km o fecha, con órdenes de trabajo.",
  },
  {
    icono: "mdi-account-badge-outline",
    titulo: "Legajos",
    texto:
      "Habilitaciones con vencimiento y bloqueo de asignación por licencia.",
  },
];

const DIFERENCIAL = [
  "Rendición de gastos y adelantos del chofer — ningún competidor internacional la resuelve",
  "Legajo con habilitaciones argentinas: LiNTI, CNRT, psicofísico, carga peligrosa",
  "Planilla OEA de los 7 puntos AFIP, firmada digitalmente",
  "Choferes y usuarios ilimitados en todos los planes",
  "Precios en pesos, soporte en tu huso horario y sin hardware que instalar",
];

const PASOS = [
  {
    titulo: "Creás la cuenta",
    texto: `Dos minutos y un correo. Sin tarjeta, sin llamada comercial, sin demo obligatoria.`,
  },
  {
    titulo: "Cargás flota y choferes",
    texto:
      "El asistente de alta te lleva paso a paso: unidades, personal y documentación con sus vencimientos.",
  },
  {
    titulo: "El chofer arranca el viaje",
    texto:
      "Instala la app desde el celular y carga el primer gasto. Vos lo ves en el tablero al instante.",
  },
];

/** Lo que se muestra en la tarjeta del plan: el detalle fino va en el modal. */
const DESTACADOS: Record<string, string[]> = {
  control: [
    "Flota, documentación y vencimientos",
    "Viajes, checklists e incidentes",
    "App del chofer con carga offline",
    "Bandeja de alertas por prioridad",
  ],
  operacion: [
    "Todo lo de Control",
    "Bitácora de gastos y rendiciones",
    "Combustible y mantenimiento preventivo",
    "Legajos y planilla OEA de AFIP",
  ],
  gestion: [
    "Todo lo de Operación",
    "Costo por kilómetro e indicadores",
    "Ranking de consumo por chofer",
    "Reportes programados y rol auditor",
  ],
  corporate: [
    "Todo lo de Gestión",
    "Varias empresas en una operación",
    "API de integración y SSO",
    "Entorno de pruebas y soporte dedicado",
  ],
};

const FAQ = [
  {
    p: `¿Qué pasa cuando terminan los ${DIAS_DE_PRUEBA} días?`,
    r: `Nada se borra. La cuenta queda en pausa con todos tus datos adentro y elegís el plan cuando quieras. Te avisamos por correo 7, 3 y 1 día antes del vencimiento.`,
  },
  {
    p: "¿Hace falta tarjeta de crédito para probar?",
    r: `No. La prueba son ${DIAS_DE_PRUEBA} días con acceso completo al plan Operación y no se pide ningún medio de pago para empezar.`,
  },
  {
    p: "¿Y si el camión anda por una zona sin señal?",
    r: "La app del chofer guarda todo en el celular y lo sincroniza sola cuando vuelve la conexión. El chofer no tiene que acordarse de nada ni reintentar la carga.",
  },
  {
    p: "¿Los choferes ocupan licencias?",
    r: "No. Choferes y usuarios son ilimitados en todos los planes: se paga por camión, no por persona. Sumar administrativos o encargados de taller no cambia la factura.",
  },
  {
    p: "¿Puedo cambiar de plan después?",
    r: "Sí, cuando quieras y desde el sistema. El cambio se aplica al instante y la diferencia se prorratea en la siguiente factura.",
  },
  {
    p: "¿Hay que instalar servidores o comprar equipos?",
    r: "No hay hardware. La administración trabaja desde el navegador y el chofer desde su propio celular; las actualizaciones llegan solas.",
  },
];

/**
 * Aparición al entrar en pantalla.
 *
 * Es una directiva local y no un componente para no envolver el marcado en
 * `<div>` extra: se aplica al elemento que ya existe. El valor es el retardo en
 * milisegundos, para escalonar las tarjetas de una grilla.
 *
 * Sin IntersectionObserver (o con `prefers-reduced-motion`, que lo neutraliza
 * desde el CSS) el contenido se ve igual: la animación nunca puede ser la
 * condición para leer la página.
 */
const vReveal = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number | undefined>) {
    el.classList.add("lp-reveal");
    if (binding.value) el.style.setProperty("--lp-delay", `${binding.value}ms`);

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("lp-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("lp-visible");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    (el as HTMLElement & { _lpIo?: IntersectionObserver })._lpIo = io;
  },
  unmounted(el: HTMLElement & { _lpIo?: IntersectionObserver }) {
    el._lpIo?.disconnect();
  },
};

useSeoMeta({
  title: "Gestión de flotas para transporte de carga",
  description:
    "FleetLog reemplaza el cuaderno del chofer, el Excel y los grupos de WhatsApp. " +
    "Rendiciones automáticas, control de vencimientos y costo por kilómetro. " +
    `Probalo gratis ${DIAS_DE_PRUEBA} días.`,
  ogTitle: "FleetLog — Gestión de flotas para transporte de carga",
  ogDescription:
    "Rendiciones que se arman solas, vencimientos bajo control y el costo por " +
    `kilómetro de tu flota. Probalo gratis ${DIAS_DE_PRUEBA} días, sin tarjeta.`,
  ogType: "website",
  ogImage: "/og-fleetlog.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div>
    <!-- ── Portada ───────────────────────────────────────────────────────── -->
    <section class="lp-oscuro lp-hero">
      <div class="lp-glow" />
      <div class="lp-grid" />

      <v-container>
        <v-row align="center">
          <v-col cols="12" md="7" lg="6">
            <span v-reveal class="lp-eyebrow mb-6 d-inline-flex">
              <span class="lp-pulso" />
              Para empresas de transporte de carga
            </span>

            <h1 v-reveal="60" class="lp-display mt-6 mb-5">
              Tu flota deja de<br class="d-none d-sm-block" />
              ser una caja negra.
            </h1>

            <p v-reveal="140" class="lp-lead lp-tenue lp-medida mb-8">
              Cada gasto del viaje, cada vencimiento y el costo real por
              kilómetro. El chofer lo carga desde la ruta, vos lo ves en el
              tablero al instante.
            </p>

            <div v-reveal="200" class="d-flex flex-wrap ga-3">
              <v-btn
                color="primary"
                size="x-large"
                flat
                to="/auth/registro-empresa"
                append-icon="mdi-arrow-right"
              >
                Probar gratis {{ DIAS_DE_PRUEBA }} días
              </v-btn>
              <v-btn
                size="x-large"
                variant="outlined"
                class="lp-btn-ghost"
                href="#producto"
              >
                Ver cómo funciona
              </v-btn>
            </div>

            <p v-reveal="260" class="text-body-2 lp-tenue mt-5 mb-0">
              Sin tarjeta de crédito · Acceso completo · Cancelás cuando quieras
            </p>
          </v-col>

          <!-- Maqueta del tablero: se ve el producto antes de leer una feature -->
          <v-col cols="12" md="5" lg="6" class="d-none d-md-block">
            <div v-reveal="220" class="lp-vidrio lp-vidrio--flota pa-6 ml-lg-8">
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <div class="text-caption lp-tenue">Tablero de hoy</div>
                  <div class="text-h6 font-weight-bold">
                    Transportes del Sur
                  </div>
                </div>
                <span class="lp-eyebrow">
                  <span class="lp-pulso" />
                  En vivo
                </span>
              </div>

              <div class="lp-vidrio-fila">
                <span class="text-body-2 lp-tenue">Viajes en curso</span>
                <strong class="text-body-1">7</strong>
              </div>
              <div class="lp-vidrio-fila">
                <span class="text-body-2 lp-tenue">Documentos por vencer</span>
                <span class="d-flex align-center ga-2">
                  <v-icon size="16" color="warning">mdi-alert-circle</v-icon>
                  <strong class="text-body-1">3</strong>
                </span>
              </div>
              <div class="lp-vidrio-fila">
                <span class="text-body-2 lp-tenue">Gasto del día</span>
                <strong class="text-body-1">{{ money(842300) }}</strong>
              </div>
              <div class="lp-vidrio-fila">
                <span class="text-body-2 lp-tenue">Rendiciones pendientes</span>
                <strong class="text-body-1">2</strong>
              </div>

              <div class="d-flex align-end justify-space-between mt-5">
                <div>
                  <div class="text-caption lp-tenue">Costo por kilómetro</div>
                  <div class="text-h4 font-weight-bold">{{ money(1284) }}</div>
                </div>
                <div
                  class="d-flex align-end ga-1"
                  style="height: 46px; width: 132px"
                >
                  <div class="lp-barra" style="height: 40%" />
                  <div class="lp-barra" style="height: 62%" />
                  <div class="lp-barra" style="height: 48%" />
                  <div class="lp-barra" style="height: 78%" />
                  <div class="lp-barra" style="height: 58%" />
                  <div class="lp-barra lp-barra--alta" style="height: 96%" />
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Sellos: contexto argentino, que es todo el argumento del producto -->
        <div v-reveal class="lp-tira mt-12">
          <div
            class="d-flex flex-wrap ga-6 ga-md-10 justify-center justify-md-start"
          >
            <div
              v-for="c in CUMPLIMIENTO"
              :key="c.texto"
              class="d-flex align-center ga-2 text-body-2 lp-tenue"
            >
              <v-icon size="18">{{ c.icono }}</v-icon>
              {{ c.texto }}
            </div>
          </div>
        </div>
      </v-container>
    </section>

    <!-- ── Métricas ──────────────────────────────────────────────────────── -->
    <section class="py-12 py-md-14 bg-surface border-b">
      <v-container>
        <v-row>
          <v-col v-for="(m, i) in METRICAS" :key="m.valor" cols="6" md="3">
            <div v-reveal="i * 90">
              <div class="lp-metrica mb-2">{{ m.valor }}</div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ m.texto }}</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Problema ──────────────────────────────────────────────────────── -->
    <section class="py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 v-reveal class="lp-h2 mb-3">
            Tres cosas que hoy te cuestan plata
          </h2>
          <p
            v-reveal="80"
            class="lp-lead text-medium-emphasis lp-medida-centro mb-0"
          >
            Y ninguna se resuelve con otra planilla.
          </p>
        </div>

        <v-row>
          <v-col v-for="(d, i) in DOLORES" :key="d.titulo" cols="12" md="4">
            <v-card
              v-reveal="i * 110"
              border
              flat
              rounded="lg"
              class="lp-card pa-7 h-100"
            >
              <div class="d-flex align-center justify-space-between mb-4">
                <v-icon size="30" color="primary">{{ d.icono }}</v-icon>
                <span class="lp-num">0{{ i + 1 }}</span>
              </div>
              <div class="lp-h3 mb-3">{{ d.titulo }}</div>
              <p class="text-body-1 text-medium-emphasis mb-4">{{ d.texto }}</p>
              <v-chip size="small" color="error" variant="tonal">
                {{ d.costo }}
              </v-chip>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Producto: tres momentos del viaje ─────────────────────────────── -->
    <section id="producto" class="py-16 bg-surface border-y">
      <v-container>
        <div class="mb-14">
          <h2 v-reveal class="lp-h2 mb-3">
            Del checklist de salida<br class="d-none d-md-block" />
            a la rendición firmada.
          </h2>
          <p v-reveal="80" class="lp-lead text-medium-emphasis lp-medida mb-0">
            Una sola plataforma para el chofer, la administración y la gerencia.
            Sin exportar, sin volver a tipear, sin pedirle nada a nadie.
          </p>
        </div>

        <!-- 1. La carga sucede donde sucede el gasto -->
        <v-row align="center" class="mb-14">
          <v-col cols="12" md="6">
            <div v-reveal>
              <div class="text-overline text-primary mb-2">En la ruta</div>
              <h3 class="lp-h3 mb-4">
                El gasto se carga donde ocurre, no tres semanas después.
              </h3>
              <p class="text-body-1 text-medium-emphasis lp-medida mb-5">
                El chofer saca la foto del ticket y lo dicta por voz.
                Combustible, peaje, viático, adelanto o multa quedan cargados en
                el viaje, con comprobante, aunque no haya una raya de señal.
              </p>
              <div class="d-flex flex-column ga-2">
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Foto del comprobante en cada movimiento</span
                  >
                </div>
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Dictado por voz: no hay que tipear manejando</span
                  >
                </div>
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Cola offline que sincroniza sola al volver la señal</span
                  >
                </div>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="d-flex justify-center justify-md-end">
            <!-- Maqueta del celular del chofer -->
            <div v-reveal="120" class="lp-fono">
              <div class="lp-fono__barra" />
              <div class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="text-subtitle-2 font-weight-bold">
                    Viaje #4821
                  </div>
                  <v-chip size="x-small" color="warning" variant="tonal">
                    Sin señal
                  </v-chip>
                </div>

                <v-card border flat rounded="lg" class="pa-3 mb-2">
                  <div class="d-flex align-center ga-3">
                    <v-avatar color="primary" variant="tonal" size="32">
                      <v-icon size="18">mdi-gas-station</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1 min-w-0">
                      <div class="text-body-2 font-weight-medium">
                        Combustible
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        320 l · YPF Ruta 9
                      </div>
                    </div>
                    <div class="text-body-2 font-weight-bold">
                      {{ money(412000) }}
                    </div>
                  </div>
                </v-card>

                <v-card border flat rounded="lg" class="pa-3 mb-2">
                  <div class="d-flex align-center ga-3">
                    <v-avatar color="secondary" variant="tonal" size="32">
                      <v-icon size="18">mdi-boom-gate-outline</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1 min-w-0">
                      <div class="text-body-2 font-weight-medium">Peaje</div>
                      <div class="text-caption text-medium-emphasis">
                        Con foto del ticket
                      </div>
                    </div>
                    <div class="text-body-2 font-weight-bold">
                      {{ money(18400) }}
                    </div>
                  </div>
                </v-card>

                <v-btn color="primary" flat block size="small" class="mt-3">
                  <v-icon start size="18">mdi-microphone</v-icon>
                  Cargar gasto
                </v-btn>
                <div class="text-caption text-medium-emphasis text-center mt-2">
                  2 movimientos esperando sincronizar
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- 2. La rendición se arma sola -->
        <v-row align="center" class="mb-14">
          <v-col cols="12" md="6" order="2" order-md="1">
            <v-card v-reveal border flat rounded="lg" class="pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <div class="text-caption text-medium-emphasis">
                    Rendición · Viaje #4821
                  </div>
                  <div class="text-subtitle-1 font-weight-bold">
                    R. Gómez · Buenos Aires — Tucumán
                  </div>
                </div>
                <v-chip size="small" color="success" variant="tonal">
                  Lista para firmar
                </v-chip>
              </div>

              <div class="d-flex justify-space-between py-2 border-b">
                <span class="text-body-2">Gastos rendidos</span>
                <strong>{{ money(612400) }}</strong>
              </div>
              <div class="d-flex justify-space-between py-2 border-b">
                <span class="text-body-2">Adelantos entregados</span>
                <strong class="text-error">− {{ money(500000) }}</strong>
              </div>
              <div class="d-flex justify-space-between py-3">
                <span class="text-body-1 font-weight-medium"
                  >Neto a rendir</span
                >
                <strong class="text-h6 text-primary">{{
                  money(112400)
                }}</strong>
              </div>

              <v-divider class="mb-4" />
              <div
                class="d-flex align-center ga-2 text-caption text-medium-emphasis"
              >
                <v-icon size="16">mdi-paperclip</v-icon>
                14 comprobantes adjuntos
                <v-spacer />
                <v-icon size="16">mdi-file-pdf-box</v-icon>
                PDF firmable
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6" order="1" order-md="2" class="pl-md-10">
            <div v-reveal="120">
              <div class="text-overline text-primary mb-2">
                En la administración
              </div>
              <h3 class="lp-h3 mb-4">
                La rendición se arma sola. Ya no se discute.
              </h3>
              <p class="text-body-1 text-medium-emphasis lp-medida mb-5">
                Gastos menos adelantos, con cada comprobante enganchado al
                movimiento que lo generó. Nadie transcribe un cuaderno ni pelea
                por un ticket que no aparece: el número sale del sistema y se
                firma.
              </p>
              <div class="d-flex flex-column ga-2">
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Cierre del viaje con neto calculado</span
                  >
                </div>
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >PDF firmable como comprobante definitivo</span
                  >
                </div>
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Historial por chofer, listo para auditoría</span
                  >
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- 3. Los números para decidir -->
        <v-row align="center">
          <v-col cols="12" md="6">
            <div v-reveal>
              <div class="text-overline text-primary mb-2">En la gerencia</div>
              <h3 class="lp-h3 mb-4">
                Cuánto te cuesta cada kilómetro, sin armar una planilla.
              </h3>
              <p class="text-body-1 text-medium-emphasis lp-medida mb-5">
                Combustible, peajes, mantenimiento y viáticos ya están cargados
                contra el viaje y contra los kilómetros. El costo por kilómetro
                sale solo, por flota, por camión y por chofer — que es como se
                cotiza una tarifa que no te deje afuera.
              </p>
              <div class="d-flex flex-column ga-2">
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Costo por km, rendimiento y costos extraordinarios</span
                  >
                </div>
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Ranking de consumo: qué chofer rinde mejor</span
                  >
                </div>
                <div class="d-flex align-start ga-3">
                  <v-icon color="success" size="20" class="mt-1"
                    >mdi-check-circle</v-icon
                  >
                  <span class="text-body-1"
                    >Reportes programados que llegan por correo</span
                  >
                </div>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="pl-md-10">
            <v-card v-reveal="120" border flat rounded="lg" class="pa-6">
              <div class="d-flex align-center justify-space-between mb-5">
                <div class="text-subtitle-1 font-weight-bold">
                  Costo por kilómetro
                </div>
                <v-chip size="small" variant="tonal" color="primary">
                  Últimos 6 meses
                </v-chip>
              </div>

              <div class="d-flex align-end ga-2 mb-5" style="height: 130px">
                <div class="lp-barra" style="height: 55%" />
                <div class="lp-barra" style="height: 72%" />
                <div class="lp-barra" style="height: 61%" />
                <div class="lp-barra" style="height: 84%" />
                <div class="lp-barra" style="height: 70%" />
                <div class="lp-barra lp-barra--alta" style="height: 100%" />
              </div>

              <v-row dense>
                <v-col cols="4">
                  <div class="text-caption text-medium-emphasis">
                    Costo / km
                  </div>
                  <div class="text-h6 font-weight-bold">{{ money(1284) }}</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-caption text-medium-emphasis">
                    Rendimiento
                  </div>
                  <div class="text-h6 font-weight-bold">2,7 km/l</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-caption text-medium-emphasis">
                    Km del mes
                  </div>
                  <div class="text-h6 font-weight-bold">184.520</div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Módulos ───────────────────────────────────────────────────────── -->
    <section id="modulos" class="py-16">
      <v-container>
        <div class="text-center mb-12">
          <h2 v-reveal class="lp-h2 mb-3">Todo lo que reemplaza</h2>
          <p
            v-reveal="80"
            class="lp-lead text-medium-emphasis lp-medida-centro mb-0"
          >
            El cuaderno, el Excel de vencimientos, el grupo de WhatsApp y la
            carpeta de comprobantes.
          </p>
        </div>

        <v-row>
          <v-col
            v-for="(m, i) in MODULOS"
            :key="m.titulo"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              v-reveal="(i % 3) * 90"
              border
              flat
              rounded="lg"
              class="lp-card pa-6 h-100"
            >
              <v-avatar color="primary" variant="tonal" size="42" class="mb-4">
                <v-icon size="22">{{ m.icono }}</v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-2">
                {{ m.titulo }}
              </div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ m.texto }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Diferencial ───────────────────────────────────────────────────── -->
    <section class="lp-oscuro py-16">
      <div class="lp-glow" />

      <v-container>
        <v-row align="center">
          <v-col cols="12" md="5">
            <h2 v-reveal class="lp-h2 mb-5">
              Hecho para cómo<br class="d-none d-md-block" />
              se trabaja acá.
            </h2>
            <p v-reveal="80" class="lp-lead lp-tenue mb-6">
              Los sistemas internacionales resuelven el seguimiento del camión.
              Ninguno resuelve la rendición del chofer ni los papeles que pide
              la CNRT.
            </p>
            <v-btn
              v-reveal="140"
              variant="outlined"
              size="large"
              class="lp-btn-ghost"
              href="#planes"
            >
              Ver planes y precios
            </v-btn>
          </v-col>

          <v-col cols="12" md="6" offset-md="1">
            <div
              v-for="(d, i) in DIFERENCIAL"
              :key="d"
              v-reveal="i * 80"
              class="d-flex align-start py-4"
              :class="{ 'border-b': i < DIFERENCIAL.length - 1 }"
              style="border-color: rgba(255, 255, 255, 0.12) !important"
            >
              <v-icon color="success" size="20" class="mr-4 mt-1">
                mdi-check-circle
              </v-icon>
              <span class="text-body-1">{{ d }}</span>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Cómo se empieza ───────────────────────────────────────────────── -->
    <section class="py-16 bg-surface border-b">
      <v-container>
        <div class="text-center mb-12">
          <h2 v-reveal class="lp-h2 mb-3">Estás andando esta misma semana</h2>
          <p
            v-reveal="80"
            class="lp-lead text-medium-emphasis lp-medida-centro mb-0"
          >
            Sin servidores, sin hardware y sin un proyecto de seis meses.
          </p>
        </div>

        <v-row>
          <v-col v-for="(p, i) in PASOS" :key="p.titulo" cols="12" md="4">
            <div v-reveal="i * 110" class="pr-md-6">
              <div class="d-flex align-center ga-3 mb-3">
                <v-avatar
                  color="primary"
                  size="34"
                  class="text-body-2 font-weight-bold"
                >
                  {{ i + 1 }}
                </v-avatar>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ p.titulo }}
                </div>
              </div>
              <p class="text-body-1 text-medium-emphasis mb-0">{{ p.texto }}</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Planes y calculadora ──────────────────────────────────────────── -->
    <section id="planes" class="py-16">
      <v-container>
        <div class="text-center mb-10">
          <h2 v-reveal class="lp-h2 mb-3">Precios claros, sin "consultar"</h2>
          <p
            v-reveal="80"
            class="lp-lead text-medium-emphasis lp-medida-centro mb-0"
          >
            Abono del plan más una tarifa por camión. Nada más.
          </p>
        </div>

        <!-- Calculadora: se cotiza con dos números y una multiplicación -->
        <v-card
          v-reveal
          border
          flat
          rounded="lg"
          class="pa-6 pa-md-8 mb-12 mx-auto"
          max-width="820"
        >
          <div class="text-subtitle-1 font-weight-bold mb-5">
            ¿Cuánto me sale?
          </div>

          <v-row align="center" dense>
            <v-col cols="12" sm="5">
              <v-select
                v-model="planElegido"
                :items="planesCotizables"
                item-title="name"
                item-value="code"
                label="Plan"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="7" class="pl-sm-6">
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span>Camiones</span>
                <strong>{{ camiones }}</strong>
              </div>
              <v-slider
                v-model="camiones"
                :min="1"
                :max="100"
                :step="1"
                color="primary"
                hide-details
              />
            </v-col>
          </v-row>

          <v-divider class="my-6" />

          <div class="d-flex justify-space-between align-end flex-wrap ga-4">
            <div>
              <div class="text-caption text-medium-emphasis mb-1">
                {{ money(planActual?.baseFee ?? 0) }} de abono +
                {{ camiones }} ×
                {{ money(planActual?.pricePerVehicle ?? 0) }}
              </div>
              <div class="text-h3 font-weight-bold">
                {{ money(total) }}<span class="text-h6">/mes</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-caption text-medium-emphasis">Por camión</div>
              <div class="text-h5 font-weight-bold">{{ money(porCamion) }}</div>
            </div>
          </div>
          <p class="text-caption text-medium-emphasis mt-3 mb-0">
            Precios en pesos. Los acoplados facturan al 50 %.
          </p>
        </v-card>

        <v-row>
          <v-col v-for="(p, i) in planes" :key="p.code" cols="12" sm="6" md="3">
            <v-card
              v-reveal="i * 90"
              border
              flat
              rounded="lg"
              class="lp-card pa-6 h-100 d-flex flex-column"
              :class="{ 'lp-plan--destacado': p.code === 'operacion' }"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-h6 font-weight-bold">{{ p.name }}</div>
                <v-chip
                  v-if="p.code === 'operacion'"
                  size="x-small"
                  color="primary"
                  variant="flat"
                >
                  Más elegido
                </v-chip>
              </div>

              <p class="text-body-2 text-medium-emphasis mb-5">
                {{ p.description }}
              </p>

              <div class="mb-1">
                <span class="text-h4 font-weight-bold">
                  {{ money(p.baseFee) }}
                </span>
                <span class="text-body-2 text-medium-emphasis">/mes</span>
              </div>
              <div class="text-body-2 text-medium-emphasis mb-5">
                + {{ money(p.pricePerVehicle) }} por camión
              </div>

              <v-divider class="mb-4" />

              <div class="flex-grow-1 mb-5">
                <div
                  v-for="b in DESTACADOS[p.code] ?? []"
                  :key="b"
                  class="d-flex align-start ga-2 mb-2"
                >
                  <v-icon color="success" size="17" class="mt-1">
                    mdi-check
                  </v-icon>
                  <span class="text-body-2">{{ b }}</span>
                </div>
              </div>

              <v-btn
                :color="p.code === 'operacion' ? 'primary' : undefined"
                :variant="p.code === 'operacion' ? 'flat' : 'outlined'"
                block
                :to="p.isNegotiated ? undefined : '/auth/registro-empresa'"
                :href="p.isNegotiated ? CONTACTO.whatsappUrl : undefined"
                :target="p.isNegotiated ? '_blank' : undefined"
                :rel="p.isNegotiated ? 'noopener' : undefined"
              >
                {{ p.isNegotiated ? "Contactanos" : "Probar gratis" }}
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                color="primary"
                class="mt-2"
                block
                @click="abrirComparativa(p.code)"
              >
                Ver todo lo que incluye
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <!-- Comparativa completa: la respuesta a "¿pero entra X en mi plan?" -->
        <div v-reveal class="text-center mt-10">
          <v-btn
            variant="outlined"
            size="large"
            prepend-icon="mdi-table-check"
            @click="abrirComparativa(null)"
          >
            Comparar las características de los 4 planes
          </v-btn>
          <p class="text-body-2 text-medium-emphasis mt-4 mb-0">
            Todos los planes incluyen
            <strong>choferes y usuarios ilimitados</strong>.
          </p>
        </div>
      </v-container>
    </section>

    <!-- ── Preguntas ─────────────────────────────────────────────────────── -->
    <section id="faq" class="py-16 bg-surface border-y">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <h2 v-reveal class="lp-h2 mb-3">Antes de que preguntes</h2>
            <p v-reveal="80" class="text-body-1 text-medium-emphasis">
              Lo que nos consultan todas las semanas. Si te queda otra,
              escribinos a
              <a :href="`mailto:${CONTACTO.email}`" class="text-primary">
                {{ CONTACTO.email }}
              </a>
              o por
              <a
                :href="CONTACTO.whatsappUrl"
                target="_blank"
                rel="noopener"
                class="text-primary"
              >
                WhatsApp
              </a>
              .
            </p>
          </v-col>

          <v-col cols="12" md="7" offset-md="1">
            <v-expansion-panels v-reveal="100" variant="accordion" flat>
              <v-expansion-panel
                v-for="f in FAQ"
                :key="f.p"
                :title="f.p"
                :text="f.r"
                class="border-b"
              />
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Cierre ────────────────────────────────────────────────────────── -->
    <section id="contacto" class="lp-oscuro py-16">
      <div class="lp-glow" />
      <div class="lp-grid" />

      <v-container class="text-center">
        <h2 v-reveal class="lp-display mb-5">
          Probalo con tu<br class="d-none d-sm-block" />
          propia flota.
        </h2>
        <p v-reveal="80" class="lp-lead lp-tenue lp-medida-centro mb-8">
          {{ DIAS_DE_PRUEBA }} días con acceso completo al plan Operación. Sin
          tarjeta y sin compromiso: si no te sirve, no hacés nada.
        </p>

        <div v-reveal="140" class="d-flex flex-wrap justify-center ga-3">
          <v-btn
            color="primary"
            size="x-large"
            flat
            to="/auth/registro-empresa"
            append-icon="mdi-arrow-right"
          >
            Crear mi cuenta
          </v-btn>
          <v-btn
            size="x-large"
            variant="outlined"
            class="lp-btn-ghost"
            :href="CONTACTO.whatsappUrl"
            target="_blank"
            rel="noopener"
            prepend-icon="mdi-whatsapp"
          >
            Contactanos
          </v-btn>
        </div>

        <p v-reveal="200" class="text-body-2 lp-tenue mt-8 mb-0">
          ¿Flota grande o varias empresas? Escribinos a
          <a :href="`mailto:${CONTACTO.email}`" class="text-white">
            {{ CONTACTO.email }}
          </a>
          o al
          <a
            :href="CONTACTO.whatsappUrl"
            target="_blank"
            rel="noopener"
            class="text-white"
          >
            {{ CONTACTO.whatsappVisible }}
          </a>
        </p>
      </v-container>
    </section>

    <LandingPlanFeaturesDialog
      v-model="comparativaAbierta"
      :planes="planes"
      :destacado="planComparado"
    />
  </div>
</template>
