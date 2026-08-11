<script setup lang="ts">
import { computed } from "vue";

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
const destinoPanel = computed(() =>
  auth.user?.role === "driver" ? "/chofer" : "/admin",
);

const SECCIONES = [
  { texto: "Cómo funciona", ancla: "#modulos" },
  { texto: "Planes", ancla: "#planes" },
  { texto: "Contacto", ancla: "#contacto" },
];

useHead({ titleTemplate: (t?: string) => (t ? `${t} | FleetLog` : "FleetLog") });
</script>

<template>
  <v-app>
    <v-app-bar flat border height="68" class="px-2">
      <v-container class="d-flex align-center py-0">
        <NuxtLink to="/" class="d-flex align-center text-decoration-none">
          <LayoutFullLogoHorizontal :height="34" />
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

        <template v-if="autenticado">
          <v-btn color="primary" flat :to="destinoPanel">Ir al panel</v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" to="/auth/login" class="mr-1">Ingresar</v-btn>
          <v-btn color="primary" flat to="/auth/registro-empresa">
            Probar gratis
          </v-btn>
        </template>
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <v-footer class="border-t py-8">
      <v-container>
        <v-row>
          <v-col cols="12" md="5">
            <LayoutFullLogoHorizontal :height="34" />
            <p class="text-body-2 text-medium-emphasis mt-3 mb-0">
              Gestión de flotas para empresas de transporte de carga.
              Reemplazá el cuaderno, el Excel y los grupos de WhatsApp.
            </p>
          </v-col>

          <v-col cols="6" md="3">
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
            </div>
          </v-col>

          <v-col cols="6" md="4">
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
        </v-row>

        <v-divider class="my-5" />

        <div class="text-caption text-medium-emphasis">
          © {{ new Date().getFullYear() }} FleetLog. Todos los derechos
          reservados.
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>
