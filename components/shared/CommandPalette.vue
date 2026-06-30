<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useDisplay } from "vuetify";
import { onKeyStroke } from "@vueuse/core";
import sidebarItems from "~/components/layout/full/vertical-sidebar/sidebarItem";
import { Role } from "~/types/enums";

const router = useRouter();
const user = useAuth();
const { smAndUp } = useDisplay();

const open = ref(false);
const query = ref("");
const activeIndex = ref(0);
const inputRef = ref<any>(null);

interface Cmd {
  title: string;
  to: string;
  group: string;
  icon: string;
  roles?: string[];
}

// Navegación: se deriva del mismo menú lateral (fuente única de verdad).
const navCommands = computed<Cmd[]>(() =>
  sidebarItems
    .filter((i) => i.to && i.title)
    .map((i) => ({
      title: i.title as string,
      to: i.to as string,
      group: "Ir a",
      icon: "mdi-arrow-right-thin",
      roles: i.roles,
    })),
);

// Acciones de alta rápidas (mismas que el menú "Crear").
const createCommands: Cmd[] = [
  { title: "Nuevo viaje", to: "/admin/viajes", group: "Crear", icon: "mdi-plus", roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER] },
  { title: "Reportar incidente", to: "/admin/incidentes", group: "Crear", icon: "mdi-plus", roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.MAINTENANCE] },
  { title: "Nuevo camión", to: "/admin/flota", group: "Crear", icon: "mdi-plus", roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.MAINTENANCE] },
  { title: "Nuevo chofer", to: "/admin/choferes", group: "Crear", icon: "mdi-plus", roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.HR] },
  { title: "Nuevo empleado", to: "/admin/rrhh", group: "Crear", icon: "mdi-plus", roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.DISPATCHER] },
  { title: "Generar liquidación", to: "/admin/liquidaciones", group: "Crear", icon: "mdi-plus", roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR] },
];

const all = computed<Cmd[]>(() =>
  [...navCommands.value, ...createCommands].filter(
    (c) => !c.roles || (user?.role && c.roles.includes(user.role)),
  ),
);

const filtered = computed<Cmd[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return all.value;
  return all.value.filter((c) => c.title.toLowerCase().includes(q));
});

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
    nextTick(() => inputRef.value?.focus?.());
  }
});
watch(filtered, () => (activeIndex.value = 0));

const move = (dir: number) => {
  const n = filtered.value.length;
  if (!n) return;
  activeIndex.value = (activeIndex.value + dir + n) % n;
};

const go = (cmd?: Cmd) => {
  const target = cmd ?? filtered.value[activeIndex.value];
  if (!target) return;
  open.value = false;
  router.push(target.to);
};

// Subheader solo en el primer ítem de cada grupo.
const showHeader = (i: number) =>
  i === 0 || filtered.value[i].group !== filtered.value[i - 1].group;
</script>

<template>
  <!-- Disparador: barra de búsqueda en ≥sm, ícono en mobile -->
  <v-btn
    v-if="smAndUp"
    variant="tonal"
    color="medium-emphasis"
    class="text-none ms-2 ms-lg-4 px-3"
    height="40"
    @click="open = true"
  >
    <v-icon size="20" start>mdi-magnify</v-icon>
    <span class="text-medium-emphasis">Buscar o ir a…</span>
    <v-chip
      size="x-small"
      variant="outlined"
      class="ms-3 d-none d-md-inline-flex"
      label
    >
      Ctrl K
    </v-chip>
  </v-btn>
  <v-btn
    v-else
    icon="mdi-magnify"
    variant="text"
    size="small"
    class="ms-1"
    aria-label="Buscar"
    @click="open = true"
  />

  <v-dialog v-model="open" max-width="560" transition="fade-transition">
    <v-card rounded="lg">
      <v-text-field
        ref="inputRef"
        v-model="query"
        placeholder="Buscar sección o acción…"
        variant="solo"
        flat
        hide-details
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        autofocus
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="go()"
        @keydown.esc="open = false"
      />
      <v-divider />

      <v-list v-if="filtered.length" density="comfortable" max-height="420" style="overflow-y: auto">
        <template v-for="(cmd, i) in filtered" :key="cmd.group + cmd.to + cmd.title">
          <v-list-subheader v-if="showHeader(i)" class="text-uppercase text-caption font-weight-bold">
            {{ cmd.group }}
          </v-list-subheader>
          <v-list-item
            :active="i === activeIndex"
            color="primary"
            :prepend-icon="cmd.icon"
            @click="go(cmd)"
            @mousemove="activeIndex = i"
          >
            <v-list-item-title>{{ cmd.title }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>

      <div v-else class="text-center text-body-2 text-medium-emphasis py-8">
        Sin resultados para “{{ query }}”
      </div>
    </v-card>
  </v-dialog>
</template>
