<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { CONTACTO } from "~/composables/useContacto";
import { PAGINAS_PUBLICAS } from "~~/seo/paginas";

/**
 * Layout de las páginas públicas: landing, planes, contacto y legales.
 *
 * A propósito **no** carga el sidebar, los sockets ni los stores del
 * backoffice: un visitante anónimo no debería descargar el bundle del sistema
 * de gestión sólo para leer los precios (riesgo R7.4).
 */
const auth = useAuthStore();

/** Si ya hay sesión, se ofrece entrar al panel en vez de "Ingresar". */
const autenticado = computed(() => !!auth.token);
const destinoPanel = computed(() => auth.paginaDeInicio);

/**
 * La barra arranca transparente sobre la portada —el azul del hero llega hasta
 * el borde de arriba— y se vuelve sólida apenas se scrollea, porque más abajo
 * las secciones son claras y el logo de la barra es la variante blanca.
 */
const route = useRoute();
const arriba = ref(true);

function alScrollear() {
  arriba.value = window.scrollY < 24;
}

onMounted(() => {
  alScrollear();
  window.addEventListener("scroll", alScrollear, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener("scroll", alScrollear));

const barraTransparente = computed(() => route.path === "/" && arriba.value);

/** Redes de NorthAr Consulting, en el pie. */
const REDES = [
  { icono: "mdi-whatsapp", titulo: "WhatsApp", url: CONTACTO.whatsappUrl },
  { icono: "mdi-linkedin", titulo: "LinkedIn", url: CONTACTO.linkedin },
  { icono: "mdi-instagram", titulo: "Instagram", url: CONTACTO.instagram },
];

const SECCIONES = [
  { texto: "Cómo funciona", ancla: "#producto" },
  { texto: "Planes", ancla: "#planes" },
  { texto: "Preguntas", ancla: "#faq" },
  { texto: "Contacto", ancla: "#contacto" },
];

/**
 * Páginas temáticas, para la columna "Recursos" del pie.
 *
 * Salen del registro y no de una lista escrita acá: una página que está en el
 * sitemap pero a la que no apunta ningún enlace interno es una página huérfana
 * —se rastrea tarde y se posiciona peor—, y el pie es lo único que aparece en
 * todas las páginas del sitio. Al agregar una entrada con `enlacePie` en
 * `seo/paginas.ts`, el enlace aparece solo.
 */
const RECURSOS = PAGINAS_PUBLICAS.filter((p) => p.enlacePie);

useHead({
  titleTemplate: (t?: string) => (t ? `${t} | CamioNex` : "CamioNex"),
});
</script>

<template>
  <v-app>
    <v-app-bar
      flat
      height="68"
      class="px-2 lp-topbar"
      :class="{ 'lp-topbar--transparente': barraTransparente }"
    >
      <v-container class="d-flex align-center py-0">
        <NuxtLink to="/" class="d-flex align-center text-decoration-none">
          <LayoutFullLogoHorizontal light :height="34" />
        </NuxtLink>

        <v-spacer />

        <div class="d-none d-md-flex align-center ga-1 mr-4">
          <v-btn
            v-for="s in SECCIONES"
            :key="s.ancla"
            :href="s.ancla"
            variant="text"
            size="small"
          >
            {{ s.texto }}
          </v-btn>
        </div>

        <!--
          Dentro de `ClientOnly` porque la sesión vive en el dispositivo: el
          servidor siempre renderiza la variante anónima y el cliente, si hay
          token, la reemplaza. Sin esto habría desajuste de hidratación en las
          páginas pre-renderizadas.

          El `fallback` no es un placeholder vacío a propósito: es el marcado que
          queda en el HTML estático, y por lo tanto el que ven el buscador y el
          visitante anónimo, que son casi todos. La llamada a la acción viaja en
          el HTML, no aparece después de que corra el JavaScript.
        -->
        <ClientOnly>
          <template v-if="autenticado">
            <v-btn color="primary" flat :to="destinoPanel">Ir al panel</v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" to="/auth/login" class="mr-1">Ingresar</v-btn>
            <v-btn color="primary" flat to="/auth/registro-empresa">
              Probar gratis
            </v-btn>
          </template>

          <template #fallback>
            <v-btn variant="text" to="/auth/login" class="mr-1">Ingresar</v-btn>
            <v-btn color="primary" flat to="/auth/registro-empresa">
              Probar gratis
            </v-btn>
          </template>
        </ClientOnly>
      </v-container>
    </v-app-bar>

    <v-main class="lp-main">
      <slot />
    </v-main>

    <v-footer class="lp-footer py-8">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <LayoutFullLogoHorizontal light :height="34" />
            <p class="text-body-2 text-medium-emphasis mt-3 mb-3">
              Gestión de flotas para empresas de transporte de carga. Reemplazá
              el cuaderno, el Excel y los grupos de WhatsApp.
            </p>

            <div class="d-flex ga-1">
              <v-btn
                v-for="r in REDES"
                :key="r.url"
                :href="r.url"
                :icon="r.icono"
                :title="r.titulo"
                :aria-label="r.titulo"
                target="_blank"
                rel="noopener"
                variant="text"
                density="comfortable"
                size="small"
              />
            </div>
          </v-col>

          <v-col cols="6" md="2">
            <div class="text-subtitle-2 font-weight-medium mb-2">Producto</div>
            <div class="d-flex flex-column ga-1">
              <a href="#modulos" class="text-body-2 text-medium-emphasis">
                Cómo funciona
              </a>
              <a href="#planes" class="text-body-2 text-medium-emphasis">
                Planes y precios
              </a>
              <NuxtLink
                to="/auth/registro-empresa"
                class="text-body-2 text-medium-emphasis"
              >
                Probar gratis
              </NuxtLink>
              <!--
                Enlace real (`<a>`, no NuxtLink: el manual es un HTML servido
                por Nitro, fuera del router). Sin este enlace el manual sería
                una página huérfana: está en el sitemap, pero nada del sitio
                apunta a ella, y una página a la que no llega ningún enlace
                interno se rastrea tarde y se posiciona peor.
              -->
              <a
                href="/docs/manual/manual.html"
                class="text-body-2 text-medium-emphasis"
              >
                Manual de usuario
              </a>
            </div>
          </v-col>

          <!--
            Recursos: las páginas temáticas. Es el enlace interno que las saca
            de ser huérfanas, y con un texto de ancla que dice de qué tratan
            —"Control de vencimientos", no "leer más"—, porque el texto del
            enlace es una de las señales de qué trata la página que apunta.
          -->
          <v-col cols="6" md="2">
            <div class="text-subtitle-2 font-weight-medium mb-2">Recursos</div>
            <div class="d-flex flex-column ga-1">
              <NuxtLink
                v-for="r in RECURSOS"
                :key="r.ruta"
                :to="r.ruta"
                class="text-body-2 text-medium-emphasis"
              >
                {{ r.enlacePie }}
              </NuxtLink>
            </div>
          </v-col>

          <v-col cols="6" md="2">
            <div class="text-subtitle-2 font-weight-medium mb-2">Legales</div>
            <div class="d-flex flex-column ga-1">
              <NuxtLink
                to="/terminos-y-condiciones"
                class="text-body-2 text-medium-emphasis"
              >
                Términos y condiciones
              </NuxtLink>
              <NuxtLink
                to="/politica-de-privacidad"
                class="text-body-2 text-medium-emphasis"
              >
                Política de privacidad
              </NuxtLink>
            </div>
          </v-col>

          <v-col cols="12" md="2">
            <div class="text-subtitle-2 font-weight-medium mb-2">Contacto</div>
            <div class="d-flex flex-column ga-1">
              <a
                :href="`mailto:${CONTACTO.email}`"
                class="text-body-2 text-medium-emphasis"
              >
                {{ CONTACTO.email }}
              </a>
              <a
                :href="CONTACTO.whatsappUrl"
                target="_blank"
                rel="noopener"
                class="text-body-2 text-medium-emphasis"
              >
                {{ CONTACTO.whatsappVisible }}
              </a>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-5" />

        <div class="text-caption text-medium-emphasis">
          © {{ new Date().getFullYear() }} CamioNex. Todos los derechos
          reservados.
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>
