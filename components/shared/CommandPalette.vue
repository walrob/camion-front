<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, type Component } from "vue";
import { useDisplay } from "vuetify";
import { onKeyStroke, useDebounceFn } from "@vueuse/core";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import sidebarItems from "~/components/layout/full/vertical-sidebar/sidebarItem";
import {
  destinoDelItem,
  estaBloqueado,
  itemsVisiblesDelMenu,
} from "~/components/layout/full/vertical-sidebar/visibilidad";
import { accionesDeAltaVisibles } from "~/components/layout/full/vertical-sidebar/accionesDeAlta";
import {
  indexar,
  prepararConsulta,
  puntaje,
  type Indexado,
} from "~/components/shared/commandPalette/busqueda";
import {
  indiceDelManual,
  type SeccionDelManual,
} from "~/components/shared/commandPalette/manual";
import { Role } from "~/types/enums";
import { Feature } from "~/types/plan";
import type { PaginatedResponse } from "~/types/enums";
import type { Trip } from "~/types/trip";
import type { Driver, Truck } from "~/types/fleet";
import type { Employee } from "~/types/hr";

/**
 * Buscador global (Ctrl+K / ⌘K): acciones de alta, pantallas del menú,
 * registros del back y secciones del manual, en ese orden.
 *
 * Las acciones y las pantallas salen de las mismas fuentes que el menú «Crear»
 * y el menú lateral (`accionesDeAlta.ts`, `visibilidad.ts`), así que el
 * buscador nunca ofrece algo que el menú esconde, ni al revés.
 */

const router = useRouter();
const auth = useAuthStore();
const { has } = useFeatures();
const { $api } = useNuxtApp();
const { smAndUp, xs } = useDisplay();

const rol = computed(() => auth.user?.role ?? null);

const open = ref(false);
const query = ref("");
const activeIndex = ref(0);
const inputRef = ref<{ focus: () => void } | null>(null);

type Grupo = "Acciones" | "Ir a" | "Registros" | "Manual";

interface Resultado {
  key: string;
  group: Grupo;
  title: string;
  subtitle?: string;
  icon: string | Component;
  to: string;
  bloqueado?: boolean;
}

/** Resultado con su índice de búsqueda ya calculado. */
type Buscable = Resultado & { indice: Indexado };

// ── Acciones e Ir a ─────────────────────────────────────────────────────────

const acciones = computed<Buscable[]>(() =>
  accionesDeAltaVisibles(rol.value, has).map((a) => ({
    key: `accion:${a.to}`,
    group: "Acciones",
    title: a.title,
    icon: a.icon,
    to: a.to,
    indice: indexar(a.title, a.keywords),
  })),
);

const pantallas = computed<Buscable[]>(() =>
  itemsVisiblesDelMenu(sidebarItems, rol.value)
    .filter((i) => i.to && i.title)
    .map((i) => {
      const bloqueado = estaBloqueado(i, has);
      return {
        key: `ir:${i.to}`,
        group: "Ir a",
        title: i.title!,
        subtitle: bloqueado ? "No incluido en tu plan" : undefined,
        icon: i.icon,
        to: destinoDelItem(i, has)!,
        bloqueado,
        indice: indexar(i.title!, i.keywords),
      };
    }),
);

// ── Manual ──────────────────────────────────────────────────────────────────

const URL_MANUAL = "/docs/manual/manual.html";
const seccionesDelManual = ref<SeccionDelManual[]>([]);
let manualPedido = false;

/** Se baja una sola vez, la primera vez que se abre el buscador. */
const cargarManual = async () => {
  if (manualPedido) return;
  manualPedido = true;
  try {
    const html = await $fetch<string>(URL_MANUAL, { responseType: "text" });
    seccionesDelManual.value = indiceDelManual(html);
  } catch {
    // Sin manual el buscador sigue sirviendo; se reintenta al reabrir.
    manualPedido = false;
  }
};

