<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

/**
 * Landing pública.
 *
 * Los textos salen de `docs/MODELO-COMERCIAL.md`: los tres dolores del §4.3, el
 * diferencial frente a la competencia del §8.3 y los precios del §3.2. No es
 * texto de relleno — es la propuesta comercial escrita.
 */
definePageMeta({ layout: "public" });

const { get } = useApi();
const { money } = useFormatters();

/**
 * Precios de respaldo, con los valores del modelo comercial.
 *
 * La landing se pre-renderiza en el build, cuando la API puede no estar
 * disponible (riesgo R7.3). Se muestra esto y se refresca en el cliente: es
 * preferible un precio de hace un deploy que una tarjeta vacía.
 */
const PLANES_FALLBACK = [
  {
    code: "control",
    name: "Control",
    description: "Dejá el cuaderno. Sabé qué tenés en la calle y qué se te vence.",
    baseFee: 59000,
    pricePerVehicle: 7900,
    minVehicles: 3,
    isNegotiated: false,
  },
  {
    code: "operacion",
    name: "Operación",
    description: "Todo el viaje bajo control, del checklist hasta la rendición.",
    baseFee: 129000,
    pricePerVehicle: 12900,
    minVehicles: 5,
    isNegotiated: false,
  },
  {
    code: "gestion",
    name: "Gestión",
    description: "Decidí con números: costo por kilómetro, por camión y por chofer.",
    baseFee: 249000,
    pricePerVehicle: 18900,
    minVehicles: 8,
    isNegotiated: false,
  },
  {
    code: "corporate",
    name: "Corporate",
    description: "Varias empresas, una sola operación.",
    baseFee: 490000,
    pricePerVehicle: 10900,
    minVehicles: 25,
    isNegotiated: true,
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

// ── Calculadora: el argumento de venta es que se cotiza con dos números ──────
const camiones = ref(12);
const planElegido = ref("operacion");

const planActual = computed(
  () => planes.value.find((p) => p.code === planElegido.value) ?? planes.value[1],
);

const unidadesFacturadas = computed(() =>
  Math.max(camiones.value, planActual.value?.minVehicles ?? 0),
);

const total = computed(
  () =>
    Number(planActual.value?.baseFee ?? 0) +
    unidadesFacturadas.value * Number(planActual.value?.pricePerVehicle ?? 0),
);

const porCamion = computed(() =>
  camiones.value > 0 ? total.value / camiones.value : 0,
);

const DOLORES = [
  {
    icono: "mdi-notebook-outline",
    titulo: "El cuaderno del chofer",
    texto:
      "Los gastos del viaje se anotan en papel y se pierden. A fin de mes nadie sabe qué se gastó ni en qué.",
  },
  {
    icono: "mdi-calendar-alert",
    titulo: "Los vencimientos",
    texto:
      "VTV, seguro, LiNTI, psicofísico. Te enterás cuando te para Gendarmería, no antes.",
  },
  {
    icono: "mdi-help-circle-outline",
    titulo: "El costo por kilómetro",
    texto:
      "Es el número que define si ganás o perdés en cada viaje, y hoy no lo tenés.",
  },
];

const MODULOS = [
  { icono: "mdi-cellphone-check", titulo: "App del chofer", texto: "Funciona sin señal y sincroniza sola. Con dictado por voz y foto del ticket." },
  { icono: "mdi-receipt-text-outline", titulo: "Rendiciones", texto: "Se arman solas con lo que cargó el chofer: gastos menos adelantos." },
  { icono: "mdi-gas-station-outline", titulo: "Combustible", texto: "km/l y costo por km, por camión y por chofer." },
  { icono: "mdi-bell-ring-outline", titulo: "Alertas", texto: "Una bandeja por prioridad en lugar de 400 mensajes de WhatsApp." },
  { icono: "mdi-wrench-outline", titulo: "Mantenimiento", texto: "Planes preventivos por km o fecha, con órdenes de trabajo." },
  { icono: "mdi-account-badge-outline", titulo: "Legajos", texto: "Habilitaciones con vencimiento y bloqueo de asignación por licencia." },
];

const DIFERENCIAL = [
  "Rendición de gastos y adelantos del chofer — ningún competidor internacional la resuelve",
  "Legajo con habilitaciones argentinas: LiNTI, CNRT, psicofísico, carga peligrosa",
  "Planilla OEA de los 7 puntos AFIP, firmada digitalmente",
  "Choferes y usuarios ilimitados en todos los planes",
];

useSeoMeta({
  title: "Gestión de flotas para transporte de carga",
  description:
    "FleetLog reemplaza el cuaderno del chofer, el Excel y los grupos de WhatsApp. " +
    "Rendiciones automáticas, control de vencimientos y costo por kilómetro. " +
    "Probalo gratis 21 días.",
  ogTitle: "FleetLog — Gestión de flotas para transporte de carga",
  ogDescription:
    "Rendiciones que se arman solas, vencimientos bajo control y el costo por " +
    "kilómetro de tu flota. Probalo gratis 21 días, sin tarjeta.",
  ogType: "website",
  ogImage: "/og-fleetlog.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div>
    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="py-16 py-md-16">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="7">
            <v-chip color="primary" variant="tonal" size="small" class="mb-4">
              Para empresas de transporte de carga
            </v-chip>

            <h1 class="text-h3 text-md-h2 font-weight-bold mb-4">
              Dejá el cuaderno.<br />
              Controlá tu flota desde el celular del chofer.
            </h1>

            <p class="text-h6 font-weight-regular text-medium-emphasis mb-6">
              Los gastos del viaje, los vencimientos y el costo por kilómetro en
              un solo lugar. El chofer carga desde la ruta, vos lo ves al
              instante.
            </p>

            <div class="d-flex flex-wrap ga-3">
              <v-btn
                color="primary"
                size="large"
                flat
                to="/auth/registro-empresa"
              >
                Probar gratis 21 días
              </v-btn>
              <v-btn size="large" variant="outlined" href="#planes">
                Ver planes
              </v-btn>
            </div>

            <p class="text-body-2 text-medium-emphasis mt-4 mb-0">
              Sin tarjeta de crédito · Acceso completo · Cancelás cuando quieras
            </p>
          </v-col>

          <v-col cols="12" md="5" class="d-none d-md-block">
            <v-card border flat rounded="lg" class="pa-6">
              <div class="text-caption text-medium-emphasis mb-1">
                Resumen de hoy
              </div>
              <div class="d-flex justify-space-between py-2 border-b">
                <span class="text-body-2">Viajes en curso</span>
                <strong>7</strong>
              </div>
              <div class="d-flex justify-space-between py-2 border-b">
                <span class="text-body-2">Documentos por vencer</span>
                <strong class="text-warning">3</strong>
              </div>
              <div class="d-flex justify-space-between py-2 border-b">
                <span class="text-body-2">Gasto del día</span>
                <strong>{{ money(842300) }}</strong>
              </div>
              <div class="d-flex justify-space-between py-2">
                <span class="text-body-2">Costo por km</span>
                <strong class="text-primary">{{ money(1284) }}</strong>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Problema ──────────────────────────────────────────────────────── -->
    <section class="py-12 bg-surface">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-2">
          Tres cosas que hoy te cuestan plata
        </h2>
        <p class="text-body-1 text-medium-emphasis text-center mb-10">
          Y que no se resuelven con otra planilla.
        </p>

        <v-row dense>
          <v-col v-for="d in DOLORES" :key="d.titulo" cols="12" md="4">
            <v-card border flat rounded="lg" class="pa-6 h-100">
              <v-icon size="32" color="primary" class="mb-3">
                {{ d.icono }}
              </v-icon>
              <div class="text-h6 font-weight-bold mb-2">{{ d.titulo }}</div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ d.texto }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Módulos ───────────────────────────────────────────────────────── -->
    <section id="modulos" class="py-16">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-2">
          Todo el viaje, del checklist a la rendición
        </h2>
        <p class="text-body-1 text-medium-emphasis text-center mb-10">
          Una sola plataforma para el chofer, la administración y la gerencia.
        </p>

        <v-row dense>
          <v-col v-for="m in MODULOS" :key="m.titulo" cols="12" sm="6" md="4">
            <v-card border flat rounded="lg" class="pa-5 h-100">
              <div class="d-flex align-center mb-2">
                <v-avatar color="primary" variant="tonal" size="38" class="mr-3">
                  <v-icon size="20">{{ m.icono }}</v-icon>
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ m.titulo }}
                </div>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ m.texto }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Diferencial ───────────────────────────────────────────────────── -->
    <section class="py-12 bg-surface">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <h2 class="text-h4 font-weight-bold mb-4">
              Hecho para cómo se trabaja acá
            </h2>
            <p class="text-body-1 text-medium-emphasis">
              Los sistemas internacionales resuelven el seguimiento del camión.
              Ninguno resuelve la rendición del chofer ni los papeles que pide
              la CNRT.
            </p>
          </v-col>

          <v-col cols="12" md="6">
            <div
              v-for="d in DIFERENCIAL"
              :key="d"
              class="d-flex align-start py-2"
            >
              <v-icon color="success" size="20" class="mr-3 mt-1">
                mdi-check-circle
              </v-icon>
              <span class="text-body-1">{{ d }}</span>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ── Planes y calculadora ──────────────────────────────────────────── -->
    <section id="planes" class="py-16">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-2">
          Precios claros, sin "consultar"
        </h2>
        <p class="text-body-1 text-medium-emphasis text-center mb-8">
          Abono del plan + una tarifa por camión. Nada más.
        </p>

        <!-- Calculadora: se cotiza con dos números y una multiplicación -->
        <v-card border flat rounded="lg" class="pa-6 mb-10 mx-auto" max-width="760">
          <div class="text-subtitle-1 font-weight-medium mb-4">
            ¿Cuánto me sale?
          </div>

          <v-row align="center" dense>
            <v-col cols="12" sm="5">
              <v-select
                v-model="planElegido"
                :items="planes.filter((p) => !p.isNegotiated)"
                item-title="name"
                item-value="code"
                label="Plan"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="7">
              <div class="text-body-2 mb-1">
                Camiones: <strong>{{ camiones }}</strong>
              </div>
              <v-slider
                v-model="camiones"
                :min="1"
                :max="80"
                :step="1"
                color="primary"
                hide-details
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-end flex-wrap ga-2">
            <div>
              <div class="text-caption text-medium-emphasis">
                {{ money(planActual?.baseFee ?? 0) }} de abono +
                {{ unidadesFacturadas }} ×
                {{ money(planActual?.pricePerVehicle ?? 0) }}
                <template v-if="unidadesFacturadas > camiones">
                  (mínimo del plan)
                </template>
              </div>
              <div class="text-h4 font-weight-bold">
                {{ money(total) }}<span class="text-h6">/mes</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-caption text-medium-emphasis">Por camión</div>
              <div class="text-h6">{{ money(porCamion) }}</div>
            </div>
          </div>
          <p class="text-caption text-medium-emphasis mt-2 mb-0">
            Precios en pesos, sin IVA. Los acoplados facturan al 50 %.
          </p>
        </v-card>

        <v-row dense>
          <v-col v-for="p in planes" :key="p.code" cols="12" sm="6" md="3">
            <v-card
              border
              flat
              rounded="lg"
              class="pa-5 h-100 d-flex flex-column"
              :color="p.code === 'operacion' ? 'primary' : undefined"
              :variant="p.code === 'operacion' ? 'tonal' : undefined"
            >
              <div class="text-h6 font-weight-bold">{{ p.name }}</div>
              <v-chip
                v-if="p.code === 'operacion'"
                size="x-small"
                color="primary"
                class="align-self-start my-2"
              >
                Más elegido
              </v-chip>

              <p class="text-body-2 text-medium-emphasis my-3 flex-grow-1">
                {{ p.description }}
              </p>

              <div class="mb-1">
                <span class="text-h5 font-weight-bold">
                  {{ money(p.baseFee) }}
                </span>
                <span class="text-body-2 text-medium-emphasis">/mes</span>
              </div>
              <div class="text-body-2 text-medium-emphasis mb-1">
                + {{ money(p.pricePerVehicle) }} por camión
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                Desde {{ p.minVehicles }} unidades
              </div>

              <v-btn
                :color="p.code === 'operacion' ? 'primary' : undefined"
                :variant="p.code === 'operacion' ? 'flat' : 'outlined'"
                block
                :to="p.isNegotiated ? undefined : '/auth/registro-empresa'"
                :href="p.isNegotiated ? '#contacto' : undefined"
              >
                {{ p.isNegotiated ? "Hablar con ventas" : "Probar gratis" }}
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <p class="text-body-2 text-medium-emphasis text-center mt-6 mb-0">
          Todos los planes incluyen <strong>choferes y usuarios ilimitados</strong>.
        </p>
      </v-container>
    </section>

    <!-- ── Cierre ────────────────────────────────────────────────────────── -->
    <section id="contacto" class="py-16 bg-surface">
      <v-container>
        <v-card border flat rounded="lg" class="pa-8 text-center mx-auto" max-width="720">
          <h2 class="text-h4 font-weight-bold mb-3">
            Probalo con tu propia flota
          </h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            21 días con acceso completo al plan Operación. Sin tarjeta y sin
            compromiso: si no te sirve, no hacés nada.
          </p>
          <v-btn color="primary" size="large" flat to="/auth/registro-empresa">
            Crear mi cuenta
          </v-btn>
          <p class="text-body-2 text-medium-emphasis mt-6 mb-0">
            ¿Flota grande o varias empresas? Escribinos a
            <a href="mailto:ventas@fleetlog.com.ar" class="text-primary">
              ventas@fleetlog.com.ar
            </a>
          </p>
        </v-card>
      </v-container>
    </section>
  </div>
</template>
