<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

/**
 * Aviso permanente de que se está viendo la cuenta de un cliente.
 *
 * Va fijo arriba de todo y no se puede cerrar: alguien que olvida que está
 * suplantando a un cliente puede leer datos ajenos creyendo que son propios, o
 * dar por hecho que algo no funciona cuando en realidad no tiene permiso de
 * escritura. El backend además rechaza toda escritura; esto es para que la
 * persona lo sepa antes de intentarlo.
 */
const auth = useAuthStore();
const router = useRouter();

/** El token declara la suplantación; se lee de ahí, no del estado local. */
const datos = computed(() => {
  if (!auth.token) return null;
  try {
    const payload = JSON.parse(
      atob(auth.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (!payload?.impersonating) return null;
    return {
      empresa: auth.company?.name ?? "",
      expira: payload.exp ? new Date(payload.exp * 1000) : null,
    };
  } catch {
    return null;
  }
});

const hora = computed(() =>
  datos.value?.expira
    ? datos.value.expira.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
);

const salir = async () => {
  await auth.logout();
  router.push("/auth/login");
};
</script>

<template>
  <v-alert
    v-if="datos"
    type="warning"
    variant="flat"
    density="compact"
    rounded="0"
    class="impersonation-banner"
  >
    <div class="d-flex align-center flex-wrap ga-2">
      <v-icon size="18">mdi-eye-outline</v-icon>
      <span class="text-body-2">
        Estás viendo la cuenta de <strong>{{ datos.empresa }}</strong> en modo
        soporte: <strong>solo lectura</strong>.
        <template v-if="hora">La sesión vence a las {{ hora }}.</template>
      </span>
      <v-spacer />
      <v-btn size="x-small" variant="tonal" @click="salir">Salir</v-btn>
    </div>
  </v-alert>
</template>

<style scoped>
/* Fijo arriba de todo: no puede quedar tapado ni perderse al hacer scroll. */
.impersonation-banner {
  position: sticky;
  top: 0;
  z-index: 2000;
}
</style>
