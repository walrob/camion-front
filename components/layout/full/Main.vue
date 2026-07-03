<script setup lang="ts">
import { ref, shallowRef } from "vue";
import sidebarItems from "@/components/layout/full/vertical-sidebar/sidebarItem";
import { useDisplay, useTheme } from "vuetify";
import { Menu2Icon, MoonIcon, SunIcon } from "vue-tabler-icons";

const { smAndDown, smAndUp, lgAndUp } = useDisplay();
const sidebarMenu = shallowRef(sidebarItems);

const sDrawer = ref(false);
const drawerModel = computed({
  get: () => (lgAndUp.value ? true : sDrawer.value),
  set: (val: boolean) => {
    if (!lgAndUp.value) sDrawer.value = val;
  },
});

const theme = useTheme();
const { $api } = useNuxtApp();

import { useAuthStore } from "~/stores/auth";
import { Role } from "~/types/enums";
import CommandPalette from "~/components/shared/CommandPalette.vue";
const authStore = useAuthStore();
const user = useAuth();

// Accesos rápidos de alta desde el navbar (filtrados por rol). Llevan a la
// sección, donde la acción primaria queda visible en el PageHeader.
const quickCreate = [
  { title: "Nuevo viaje", to: "/admin/viajes", icon: "mdi-map-marker-path", roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER] },
  { title: "Reportar incidente", to: "/admin/incidentes", icon: "mdi-alert-outline", roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.MAINTENANCE] },
  { title: "Nuevo camión", to: "/admin/flota", icon: "mdi-truck-outline", roles: [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.MAINTENANCE] },
  { title: "Nuevo chofer", to: "/admin/choferes", icon: "mdi-account-plus-outline", roles: [Role.ADMIN, Role.DISPATCHER, Role.MANAGER, Role.HR] },
  { title: "Nuevo empleado", to: "/admin/rrhh", icon: "mdi-badge-account-outline", roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.DISPATCHER] },
  { title: "Generar rendición", to: "/admin/liquidaciones", icon: "mdi-file-document-plus-outline", roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR] },
];
const quickCreateItems = computed(() =>
  quickCreate.filter((x) => user?.role && x.roles.includes(user.role as Role)),
);

// El centro de alertas solo para roles operativos/gerenciales con acceso.
const canSeeAlerts = computed(
  () =>
    !!user?.role &&
    [Role.ADMIN, Role.MANAGER, Role.DISPATCHER, Role.HR].includes(user.role as Role),
);

const toggleTheme = async () => {
  const newTheme = theme.global.current.value.dark ? "FleetLight" : "FleetDark";
  theme.change(newTheme);
  try {
    const isDark = theme.global.name.value === "FleetDark";
    await $api.post("auth/change-dark", {
      dark: isDark,
    });
    authStore.updateAuth({
      ...authStore.user,
      isTemplateDark: isDark,
    });
  } catch (error) {
    console.log(error);
  }
};

const filterSidebarMenu = computed(() => {
  if (!user?.role) return [];
  const visible = sidebarMenu.value
    .filter((x) => !x.roles || x.roles.includes(user.role!))
    .filter((x) => !x.plan);
  // Descarta headers de secciones que quedaron sin ítems visibles para el rol,
  // para no mostrar títulos de sección huérfanos.
  return visible.filter((item, i) => {
    if (!item.header) return true;
    const next = visible[i + 1];
    return !!next && !next.header;
  });
});

const props = defineProps({
  topMargin: {
    type: String,
    default: "0px",
  },
});
</script>

<template>
  <!------Sidebar-------->
  <v-navigation-drawer
    v-model="drawerModel"
    left
    :permanent="lgAndUp"
    elevation="0"
    app
    class="leftSidebar"
    width="270"
    :style="{ top: topMargin }"
  >
    <div class="px-5 pt-5 text-center" @click="sDrawer = !sDrawer">
      <LayoutFullLogoHorizontal height="60" />
    </div>
    <div class="scrollnavbar">
      <v-list class="pa-6">
        <template v-for="(item, i) in filterSidebarMenu">
          <!---Item Sub Header -->
          <LayoutFullVerticalSidebarNavGroup
            :item="item"
            v-if="item.header"
            :key="item.title"
          />

          <!---If Has Child -->
          <LayoutFullVerticalSidebarNavCollapse
            class="leftPadding"
            :item="item"
            :level="0"
            v-else-if="item.children"
          />

          <!---Single Item-->
          <LayoutFullVerticalSidebarNavItem
            :item="item"
            v-else
            class="leftPadding"
          />
          <!---End Single Item-->
        </template>
      </v-list>
    </div>
  </v-navigation-drawer>
  <!------Header-------->
  <v-app-bar
    :height="smAndDown ? 60 : 70"
    scroll-behavior="elevate"
    :style="{ top: topMargin }"
  >
    <div class="d-flex align-center justify-space-between w-100">
      <div class="d-flex align-center">
        <v-btn
          class="hidden-lg-and-up ms-md-3 ms-sm-5 ms-3 text-muted"
          icon
          variant="flat"
          size="small"
          aria-label="Abrir menú"
          @click="sDrawer = !sDrawer"
        >
          <Menu2Icon size="20" stroke-width="1.5" />
        </v-btn>

        <v-menu v-if="quickCreateItems.length">
          <template #activator="{ props: menuProps }">
            <!-- Con texto en ≥sm, solo ícono en mobile -->
            <v-btn
              v-if="smAndUp"
              v-bind="menuProps"
              color="primary"
              variant="flat"
              prepend-icon="mdi-plus"
              append-icon="mdi-menu-down"
              class="ms-2 ms-lg-4"
            >
              Crear
            </v-btn>
            <v-btn
              v-else
              v-bind="menuProps"
              color="primary"
              variant="flat"
              icon="mdi-plus"
              size="small"
              aria-label="Crear"
              class="ms-1"
            />
          </template>
          <v-list density="compact" nav min-width="220">
            <v-list-item
              v-for="qc in quickCreateItems"
              :key="qc.to"
              :to="qc.to"
              :prepend-icon="qc.icon"
            >
              <v-list-item-title>{{ qc.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <CommandPalette />
      </div>
      <div class="d-flex align-center">
        <v-btn
          icon
          variant="text"
          class="custom-hover-primary mx-1 text-muted"
          aria-label="Cambiar tema"
          @click="toggleTheme"
        >
          <SunIcon
            v-if="theme.global.current.value.dark"
            stroke-width="1.5"
            size="22"
          />
          <MoonIcon v-else stroke-width="1.5" size="22" />
        </v-btn>
        <!-- Centro de alertas en tiempo real -->
        <LayoutFullVerticalHeaderNotificationDD v-if="canSeeAlerts" />
        <!-- User Profile -->
        <LayoutFullVerticalHeaderProfileDD />
      </div>
    </div>
  </v-app-bar>
</template>
