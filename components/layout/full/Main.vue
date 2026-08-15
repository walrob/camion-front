<script setup lang="ts">
import { ref, shallowRef } from "vue";
import sidebarItems, {
  type menu,
} from "@/components/layout/full/vertical-sidebar/sidebarItem";
import { useDisplay, useTheme } from "vuetify";
import { Menu2Icon, MoonIcon, SunIcon } from "vue-tabler-icons";

const { smAndDown, smAndUp, lgAndUp } = useDisplay();
const sidebarMenu = shallowRef(sidebarItems);

const sDrawer = ref(false);
// En pantallas grandes el sidebar es fijo pero se puede ocultar/mostrar.
// La preferencia se recuerda entre sesiones.
const desktopOpen = ref(true);
onMounted(() => {
  const saved = localStorage.getItem("sidebarOpen");
  if (saved !== null) desktopOpen.value = saved === "true";
});
watch(desktopOpen, (val) => {
  localStorage.setItem("sidebarOpen", String(val));
});

const drawerModel = computed({
  get: () => (lgAndUp.value ? desktopOpen.value : sDrawer.value),
  set: (val: boolean) => {
    if (lgAndUp.value) desktopOpen.value = val;
    else sDrawer.value = val;
  },
});

// Alterna el menú según el tamaño de pantalla.
const toggleSidebar = () => {
  if (lgAndUp.value) desktopOpen.value = !desktopOpen.value;
  else sDrawer.value = !sDrawer.value;
};

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

/**
 * Aviso de estado comercial sobre el ítem «Mi plan».
 *
 * Una cuenta en mora o con la prueba por vencer se arregla en dos clics, pero
 * sólo si alguien se entera: el chip es lo que convierte el ítem de menú en un
 * recordatorio. Con la cuenta al día no muestra nada, para no gritar sin motivo.
 */
const chipDelPlan = computed<Pick<menu, "chip" | "chipColor"> | null>(() => {
  const company = authStore.company;
  if (!company) return null;

  if (company.status === "defaulter")
    return { chip: "Pago pendiente", chipColor: "warning" };
  if (company.status === "blocked")
    return { chip: "Suspendida", chipColor: "error" };

  if (company.status === "trial" && company.trialEndsAt) {
    const dias = Math.max(
      0,
      Math.ceil((new Date(company.trialEndsAt).getTime() - Date.now()) / 86_400_000),
    );
    // Antes de la última semana el aviso es ruido: la prueba recién empieza.
    if (dias <= 7) return { chip: `${dias} d de prueba`, chipColor: "info" };
  }

  return null;
});

const filterSidebarMenu = computed(() => {
  if (!user?.role) return [];
  // Sólo se filtra por ROL. Los ítems que el plan no incluye **no se ocultan**:
  // los muestra `NavItem` en gris con candado y llevan a la pantalla de upgrade.
  // Es una decisión comercial explícita (MODELO-COMERCIAL §6.2): el cliente
  // tiene que ver todos los días lo que le falta.
  const visible = sidebarMenu.value.filter(
    (x) => !x.roles || x.roles.includes(user.role!),
  );
  // Descarta headers de secciones que quedaron sin ítems visibles para el rol,
  // para no mostrar títulos de sección huérfanos.
  const conSeccionesLlenas = visible.filter((item, i) => {
    if (!item.header) return true;
    const next = visible[i + 1];
    return !!next && !next.header;
  });

  // El chip de «Mi plan» depende del estado de la cuenta, que es dinámico: se
  // agrega acá y no en `sidebarItem.ts`, que es una constante.
  const chip = chipDelPlan.value;
  if (!chip) return conSeccionesLlenas;
  return conSeccionesLlenas.map((item) =>
    item.to === "/estado-plan" ? { ...item, ...chip } : item,
  );
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
    :permanent="lgAndUp && desktopOpen"
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
          class="ms-md-3 ms-sm-5 ms-3 text-muted"
          icon
          variant="flat"
          size="small"
          :aria-label="drawerModel ? 'Ocultar menú' : 'Mostrar menú'"
          @click="toggleSidebar"
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
