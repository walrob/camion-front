<script setup lang="ts">
import { computed } from "vue";

/**
 * Comparativa completa de planes.
 *
 * En la landing las tarjetas muestran sólo el gancho de cada plan; el detalle
 * fino ("¿entra mantenimiento en Control?") vive acá, a un clic de distancia.
 * Mostrarlo todo en la grilla mataba la lectura de precios, y esconderlo del
 * todo obligaba a escribir a ventas para una respuesta de sí o no.
 *
 * Las marcas NO están escritas a mano: salen de `plan.features`, el mismo array
 * que el backend usa para el gating (`SeedPlans` + `feature.enum.ts`). Si mañana
 * un plan gana o pierde una funcionalidad, esta tabla se entera sola.
 */

interface PlanPublico {
  code: string;
  name: string;
  baseFee: number;
  pricePerVehicle: number;
  isNegotiated?: boolean | number;
  features?: string[];
  limits?: {
    retentionMonths: number | null;
    storageGb: number | null;
    alertRules: number | null;
    maintenancePlans: number | null;
    roles: string[];
  } | null;
}

const props = defineProps<{
  /** Planes públicos, en el orden en que se muestran las columnas. */
  planes: PlanPublico[];
  /** Código del plan a resaltar (el que abrió el modal). */
  destacado?: string | null;
}>();

const abierto = defineModel<boolean>({ default: false });

const { money } = useFormatters();

/**
 * Catálogo de funcionalidades en lenguaje de cliente.
 *
 * La clave es la feature del backend; el texto es material de venta y por eso
 * vive junto a la landing y no en `types/plan.ts`. El orden de los grupos sigue
 * el recorrido del negocio: primero lo que reemplaza al cuaderno, después la
 * plata del viaje, después los números para decidir.
 */
const GRUPOS = [
  {
    titulo: "Operación diaria",
    items: [
      {
        key: "fleet",
        titulo: "Flota y unidades",
        detalle: "Camiones, acoplados y semis con su ficha técnica",
      },
      {
        key: "trips",
        titulo: "Viajes y asignaciones",
        detalle: "Quién llevó qué, cuándo y con qué unidad",
      },
      {
        key: "checklists",
        titulo: "Checklists de salida y llegada",
        detalle: "Con fotos y firma del chofer",
      },
      {
        key: "driver_app",
        titulo: "App del chofer",
        detalle: "Funciona sin señal y sincroniza sola",
      },
      {
        key: "messages",
        titulo: "Mensajería con la ruta",
        detalle: "Conversación por viaje, no un grupo de WhatsApp",
      },
      {
        key: "incidents",
        titulo: "Incidentes en ruta",
        detalle: "Rotura, demora, accidente o faltante, con foto",
      },
    ],
  },
  {
    titulo: "Papeles y vencimientos",
    items: [
      {
        key: "documents",
        titulo: "Documentación de la flota",
        detalle: "VTV, seguro, RUTA y habilitaciones con vencimiento",
      },
      {
        key: "alerts",
        titulo: "Bandeja de alertas",
        detalle: "Ordenada por prioridad, con responsable",
      },
      {
        key: "hr_basic",
        titulo: "Legajos del personal",
        detalle: "Carnet, LiNTI/CNRT, psicofísico y carga peligrosa",
      },
      {
        key: "oea",
        titulo: "Planilla OEA — 7 puntos AFIP",
        detalle: "Inspección fotográfica firmada digitalmente",
      },
      {
        key: "alert_thresholds",
        titulo: "Umbrales de alerta a medida",
        detalle: "Definís vos con cuántos días de anticipación avisa",
      },
    ],
  },
  {
    titulo: "La plata del viaje",
    items: [
      {
        key: "trip_log",
        titulo: "Bitácora de gastos en ruta",
        detalle:
          "Combustible, peajes, viáticos y adelantos con foto del ticket",
      },
      {
        key: "settlements",
        titulo: "Rendiciones automáticas",
        detalle: "Gastos menos adelantos, con PDF firmable",
      },
      {
        key: "fuel",
        titulo: "Combustible y rendimiento",
        detalle: "km/l, l/100 km y costo por km por unidad",
      },
      {
        key: "maintenance",
        titulo: "Mantenimiento preventivo",
        detalle: "Planes por km o fecha y órdenes de trabajo",
      },
      {
        key: "incidents_kanban",
        titulo: "Tablero de incidentes",
        detalle: "Kanban por estado, responsable y severidad",
      },
    ],
  },
  {
    titulo: "Números para decidir",
    items: [
      {
        key: "indicators",
        titulo: "Indicadores y costo por kilómetro",
        detalle: "Por flota, por camión y por chofer",
      },
      {
        key: "fuel_ranking",
        titulo: "Ranking de consumo",
        detalle: "Qué chofer rinde mejor con el mismo camión",
      },
      {
        key: "hr_full",
        titulo: "Historial laboral y licencias",
        detalle: "Bloquea asignar viajes a quien está de licencia",
      },
      {
        key: "scheduled_reports",
        titulo: "Reportes programados",
        detalle: "Llegan por email el día y la hora que elijas",
      },
      {
        key: "export_excel",
        titulo: "Exportación a Excel",
        detalle: "Cualquier listado filtrado, listo para trabajar aparte",
      },
      {
        key: "auditor_role",
        titulo: "Rol auditor",
        detalle: "Acceso de sólo lectura para contador o auditoría",
      },
    ],
  },
  {
    titulo: "Plataforma",
    items: [
      {
        key: "multi_company",
        titulo: "Multi-empresa",
        detalle: "Varias razones sociales con una sola operación",
      },
      {
        key: "api",
        titulo: "API de integración",
        detalle: "Conectá tu ERP, tu liquidador o tu TMS",
      },
      {
        key: "sso",
        titulo: "Inicio de sesión corporativo (SSO)",
        detalle: "Con el directorio de usuarios de la empresa",
      },
      {
        key: "sandbox",
        titulo: "Entorno de pruebas",
        detalle: "Una copia para capacitar sin tocar los datos reales",
      },
    ],
  },
];

