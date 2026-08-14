<script setup lang="ts">
import { useRouter } from "vue-router";

/**
 * Layout del panel de plataforma.
 *
 * **Deliberadamente distinto del layout de cliente**: barra oscura y etiqueta
 * visible. Quien opera acá está viendo datos de todas las empresas y no puede
 * tener ninguna duda de dónde está parado — confundir este panel con el de un
 * cliente es cómo se cometen los errores caros.
 */
const auth = useAuthStore();
const router = useRouter();

const SECCIONES = [
  { texto: "Tablero", icono: "mdi-view-dashboard-outline", to: "/superadmin" },
  { texto: "Empresas", icono: "mdi-domain", to: "/superadmin/empresas" },
  { texto: "Planes", icono: "mdi-tag-multiple-outline", to: "/superadmin/planes" },
  { texto: "Cobranzas", icono: "mdi-cash-multiple", to: "/superadmin/cobranzas" },
  { texto: "Pagos", icono: "mdi-credit-card-check-outline", to: "/superadmin/pagos" },
  { texto: "Auditoría", icono: "mdi-clipboard-text-clock-outline", to: "/superadmin/auditoria" },
];

const salir = async () => {
  await auth.logout();
  router.push("/auth/login");
};
</script>

<template>
  <v-app>
    <v-app-bar flat height="60" color="grey-darken-4" theme="dark">
      <v-container class="d-flex align-center py-0" fluid>
        <v-icon class="mr-2">mdi-shield-crown-outline</v-icon>
        <span class="text-subtitle-1 font-weight-bold">FleetLog</span>
        <v-chip size="x-small" color="amber" variant="flat" class="ml-2">
          PLATAFORMA
        </v-chip>

        <v-spacer />

        <v-btn
          v-for="s in SECCIONES"
          :key="s.to"
          :to="s.to"
          variant="text"
          size="small"
          :prepend-icon="s.icono"
          class="d-none d-md-inline-flex"
        >
          {{ s.texto }}
        </v-btn>

        <v-divider vertical class="mx-3 d-none d-md-block" />

        <span class="text-caption mr-3 d-none d-sm-inline">
          {{ auth.user?.email }}
        </span>
        <v-btn icon size="small" variant="text" @click="salir">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main class="bg-surface">
      <v-container fluid class="pa-4 pa-md-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>
