<script setup lang="ts">
import { computed } from "vue";
import sidebarItem from "~/components/layout/full/vertical-sidebar/sidebarItem";

interface Crumb {
  title: string;
  to?: string;
  disabled?: boolean;
}

const props = defineProps<{
  /** Título principal de la página. */
  title: string;
  /** Texto de apoyo opcional debajo del título. */
  subtitle?: string;
  /**
   * Migas de pan. Si se omite, se arman solas a partir del menú lateral para
   * que el hilo coincida con lo que el usuario ve en el sidebar:
   * "Panel → {sección} → {ítem} → {title}". La raíz es el Panel (`/admin`),
   * nunca la landing: quien está acá ya entró al sistema.
   */
  breadcrumbs?: Crumb[];
}>();

const route = useRoute();

const PANEL: Crumb = { title: "Panel", to: "/admin" };

/**
 * Ubica la ruta actual en el menú lateral: el ítem cuyo `to` es la ruta o su
 * prefijo más largo (así `/admin/rrhh/123` cae en RRHH), y la sección
 * (`header`) que lo contiene.
 */
const locate = (path: string) => {
  let section: string | undefined;
  let best: { title: string; to: string; section?: string } | undefined;
  for (const it of sidebarItem) {
    if (it.header) {
      section = it.header;
      continue;
    }
    if (!it.to || !it.title) continue;
    const matches = path === it.to || path.startsWith(`${it.to}/`);
    if (matches && (!best || it.to.length > best.to.length)) {
      best = { title: it.title, to: it.to, section };
    }
  }
  return best;
};

const autoCrumbs = computed<Crumb[]>(() => {
  const path = route.path;
  const here = locate(path);

  // El Panel es la raíz: no se apunta a sí mismo.
  if (here?.to === PANEL.to) return [{ title: props.title, disabled: true }];

  const items: Crumb[] = [PANEL];
  if (here) {
    // "Inicio" es la sección del propio Panel; repetirla no aporta.
    if (here.section && here.section !== "Inicio") {
      items.push({ title: here.section, disabled: true });
    }
    // En una pantalla hija (detalle) el ítem del menú es un eslabón clickeable.
    if (path !== here.to) items.push({ title: here.title, to: here.to });
  }
  items.push({ title: props.title, disabled: true });
  return items;
});

const crumbs = computed<Crumb[]>(() => props.breadcrumbs ?? autoCrumbs.value);
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
    <div style="min-width: 0">
      <v-breadcrumbs
        :items="crumbs"
        density="compact"
        class="pa-0 mb-1 text-caption text-medium-emphasis"
      >
        <template #divider>
          <v-icon size="14">mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>

      <h1 class="text-h5 font-weight-bold">{{ title }}</h1>

      <p v-if="subtitle" class="text-body-2 text-medium-emphasis ma-0 mt-1">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="d-flex flex-wrap align-center ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>