const tiene = (plan: PlanPublico, key: string) =>
  Array.isArray(plan.features) && plan.features.includes(key);

// ── Límites: no son sí/no, son cantidades ───────────────────────────────────
const meses = (v?: number | null) => {
  if (v == null) return "Sin límite";
  return v >= 12 && v % 12 === 0
    ? `${v / 12} ${v === 12 ? "año" : "años"}`
    : `${v} meses`;
};
const gigas = (v?: number | null) => (v == null ? "Sin límite" : `${v} GB`);
const cantidad = (v?: number | null, plural = "") =>
  v == null
    ? `Sin límite`
    : v === 0
      ? "—"
      : `${v}${plural ? ` ${plural}` : ""}`;

const LIMITES = computed(() => [
  {
    titulo: "Historial de datos",
    detalle: "Cuánto tiempo hacia atrás podés consultar",
    valor: (p: PlanPublico) => meses(p.limits?.retentionMonths),
  },
  {
    titulo: "Archivos y fotos",
    detalle: "Tickets, checklists y comprobantes",
    valor: (p: PlanPublico) => gigas(p.limits?.storageGb),
  },
  {
    titulo: "Reglas de alerta",
    detalle: "Avisos automáticos configurables",
    valor: (p: PlanPublico) => cantidad(p.limits?.alertRules),
  },
  {
    titulo: "Planes de mantenimiento",
    detalle: "Preventivos activos en paralelo",
    valor: (p: PlanPublico) => cantidad(p.limits?.maintenancePlans),
  },
  {
    titulo: "Perfiles de acceso",
    detalle: "Administración, tráfico, taller, RR. HH., auditoría",
    valor: (p: PlanPublico) => cantidad(p.limits?.roles?.length ?? 0, "roles"),
  },
]);

const columnas = computed(() => props.planes ?? []);
</script>

