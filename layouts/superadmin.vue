<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import { Menu2Icon, MoonIcon, SunIcon } from "vue-tabler-icons";
import superadminItems from "@/components/layout/full/vertical-sidebar/superadminItem";
import { useAuthStore } from "~/stores/auth";

/**
 * Layout del panel de plataforma.
 *
 * **Misma estructura que el backoffice del cliente**: sidebar a la izquierda,
 * app bar arriba y el mismo contenedor de contenido, dibujados con los mismos
 * `NavGroup` / `NavItem` y las mismas clases (`leftSidebar`, `scrollnavbar`,
 * `page-wrapper`). Quien opera la plataforma no tiene por qué aprender una
 * segunda interfaz, y todo arreglo de estilo del sidebar llega acá solo.
 *
 * Lo que **no** se comparte es la identidad. El rótulo bajo el logo y el chip
 * de la barra están para que no haya duda de que lo que se ve son datos de
 * todas las empresas: confundir este panel con el de un cliente es cómo se
 * cometen los errores caros. Antes eso se resolvía con una barra negra y sin
 * menú lateral; el aviso se conserva, el layout ajeno no.
 */
useHead({
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} | Plataforma` : "Plataforma CamioNex",
});

const auth = useAuthStore();
const router = useRouter();
const { smAndDown, lgAndUp } = useDisplay();
const menu = shallowRef(superadminItems);

// Mismo comportamiento que el sidebar del cliente: fijo en pantallas grandes,
// oculto detrás del botón en las chicas, y la preferencia se recuerda. Clave
// propia para no pisar la del backoffice, que es otra sesión de trabajo.
const sDrawer = ref(false);
const desktopOpen = ref(true);
onMounted(() => {
  const guardado = localStorage.getItem("superadminSidebarOpen");
  if (guardado !== null) desktopOpen.value = guardado === "true";
});
watch(desktopOpen, (v) => localStorage.setItem("superadminSidebarOpen", String(v)));

const drawerModel = computed({
  get: () => (lgAndUp.value ? desktopOpen.value : sDrawer.value),
  set: (v: boolean) => {
    if (lgAndUp.value) desktopOpen.value = v;
    else sDrawer.value = v;
  },
});
const toggleSidebar = () => (drawerModel.value = !drawerModel.value);

// El tema sale de la preferencia del usuario, igual que en el layout de admin:
// quien tiene el backoffice en oscuro espera encontrar esto igual.
const theme = useTheme();
theme.change(auth.user?.isTemplateDark ? "FleetDark" : "FleetLight");

// Mismo comportamiento que en el backoffice: la preferencia se guarda en el
// perfil, así el panel abre como lo dejaste la última vez.
const { $api } = useNuxtApp();
const alternarTema = async () => {
  theme.change(theme.global.current.value.dark ? "FleetLight" : "FleetDark");
  try {
    const oscuro = theme.global.name.value === "FleetDark";
    await $api.post("auth/change-dark", { dark: oscuro });
    auth.updateAuth({ ...auth.user, isTemplateDark: oscuro });
  } catch {
    // Que no se pueda guardar la preferencia no invalida el cambio en pantalla.
  }
};

const salir = async () => {
  await auth.logout();
  router.push("/auth/login");
};
</script>

<template>
  <v-locale-provider>
    <v-app>
      <!------Sidebar-------->
      <v-navigation-drawer
        v-model="drawerModel"
        left
        :permanent="lgAndUp && desktopOpen"
        elevation="0"
        app
        class="leftSidebar"
        width="270"
      >
        <div class="px-5 pt-5 text-center">
          <LayoutFullLogoHorizontal height="60" />
          <!-- El rótulo va bajo el logo, donde se mira al orientarse. -->
          <v-chip
            size="x-small"
            color="warning"
            variant="flat"
            class="mt-2 font-weight-bold"
            prepend-icon="mdi-shield-crown-outline"
          >
            PLATAFORMA
          </v-chip>
        </div>

        <div class="scrollnavbar">
          <v-list class="pa-6">
            <template v-for="item in menu">
              <LayoutFullVerticalSidebarNavGroup
                v-if="item.header"
                :key="item.header"
                :item="item"
              />
              <LayoutFullVerticalSidebarNavItem
                v-else
                :key="item.to"
                :item="item"
                class="leftPadding"
              />
            </template>
          </v-list>
        </div>
      </v-navigation-drawer>

      <!------Header-------->
      <v-app-bar :height="smAndDown ? 60 : 70" scroll-behavior="elevate">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center">
            <v-btn
              class="ms-md-3 ms-sm-5 ms-3 text-muted"
              icon
              variant="flat"
              size="small"
              :aria-label="drawerModel ? 'Ocultar menú' : 'Mostrar menú'"
              @click="toggleSidebar"
            >
              <Menu2Icon size="20" stroke-width="1.5" />
            </v-btn>

            <v-chip
              size="small"
              color="warning"
              variant="tonal"
              class="ms-2 ms-lg-4 font-weight-bold"
              prepend-icon="mdi-shield-crown-outline"
            >
              Panel de plataforma
            </v-chip>
          </div>

          <div class="d-flex align-center">
            <span class="text-caption text-medium-emphasis me-3 d-none d-sm-inline">
              {{ auth.user?.email }}
            </span>
            <v-btn
              icon
              variant="text"
              class="mx-1 text-muted"
              aria-label="Cambiar tema"
              @click="alternarTema"
            >
              <SunIcon v-if="theme.global.current.value.dark" stroke-width="1.5" size="22" />
              <MoonIcon v-else stroke-width="1.5" size="22" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              class="me-2 text-muted"
              aria-label="Cerrar sesión"
              @click="salir"
            >
              <v-icon>mdi-logout</v-icon>
            </v-btn>
          </div>
        </div>
      </v-app-bar>

      <v-main>
        <v-container fluid class="page-wrapper">
          <div class="maxWidth">
            <slot />
          </div>
        </v-container>
      </v-main>
    </v-app>
  </v-locale-provider>
</template>
