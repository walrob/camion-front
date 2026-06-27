<script setup lang="ts">
import { computed } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useAuthStore } from "~/stores/auth";
import { returnUrlImg } from "~/composables/functions";
import { Role } from "~/types/enums";
import { useDisplay } from "vuetify";

const { mdAndUp } = useDisplay();
const user = useAuth();
const authStore = useAuthStore();

const isAuthenticated = computed(() => !!authStore.token);

const showUserName = computed(() => mdAndUp && user?.name);

const logout = async () => {
  authStore.clearAuth();
  navigateTo("/auth/login");
};
</script>

<template>
  <v-menu>
    <!-- ACTIVATOR -->
    <template #activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" variant="text" class="d-flex align-center">
        <template v-if="user">
          <v-avatar size="35">
            <v-img v-if="user?.avatar" :src="returnUrlImg(user.avatar)" />
            <img v-else src="/images/avatar-1.png" height="35" />
          </v-avatar>

          <span v-if="showUserName" class="ml-2 text-body-1">
            {{ user.name }}
          </span>
        </template>

        <template v-else>
          <v-icon>mdi-account</v-icon>
        </template>
      </v-btn>
    </template>

    <!-- MENU -->
    <v-list density="compact">
      <template v-if="isAuthenticated">
        <v-list-item to="/mi-cuenta">
          <v-list-item-title>Mi Perfil</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="user.role === Role.ADMIN" to="/admin">
          <v-list-item-title>Administración</v-list-item-title>
        </v-list-item>

        <v-list-item to="/mi-cuenta/compras">
          <v-list-item-title>Mis compras</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <v-list-item @click="logout">
          <v-list-item-title>Cerrar sesión</v-list-item-title>
        </v-list-item>
      </template>

      <template v-else>
        <v-list-item to="/auth/login">
          <v-list-item-title>Iniciar sesión</v-list-item-title>
        </v-list-item>
        <v-list-item to="/auth/register">
          <v-list-item-title>Registrarse</v-list-item-title>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>