const manual = computed<Buscable[]>(() =>
  seccionesDelManual.value.map((s) => ({
    key: `manual:${s.id}`,
    group: "Manual",
    title: s.titulo,
    subtitle: "Manual de usuario",
    icon: "mdi-book-open-page-variant-outline",
    to: `/manual-usuario?seccion=${encodeURIComponent(s.id)}`,
    indice: indexar(s.titulo, s.keywords),
  })),
);

// ── Registros (búsqueda en el back) ─────────────────────────────────────────

type Registro = { id: string };

interface Fuente<T extends Registro> {
  url: string;
  /** Los del `GET` de listado en el back. */
  roles: Role[];
  feature?: Feature;
  params?: Record<string, unknown>;
  mapear: (x: T) => Omit<Resultado, "group" | "key">;
}

const q = encodeURIComponent;
const nombre = (e?: Employee) => (e ? `${e.lastName}, ${e.firstName}` : "Chofer");

/** Cada fuente mapea su propio tipo; en la lista se guardan sin distinguirlo. */
const fuente = <T extends Registro>(f: Fuente<T>) => f as unknown as Fuente<Registro>;

const FUENTES = [
  fuente<Trip>({
    url: "trips/",
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.AUDITOR],
    mapear: (t: Trip) => ({
      title: t.code,
      subtitle: `Viaje · ${t.origin} → ${t.destination}`,
      icon: "mdi-map-marker-path",
      to: `/admin/viajes?buscar=${q(t.code)}`,
    }),
  }),
  fuente<Truck>({
    url: "trucks/",
    roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.MAINTENANCE],
    mapear: (t: Truck) => ({
      title: t.plate,
      subtitle: ["Camión", t.internalNumber && `Interno ${t.internalNumber}`, [t.brand, t.model].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(" · "),
      icon: "mdi-truck-outline",
      to: `/admin/flota?tab=trucks&buscar=${q(t.plate)}`,
    }),
  }),
  fuente<Driver>({
    url: "drivers/",
    roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.HR],
    mapear: (d: Driver) => ({
      title: nombre(d.employee),
      subtitle: ["Chofer", d.employee?.documentId && `DNI ${d.employee.documentId}`]
        .filter(Boolean)
        .join(" · "),
      icon: "mdi-steering",
      to: `/admin/choferes?buscar=${q(d.employee?.documentId || d.employee?.lastName || "")}`,
    }),
  }),
  fuente<Employee>({
    // Sin los choferes, que ya salen arriba: si no, cada chofer aparece dos veces.
    url: "hr/employees/",
    roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.DISPATCHER],
    feature: Feature.HR_BASIC,
    params: { withoutDriver: true },
    mapear: (e: Employee) => ({
      title: nombre(e),
      subtitle: ["Empleado", e.documentId && `DNI ${e.documentId}`].filter(Boolean).join(" · "),
      icon: "mdi-badge-account-outline",
      to: `/admin/rrhh/${e.id}`,
    }),
  }),
];

const fuentesVisibles = computed(() =>
  FUENTES.filter(
    (f) =>
      !!rol.value &&
      f.roles.includes(rol.value as Role) &&
      (!f.feature || has(f.feature)),
  ),
);

const registros = ref<Resultado[]>([]);
const buscandoRegistros = ref(false);
/**
 * Cada búsqueda lleva un número. Si mientras viaja la respuesta se escribió
 * otra cosa, el número cambió y la respuesta vieja se descarta: si no, una
 * consulta lenta pisaría los resultados de la última.
 */
let secuencia = 0;

const buscarRegistros = useDebounceFn(async (texto: string, seq: number) => {
  const fuentes = fuentesVisibles.value;
  // Cada tipo falla por su lado: si uno no responde, los otros se muestran.
  const respuestas = await Promise.allSettled(
    fuentes.map((f) =>
      $api.get<PaginatedResponse<Registro>>(f.url, {
        params: { search: texto, page: 1, limit: 5, ...f.params },
      }),
    ),
  );
  if (seq !== secuencia) return;
  registros.value = respuestas.flatMap((r, i) =>
    r.status === "fulfilled"
      ? (r.value.data?.items ?? []).slice(0, 5).map((x) => ({
          ...fuentes[i].mapear(x),
          key: `reg:${fuentes[i].url}${x.id}`,
          group: "Registros" as const,
        }))
      : [],
  );
  buscandoRegistros.value = false;
}, 300);

