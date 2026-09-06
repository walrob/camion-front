<script setup lang="ts">
/**
 * Página de error.
 *
 * `noindex` es lo importante para el buscador: una 404 (o una 500) no debe
 * entrar al índice, y menos con el título de la marca al lado. Sin esto, cada
 * URL rota que alguien enlace termina como un resultado vacío compitiendo con
 * la landing.
 *
 * Los enlaces de salida no son decoración: una 404 sin salida hace que el
 * visitante vuelva al buscador, que es exactamente la señal que no se quiere dar.
 */
/**
 * Las imágenes de `public/` se referencian por variable y con `:src`, no con
 * `src="/..."` literal.
 *
 * Con la ruta literal, el compilador de plantillas la convierte en un import y
 * Nuxt la reescribe al id virtual `virtual:public?/images/...`. Ese id lleva un
 * `?`, y al resolverlo en SSR el dev server lo pide por HTTP contra
 * `/__nuxt_vite_node__/resolve/…%3F…`, que devuelve 400. Como este archivo entra
 * en el bundle SSR de toda la app, el fallo se llevaba puesta cualquier página.
 *
 * Con `:src` la ruta queda como string en runtime: el navegador la pide a
 * `public/` y no hay resolución de módulo que pueda fallar.
 */
const imagenError = "/images/background/errorimg.svg";

const props = defineProps<{ error?: { statusCode?: number } }>();

const esNoEncontrada = computed(() => props.error?.statusCode === 404);

useHead({
  title: computed(() =>
    esNoEncontrada.value ? "Página no encontrada" : "Algo salió mal",
  ),
  meta: [{ name: "robots", content: "noindex, follow" }],
});
</script>

<template>
  <div class="d-flex justify-center align-center text-center h-100vh pa-4">
    <div>
      <img
        :src="imagenError"
        width="500"
        class="mx-auto"
        style="max-width: 100%; height: auto"
        alt=""
      />

      <h1 class="text-h4 text-md-h3 pt-3">
        {{ esNoEncontrada ? "Esta página no existe" : "Algo salió mal" }}
      </h1>

      <p class="text-body-1 text-medium-emphasis my-6">
        {{
          esNoEncontrada
            ? "El enlace puede estar mal escrito o la página haberse movido."
            : "Ya estamos al tanto. Probá de nuevo en un momento."
        }}
      </p>

      <div class="d-flex flex-wrap justify-center ga-3 mb-4">
        <v-btn flat color="primary" to="/">Ir al inicio</v-btn>
        <v-btn variant="outlined" to="/auth/login">Ingresar al sistema</v-btn>
      </div>
    </div>
  </div>
</template>
