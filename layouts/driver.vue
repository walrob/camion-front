<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Flota` : "Flota";
  },
});

import { useGeneralStore } from "@/stores/general";
const generalStore = useGeneralStore();
const { snackbar } = storeToRefs(generalStore);

import { usePwa } from "~/composables/usePwa";
const { canInstall, isOnline, promptInstall } = usePwa();

import { useOfflineQueue } from "~/composables/useOfflineQueue";
const { pendingCount } = useOfflineQueue();

const page = useDriverPageState();

// Navegación inferior del chofer: una mano, objetivos táctiles grandes (≥48px).
const navItems = [
  {
    value: "inicio",
    title: "Inicio",
    icon: "mdi-home-variant-outline",
    activeIcon: "mdi-home-variant",
    to: "/chofer",
  },
  {
    value: "incidentes",
    title: "Incidentes",
    icon: "mdi-alert-outline",
    activeIcon: "mdi-alert",
    to: "/chofer/incidentes",
  },
  {
    value: "documentos",
    title: "Docs",
    icon: "mdi-file-document-outline",
    activeIcon: "mdi-file-document",
    to: "/chofer/documentos",
  },
  {
    value: "mensajes",
    title: "Mensajes",
    icon: "mdi-message-outline",
    activeIcon: "mdi-message",
    to: "/chofer/mensajes",
  },
];

// El alto del hero es variable (título de una o dos líneas, chips de estado que
// aparecen y desaparecen). Lo publicamos como variable CSS para que las pantallas
// que necesitan llenar el alto exacto —el chat— no dependan de un número mágico.
const heroRef = ref<HTMLElement | null>(null);
let observer: ResizeObserver | null = null;

onMounted(() => {
  if (!heroRef.value) return;
  observer = new ResizeObserver(([entry]) => {
    const h = entry.contentRect.height;
    document.documentElement.style.setProperty("--driver-hero-h", `${h}px`);
  });
  observer.observe(heroRef.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <v-locale-provider>
    <v-app>
      <v-main class="driver-main">
        <!-- Hero: degradado de marca a todo el ancho, del que cuelga la hoja -->
        <header ref="heroRef" class="driver-hero">
          <div class="driver-shell">
          <div class="d-flex align-center ga-2 mb-4">
            <span class="driver-hero__logo">
              <LayoutFullLogoHorizontal :height="24" />
            </span>
            <v-spacer />
            <v-chip
              v-if="!isOnline"
              color="white"
              size="small"
              variant="outlined"
            >
              <v-icon start size="14">mdi-wifi-off</v-icon> Sin conexión
            </v-chip>
            <v-chip
              v-if="pendingCount > 0"
              color="white"
              size="small"
              variant="outlined"
            >
              <v-icon start size="14">mdi-sync</v-icon> {{ pendingCount }} pend.
            </v-chip>
            <v-btn
              v-if="canInstall"
              size="small"
              variant="text"
              color="white"
              @click="promptInstall"
            >
              <v-icon start>mdi-download</v-icon> Instalar
            </v-btn>
          </div>

          <div class="d-flex align-center ga-2">
            <v-btn
              v-if="page.back"
              :to="page.back"
              icon="mdi-arrow-left"
              aria-label="Volver"
              variant="text"
              color="white"
              class="ms-n2"
            />
            <div class="min-w-0">
              <h1 class="text-h5 font-weight-bold text-white">
                {{ page.title }}
              </h1>
              <p v-if="page.subtitle" class="driver-hero__subtitle ma-0">
                {{ page.subtitle }}
              </p>
            </div>
            <v-spacer />
            <!-- Destino de las acciones que teletransporta cada pantalla -->
            <div id="driver-hero-actions" class="d-flex align-center ga-2" />
          </div>
          </div>
        </header>

        <!-- Hoja de contenido: sube sobre el degradado y redondea el corte -->
        <div class="driver-sheet driver-shell">
          <NuxtPage />
        </div>
      </v-main>

      <!-- Barra de navegación inferior del chofer -->
      <v-bottom-navigation grow color="primary" height="72" class="driver-nav">
        <v-btn
          v-for="item in navItems"
          :key="item.value"
          :to="item.to"
          :value="item.value"
        >
          <span class="driver-nav__pill">
            <v-icon size="22">{{ item.icon }}</v-icon>
          </span>
          <span class="text-caption">{{ item.title }}</span>
        </v-btn>
      </v-bottom-navigation>

      <!-- Snackbar global -->
      <v-snackbar
        v-model="snackbar.state"
        :timeout="snackbar.timeout"
        :color="snackbar.color"
        rounded="pill"
      >
        {{ snackbar.message }}
      </v-snackbar>
    </v-app>
  </v-locale-provider>
</template>

<style scoped lang="scss">
// La app del chofer se diseña para el teléfono, pero también se usa desde una
// tablet apoyada en la cabina o desde una PC en la oficina. En vez de estirar
// todo a lo ancho —líneas de texto larguísimas y tarjetas deformadas—, el
// contenido se limita a una columna centrada: el degradado sigue llegando a los
// bordes, lo que se acota es lo que se lee. Debajo de 960px no cambia nada.
$driver-column: 720px;

.driver-shell {
  width: 100%;

  @media (min-width: 960px) {
    max-width: $driver-column;
    margin-inline: auto;
  }
}

// El degradado llega hasta el borde superior (incluida la zona del notch en PWA
// instalada), por eso el padding usa el safe-area en vez de un valor fijo.
.driver-hero {
  position: relative;
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 44px;
  background: linear-gradient(
    150deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-accent)) 100%
  );

  // Halo diagonal: rompe el plano del degradado y le da el volumen que tienen
  // los headers de las apps de referencia.
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      120% 90% at 85% 0%,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0) 60%
    );
  }

  > * {
    position: relative;
    z-index: 1;
  }

  // El logo es un wordmark azul+verde: sobre el degradado el azul se pierde y
  // teñirlo de blanco borraría la marca. Va sobre una píldora blanca, que además
  // lo lee como sello de identidad y no como parte del contenido.
  &__logo {
    display: inline-flex;
    align-items: center;
    padding: 3px 12px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(16, 30, 65, 0.18);

    // El componente del logo trae un padding-top propio pensado para la barra
    // clara; dentro de la píldora lo descentra.
    :deep(div) {
      padding-top: 0 !important;
      display: flex;
    }
  }

  &__subtitle {
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.8125rem;
    line-height: 1.2rem;
  }
}

// La hoja se solapa con el hero: ese corte redondeado es lo que separa el
// "encabezado de marca" del área de trabajo.
.driver-sheet {
  position: relative;
  margin-top: -28px;
  padding: 12px 16px;
  // padding: 20px 16px calc(88px + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
  background: rgb(var(--v-theme-background));
  min-height: 60vh;

  // En pantalla grande la hoja deja de ser "el resto de la pantalla" y pasa a
  // leerse como una tarjeta: redondeada en las cuatro esquinas, con borde y aire
  // abajo para que no quede pegada a la barra de navegación. El padding vertical
  // no se toca: el alto del chat (pages/chofer/mensajes.vue) se calcula a partir
  // de él.
  @media (min-width: 960px) {
    padding-inline: 24px;
    border-radius: 24px;
    border: 1px solid rgb(var(--v-theme-borderColor));
    margin-bottom: 24px;
  }
}

// El layout de admin le da a `.v-main` un margen lateral global (scss/layout/
// _container.scss). Acá el degradado tiene que llegar a los bordes, así que el
// margen se anula y el respiro lateral lo pone cada bloque por dentro.
.driver-main {
  margin: 0 !important;

  :deep(.v-main__scroller) {
    background: rgb(var(--v-theme-background));
  }
}

.driver-nav {
  border-top: 1px solid rgb(var(--v-theme-borderColor));
  box-shadow: 0 -2px 12px rgba(16, 30, 65, 0.06);

  // La barra sigue ocupando el ancho completo (es lo que la ancla al pie), pero
  // sus cuatro destinos se agrupan en la misma columna que el contenido: cuatro
  // botones repartidos en 1920px quedaban perdidos en las esquinas.
  :deep(.v-bottom-navigation__content) {
    @media (min-width: 960px) {
      max-width: $driver-column;
      margin-inline: auto;
    }
  }

  :deep(.v-btn) {
    // El destino activo se marca con una píldora tintada detrás del ícono: se
    // reconoce de un vistazo con el pulgar encima, mejor que un cambio de color.
    .driver-nav__pill {
      display: grid;
      place-items: center;
      width: 46px;
      height: 26px;
      border-radius: 999px;
      margin-bottom: 2px;
      transition: background-color 0.2s ease;
    }

    &.v-btn--active .driver-nav__pill {
      background-color: rgba(var(--v-theme-primary), 0.14);
    }
  }
}
</style>
