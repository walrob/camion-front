<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";

/**
 * Manual de usuario.
 *
 * El contenido es HTML estático servido por Nitro desde `docs/manual-usuario`
 * (ver `nitro.publicAssets` en nuxt.config.ts). Se muestra en un `iframe` para
 * que sus estilos no se mezclen con los de Vuetify, y con un botón para abrirlo
 * en su propia pestaña: ahí Ctrl+P imprime el manual y no la aplicación.
 *
 * Sin `roles` a propósito: el manual lo puede leer cualquiera del backoffice.
 * El chofer no llega acá (el middleware lo devuelve a /chofer): su acceso es el
 * link del pie de su pantalla de inicio, que apunta al archivo directo.
 */
definePageMeta({ layout: "admin" });

useHead({ title: "Manual de usuario" });

const URL_MANUAL = "/docs/manual/manual.html";

/**
 * Sección pedida desde el buscador (Ctrl+K): `?seccion=<id>` lleva el marco a
 * esa ancla. Si el manual ya está cargado se scrollea adentro (mismo origen);
 * cambiar sólo el `#` del `src` no re-scrollea cuando se repite la sección.
 */
const marco = ref<HTMLIFrameElement | null>(null);
const src = ref(URL_MANUAL);
useAccionDeQuery("seccion", (id) => {
  const destino = marco.value?.contentDocument?.getElementById(id);
  if (destino) destino.scrollIntoView();
  else src.value = `${URL_MANUAL}#${encodeURIComponent(id)}`;
});
</script>

<template>
  <div>
    <PageHeader
      title="Manual de usuario"
      subtitle="Cómo se usa CamioNex, paso a paso, según tu rol"
    >
      <template #actions>
        <v-btn
          variant="text"
          color="primary"
          :href="URL_MANUAL"
          target="_blank"
          rel="noopener"
          prepend-icon="mdi-open-in-new"
          class="text-none"
        >
          Abrir en una pestaña nueva
        </v-btn>
      </template>
    </PageHeader>

    <v-card border flat rounded="lg" class="pa-2">
      <iframe
        ref="marco"
        :src="src"
        title="Manual de usuario de CamioNex"
        class="manual-frame"
      ></iframe>
    </v-card>
  </div>
</template>

<style scoped>
.manual-frame {
  display: block;
  width: 100%;
  /* Alto de la ventana menos el header de la app y el de la página: el manual
     es largo y conviene que scrollee dentro del marco, no la app entera. */
  height: calc(100vh - 230px);
  min-height: 480px;
  border: 0;
  border-radius: 6px;
  background: #ebeff6;
}
</style>