watch(query, (valor) => {
  const seq = ++secuencia;
  const texto = valor.trim();
  registros.value = [];
  activeIndex.value = 0;
  if (texto.length < 2 || !fuentesVisibles.value.length) {
    buscandoRegistros.value = false;
    return;
  }
  buscandoRegistros.value = true;
  buscarRegistros(texto, seq);
});

// ── Resultados ──────────────────────────────────────────────────────────────

const ordenar = (lista: Buscable[], consulta: ReturnType<typeof prepararConsulta>, max?: number) =>
  lista
    .map((r) => ({ r, s: puntaje(consulta, r.indice) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.r);

const filtered = computed<Resultado[]>(() => {
  const consulta = prepararConsulta(query.value);
  // Con el campo vacío: sólo lo que se usa sin buscar.
  if (!consulta.texto) return [...acciones.value, ...pantallas.value];
  return [
    ...ordenar(acciones.value, consulta),
    ...ordenar(pantallas.value, consulta),
    ...registros.value,
    ...ordenar(manual.value, consulta, 6),
  ];
});

// Si llegan o se van resultados, la selección no puede quedar afuera.
watch(
  () => filtered.value.length,
  (n) => {
    if (activeIndex.value >= n) activeIndex.value = 0;
  },
);

// ── Apertura, teclado y navegación ─────────────────────────────────────────

// Ctrl/⌘ + K abre/cierra el buscador desde cualquier pantalla.
onKeyStroke(["k", "K"], (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    open.value = !open.value;
  }
});

watch(open, (v) => {
  if (v) {
    query.value = "";
    activeIndex.value = 0;
    cargarManual();
  } else {
    // Una respuesta que llegue con el diálogo cerrado ya no le sirve a nadie.
    secuencia++;
    buscandoRegistros.value = false;
  }
});

/**
 * El diálogo queda montado después de la primera vez, así que `autofocus` sólo
 * funcionaría una vez: se enfoca cada vez que termina de abrir.
 */
const alAbrir = () => inputRef.value?.focus();

watch(activeIndex, (i) =>
  nextTick(() =>
    document.getElementById(`cp-item-${i}`)?.scrollIntoView({ block: "nearest" }),
  ),
);

const move = (dir: number) => {
  const n = filtered.value.length;
  if (!n) return;
  activeIndex.value = (activeIndex.value + dir + n) % n;
};

const go = (cmd?: Resultado) => {
  const target = cmd ?? filtered.value[activeIndex.value];
  if (!target) return;
  open.value = false;
  router.push(target.to);
};

const onKey = (e: KeyboardEvent) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    move(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    move(-1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    go();
  }
};

// Subheader solo en el primer ítem de cada grupo.
const showHeader = (i: number) =>
  i === 0 || filtered.value[i].group !== filtered.value[i - 1].group;

/** El atajo como se escribe en este sistema operativo. */
const esMac = ref(false);
onMounted(() => {
  esMac.value = /Mac|iPhone|iPad/i.test(
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ||
      navigator.platform ||
      navigator.userAgent,
  );
});
const atajo = computed(() => (esMac.value ? "⌘ K" : "Ctrl K"));
</script>

<template>
  <!-- Disparador: botón con texto en ≥sm, sólo la lupa en el celular -->
  <v-btn
    v-if="smAndUp"
    variant="tonal"
    color="medium-emphasis"
    class="text-none ms-2 ms-lg-4 px-3"
    height="40"
    @click="open = true"
  >
    <v-icon size="20" start>mdi-magnify</v-icon>
    <span class="text-medium-emphasis">Buscar</span>
    <v-chip
      size="x-small"
      variant="outlined"
      class="ms-3 d-none d-md-inline-flex"
      label
    >
      {{ atajo }}
    </v-chip>
  </v-btn>
  <IconBtn
    v-else
    tooltip="Buscar"
    icon="mdi-magnify"
    variant="text"
    size="small"
    class="ms-1"
    @click="open = true"
  />

  <!-- Anclado arriba y no centrado: así no salta cuando cambia la cantidad
       de resultados. En el celular, pantalla completa. -->
  <v-dialog
    v-model="open"
    max-width="600"
    :fullscreen="xs"
    class="command-palette"
    transition="fade-transition"
    @after-enter="alAbrir"
  >
    <v-card :rounded="xs ? 0 : 'lg'" class="d-flex flex-column command-palette__card">
      <div class="d-flex align-center">
        <VoiceTextField
          ref="inputRef"
          v-model="query"
          class="flex-grow-1"
          placeholder="Buscar pantallas, acciones, viajes, patentes, choferes…"
          variant="solo"
          flat
          hide-details
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          aria-label="Buscar"
          @keydown="onKey"
        />
        <v-btn
          v-if="xs"
          icon="mdi-close"
          variant="text"
          aria-label="Cerrar"
          class="me-1"
          @click="open = false"
        />
      </div>
      <v-divider />

      <div class="command-palette__resultados">
        <v-list v-if="filtered.length" density="comfortable" class="py-1">
          <template v-for="(cmd, i) in filtered" :key="cmd.key">
            <v-list-subheader
              v-if="showHeader(i)"
              class="text-uppercase text-caption font-weight-bold"
            >
              {{ cmd.group }}
            </v-list-subheader>
            <v-list-item
              :id="`cp-item-${i}`"
              :active="i === activeIndex"
              color="primary"
              :class="{ 'command-palette__bloqueado': cmd.bloqueado }"
              @click="go(cmd)"
              @mousemove="activeIndex = i"
            >
              <template #prepend>
                <v-icon v-if="typeof cmd.icon === 'string'" size="20" class="me-4">
                  {{ cmd.icon }}
                </v-icon>
                <component
                  :is="cmd.icon"
                  v-else
                  size="20"
                  stroke-width="1.5"
                  class="me-4"
                />
              </template>
              <v-list-item-title>{{ cmd.title }}</v-list-item-title>
              <v-list-item-subtitle v-if="cmd.subtitle">
                {{ cmd.subtitle }}
              </v-list-item-subtitle>
              <template v-if="cmd.bloqueado" #append>
                <v-icon size="16">mdi-lock-outline</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-list>

        <div
          v-if="buscandoRegistros"
          class="d-flex align-center ga-2 text-body-2 text-medium-emphasis px-4 py-3"
        >
          <v-progress-circular indeterminate size="16" width="2" />
          Buscando registros…
        </div>
        <div
          v-else-if="!filtered.length"
          class="text-center text-body-2 text-medium-emphasis py-8 px-4"
        >
          No encontramos nada para “{{ query.trim() }}”
        </div>
      </div>

      <v-divider />
      <div
        class="d-flex flex-wrap align-center ga-3 px-4 py-2 text-caption text-medium-emphasis"
      >
        <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Esc</kbd> cerrar</span>
        <span class="ms-auto"><kbd>{{ atajo }}</kbd> abre el buscador</span>
      </div>
    </v-card>
  </v-dialog>
</template>

<style>
/* Sin `scoped`: el diálogo se teletransporta fuera del componente. */
.command-palette.v-dialog:not(.v-dialog--fullscreen) {
  align-items: flex-start;
}
.command-palette.v-dialog:not(.v-dialog--fullscreen) > .v-overlay__content {
  margin-top: 10vh;
}
.command-palette__resultados {
  max-height: 60vh;
  overflow-y: auto;
}
.v-dialog--fullscreen .command-palette__card {
  height: 100%;
}
.v-dialog--fullscreen .command-palette__resultados {
  flex: 1 1 auto;
  max-height: none;
}
.command-palette__bloqueado {
  opacity: 0.6;
}
.command-palette kbd {
  font-family: inherit;
  font-size: 0.7rem;
  padding: 1px 5px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
</style>