<template>
  <v-dialog v-model="abierto" max-width="1080" scrollable>
    <v-card border flat rounded="lg">
      <!-- Encabezado -->
      <div class="d-flex align-start justify-space-between pa-5 pb-4">
        <div>
          <h3 class="text-h5 font-weight-bold mb-1">Comparar los planes</h3>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Todo lo que incluye cada uno. Sin letra chica.
          </p>
        </div>
        <v-btn icon variant="text" size="small" @click="abierto = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="px-5 pb-4">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="text-body-2"
        >
          En todos los planes: <strong>choferes y usuarios ilimitados</strong>,
          app del chofer offline y actualizaciones sin costo.
        </v-alert>
      </div>

      <v-divider />

      <v-card-text class="pa-0">
        <div class="cmp-scroll">
          <table class="cmp-tabla">
            <thead>
              <tr>
                <th class="cmp-col-nombre">Característica</th>
                <th
                  v-for="p in columnas"
                  :key="p.code"
                  class="cmp-col-plan"
                  :class="{ 'cmp-col-plan--on': p.code === destacado }"
                >
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ p.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    <template v-if="p.isNegotiated">A convenir</template>
                    <template v-else>
                      desde {{ money(p.baseFee) }}/mes
                    </template>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <template v-for="g in GRUPOS" :key="g.titulo">
                <tr class="cmp-grupo">
                  <td :colspan="columnas.length + 1">{{ g.titulo }}</td>
                </tr>
                <tr v-for="f in g.items" :key="f.key">
                  <td class="cmp-col-nombre">
                    <div class="font-weight-medium">{{ f.titulo }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ f.detalle }}
                    </div>
                  </td>
                  <td
                    v-for="p in columnas"
                    :key="p.code"
                    class="cmp-celda"
                    :class="{ 'cmp-col-plan--on': p.code === destacado }"
                  >
                    <v-icon
                      v-if="tiene(p, f.key)"
                      color="success"
                      size="20"
                      :aria-label="`${f.titulo}: incluido en ${p.name}`"
                    >
                      mdi-check-circle
                    </v-icon>
                    <v-icon
                      v-else
                      color="disabled"
                      size="18"
                      :aria-label="`${f.titulo}: no incluido en ${p.name}`"
                    >
                      mdi-minus
                    </v-icon>
                  </td>
                </tr>
              </template>

              <!-- Límites: van al final porque se leen como números, no como marcas -->
              <tr class="cmp-grupo">
                <td :colspan="columnas.length + 1">Capacidad</td>
              </tr>
              <tr v-for="l in LIMITES" :key="l.titulo">
                <td class="cmp-col-nombre">
                  <div class="font-weight-medium">{{ l.titulo }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ l.detalle }}
                  </div>
                </td>
                <td
                  v-for="p in columnas"
                  :key="p.code"
                  class="cmp-celda text-body-2"
                  :class="{ 'cmp-col-plan--on': p.code === destacado }"
                >
                  {{ l.valor(p) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>

      <v-divider />

      <div
        class="d-flex flex-wrap align-center justify-space-between ga-3 pa-5"
      >
        <p class="text-caption text-medium-emphasis mb-0">
          Precios en pesos. Los acoplados facturan al 50 %.
        </p>
        <div class="d-flex ga-2">
          <v-btn variant="text" @click="abierto = false">Cerrar</v-btn>
          <v-btn color="primary" flat to="/auth/registro-empresa">
            Probar gratis 30 días
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
/* La tabla no se adapta a mobile achicándose: se desplaza. Una comparativa de
   cuatro columnas apretada en 360 px es ilegible; el scroll horizontal es la
   solución honesta, con la columna de nombres fija para no perder referencia. */
.cmp-scroll {
  overflow: auto;
  max-height: 62vh;
}

.cmp-tabla {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 0.875rem;

  th,
  td {
    padding: 10px 14px;
    border-bottom: 1px solid rgb(var(--v-theme-borderColor));
    vertical-align: middle;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 3;
    background: rgb(var(--v-theme-surface));
    text-align: center;
    padding-top: 14px;
    padding-bottom: 14px;
  }
}

.cmp-col-nombre {
  position: sticky;
  left: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
  text-align: left;
  min-width: 260px;
}

thead .cmp-col-nombre {
  z-index: 4;
}

.cmp-col-plan {
  min-width: 116px;
}

.cmp-celda {
  text-align: center;
}

/* Columna del plan desde el que se abrió el modal. */
.cmp-col-plan--on {
  background: rgba(var(--v-theme-primary), 0.06);
}

.cmp-grupo td {
  background: rgb(var(--v-theme-grey100));
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-textSecondary));
}
</style>
