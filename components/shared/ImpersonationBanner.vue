<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

/**
 * Aviso permanente de que se está viendo la cuenta de un cliente.
 *
 * Va fijo arriba de todo y no se puede cerrar: alguien que olvida que está
 * suplantando a un cliente puede leer datos ajenos creyendo que son propios, o
 * dar por hecho que algo no funciona cuando en realidad no tiene permiso de
 * escritura. El backend además rechaza toda escritura; esto es para que la
 * persona lo sepa antes de intentarlo.
 *
 * Es un `v-system-bar`, no un `v-alert` pegado arriba: así entra en el sistema
 * de layout de Vuetify y el app bar, el drawer y el contenido se corren solos.
 * Como alerta suelta se dibujaba *encima* del app bar y en el celular, donde
 * el texto ocupa tres líneas, tapaba la hamburguesa: no había forma de abrir
 * el menú.
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
        // En 12 h el locale devuelve "06:31 p. m." y el punto final chocaba
        // con el de la frase.
        hour12: false,
      })
    : "",
);

/**
 * Vuelve a la sesión del superadmin, a la ficha desde la que entró. Si esa
 * sesión ya no existe (venció mientras daba soporte), no queda otra que
 * loguearse de nuevo.
 */
const salir = async () => {
  const volverA = await auth.salirDeSoporte();
  await router.push(volverA ?? "/auth/login");
};

/**
 * Alto real del contenido. El layout de Vuetify necesita un número para
 * calcular cuánto correr lo demás, y el texto se parte en más líneas cuanto más
 * angosta es la pantalla: se mide en vez de adivinar.
 */
const contenido = ref<HTMLElement | null>(null);
const alto = ref(40);
let observer: ResizeObserver | null = null;
watch(contenido, (el) => {
  observer?.disconnect();
  observer = null;
  if (!el) return;
  // `offsetHeight` y no `contentRect`: éste descuenta el padding y el bar
  // quedaría 12px más bajo que su contenido.
  observer = new ResizeObserver(() => {
    alto.value = Math.ceil(el.offsetHeight);
  });
  observer.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <!-- `order="-1"`: va antes que el app bar y el drawer, a todo el ancho. -->
  <v-system-bar
    v-if="datos"
    color="warning"
    order="-1"
    :height="alto"
    class="impersonation-banner"
  >
    <div ref="contenido" class="impersonation-banner__contenido">
      <v-icon size="18">mdi-eye-outline</v-icon>
      <!-- Corto a propósito: en el celular cada palabra de más es una línea
           más de banner que le roba pantalla al contenido. -->
      <span class="impersonation-banner__texto">
        Modo soporte en <strong>{{ datos.empresa }}</strong>:
        <strong>solo lectura</strong><template v-if="hora">, hasta las {{ hora }}</template>.
      </span>
      <v-btn size="small" variant="outlined" @click="salir">Salir</v-btn>
    </div>
  </v-system-bar>
</template>

<style scoped>
/* El system bar viene pensado para una línea chica alineada a la derecha;
   acá lleva una frase que puede partirse y un botón. */
.impersonation-banner {
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  text-align: start;
}
.impersonation-banner__contenido {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
}
.impersonation-banner__texto {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
