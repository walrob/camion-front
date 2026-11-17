<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

/**
 * «Copiar manual para IA»: copia el manual entero, en Markdown, para que el
 * usuario lo pegue en su propio ChatGPT, Gemini o Claude y le pregunte ahí.
 * No usa ninguna IA de CamioNex: costo cero.
 *
 * El archivo es `public/manual-camionex-ia.md`, que se genera desde
 * `docs/manual-usuario/manual.html` con `npm run manual:ia` (ver
 * scripts/manual-ia.mjs). No se edita a mano.
 *
 * Todo pasa en el cliente: `fetch` y el portapapeles sólo se tocan en
 * `onMounted` y en el clic, así que el componente es seguro también con SSR.
 */

const URL_MANUAL_IA = "/manual-camionex-ia.md";
const NOMBRE_ARCHIVO = "manual-camionex-ia.md";
/** Cuánto queda a la vista el «✓ Copiado». */
const DURACION_CONFIRMACION_MS = 2500;

const general = useGeneralStore();

const copiado = ref(false);
const copiando = ref(false);

let texto: string | null = null;
let pedido: Promise<string> | null = null;
let temporizador: ReturnType<typeof setTimeout> | undefined;

/**
 * Trae el manual una sola vez. `no-cache` revalida con el servidor: después de
 * un deploy con el manual actualizado, nadie copia la versión vieja.
 */
const traerManual = () => {
  pedido ??= fetch(URL_MANUAL_IA, { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then((t) => (texto = t))
    .catch((e) => {
      pedido = null; // que el próximo clic lo reintente
      throw e;
    });
  return pedido;
};

/**
 * Se pide apenas se monta: Safari y algunos Chrome descartan la escritura en
 * el portapapeles si entre el clic y `writeText` hubo una espera de red larga.
 * Con el texto ya en memoria, la copia sale en el mismo gesto del usuario.
 */
onMounted(() => {
  traerManual().catch(() => {});
});

onBeforeUnmount(() => clearTimeout(temporizador));

/** Respaldo para navegadores sin `navigator.clipboard` o sin contexto seguro (http). */
const copiarConTextarea = (t: string): boolean => {
  const area = document.createElement("textarea");
  area.value = t;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, t.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
};

const copiar = async () => {
  copiando.value = true;
  try {
    const t = texto ?? (await traerManual());

    let ok = false;
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(t);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) ok = copiarConTextarea(t);
    if (!ok) throw new Error("portapapeles");

    copiado.value = true;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (copiado.value = false), DURACION_CONFIRMACION_MS);
  } catch {
    general.setSnackbar({
      color: "error",
      message: "No se pudo copiar el manual. Usá «Descargar .md» y adjuntá el archivo en tu IA.",
    });
  } finally {
    copiando.value = false;
  }
};
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-2">
      <v-btn
        :color="copiado ? 'success' : 'primary'"
        variant="flat"
        class="text-none"
        :loading="copiando"
        @click="copiar"
      >
        <span aria-live="polite">
          {{ copiado ? "✓ Copiado. Pegalo en tu IA" : "📋 Copiar manual para IA" }}
        </span>
      </v-btn>

      <v-btn
        variant="outlined"
        color="primary"
        class="text-none"
        prepend-icon="mdi-download"
        :href="URL_MANUAL_IA"
        :download="NOMBRE_ARCHIVO"
      >
        Descargar .md
      </v-btn>
    </div>

    <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
      Pegalo en ChatGPT, Gemini o Claude y preguntale lo que necesites sobre camionex.
    </p>
  </div>
</template>
