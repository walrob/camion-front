<script setup lang="ts">
import { ref, shallowRef } from "vue";
import sidebarItems from "@/components/layout/full/vertical-sidebar/sidebarItem";
import { useDisplay, useTheme } from "vuetify";
import { Menu2Icon, MoonIcon, SunIcon } from "vue-tabler-icons";

const { smAndDown, lgAndUp } = useDisplay();
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
const authStore = useAuthStore();
const user = useAuth();

const toggleTheme = async () => {
  const newTheme = theme.global.current.value.dark
    ? "PurpleTheme"
    : "DarkTheme";
  theme.change(newTheme);
  try {
    const isDark = theme.global.name.value === "DarkTheme";
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
  const temp = sidebarMenu.value.filter(
    (x) => !x.roles || x.roles.includes(user.role!),
  );
  return temp.filter((x) => !x.plan);
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
      <div>
        <v-btn
          class="hidden-lg-and-up ms-md-3 ms-sm-5 ms-3 text-muted"
          icon
          variant="flat"
          size="small"
          @click="sDrawer = !sDrawer"
        >
          <Menu2Icon size="20" stroke-width="1.5" />
        </v-btn>
      </div>
      <div>
        <!-- <v-btn
          icon
          variant="text"
          class="custom-hover-primary mx-2 text-muted"
          @click="toggleTheme"
        >
          <SunIcon
            v-if="theme.global.current.value.dark"
            stroke-width="1.5"
            size="22"
          />
          <MoonIcon v-else stroke-width="1.5" size="22" />
        </v-btn> -->
        <!-- Notification -->
        <!-- <LayoutFullVerticalHeaderNotificationDD /> -->
        <!-- User Profile -->
        <LayoutFullVerticalHeaderProfileDD />
      </div>
    </div>
  </v-app-bar>
</template>
