<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

/**
 * Onboarding guiado de una empresa recién creada.
 *
 * Existe para que nadie caiga en un sistema vacío después de darse de alta:
 * una pantalla en blanco es la forma más rápida de perder a alguien que acaba
 * de convertir. Cada paso se puede saltear; el objetivo es acompañar, no
 * obligar.
 */
definePageMeta({ layout: "admin" });
useHead({ title: "Configuración inicial" });

const router = useRouter();
const { patch } = useApi();
const auth = useAuthStore();
const general = useGeneralStore();
const { $api } = useNuxtApp();

const paso = computed(() => auth.company?.onboardingStep ?? 1);
const guardando = ref(false);
const subiendoLogo = ref(false);
const logo = ref<File[] | File | null>(null);

// `logoUrl` guarda la key de S3, no una URL: se compone con la base de
// archivos, igual que el resto de las imágenes del sistema.
const logoActual = computed(() => returnUrlImg(auth.company?.logoUrl ?? undefined));

/**
 * Carga del logo.
 *
 * Es el único paso que se resuelve **acá adentro** en vez de mandar a otra
 * pantalla: es de un solo campo, y hacer navegar a alguien a configuración para
 * elegir un archivo es la clase de rodeo que hace que el paso no se haga nunca.
 */
const subirLogo = async () => {
  const archivo = Array.isArray(logo.value) ? logo.value[0] : logo.value;
  if (!archivo) return;

  subiendoLogo.value = true;
  try {
    const datos = new FormData();
    datos.append("file", archivo);
    await $api.patch("companies/me/logo", datos);
    await auth.fetchSession(true);
    logo.value = null;
    general.setSnackbar({
      color: "success",
      message: "Listo, ya está tu logo.",
    });
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    subiendoLogo.value = false;
  }
};

interface Paso {
  n: number;
  titulo: string;
  detalle: string;
  icono: string;
  destino: string;
  /** Aclaración al pie, cuando hay algo que conviene decir antes de empezar. */
  nota?: string;
}

const PASOS: Paso[] = [
  {
    n: 1,
    titulo: "Cargá tu flota",
    detalle: "Camiones y acoplados con su patente y número interno.",
    icono: "mdi-truck-outline",
    destino: "/admin/flota",
    // Todavía no hay importador: se aclara en vez de dejar que lo descubra
    // cargando cincuenta patentes a mano.
    nota: "¿Tenés muchas unidades? Escribinos y las cargamos por vos desde tu planilla.",
  },
  {
    n: 2,
    titulo: "Sumá a tu equipo",
    detalle:
      "Cargá a tus choferes y al taller. Los choferes son ilimitados en todos los planes.",
    icono: "mdi-account-multiple-plus-outline",
    destino: "/admin/choferes",
    // El paso lleva al camino de legajo, que es el del personal propio. Quien
    // además necesita darle acceso a alguien de afuera tiene que saber que hay
    // otro camino, o va a terminar inventándole un legajo.
    nota: "¿Alguien externo, sin legajo? Invitalo por email desde Equipo.",
  },
  {
    n: 3,
    titulo: "Creá tu primer viaje",
    detalle:
      "Asignale un camión y un chofer: la app del chofer lo recibe al instante.",
    icono: "mdi-map-marker-path",
    destino: "/admin/viajes",
  },
];

const avanzar = async (n: number) => {
  guardando.value = true;
  try {
    // `0` = onboarding terminado.
    const siguiente = n >= PASOS.length ? 0 : n + 1;
    await patch("companies/me/onboarding", { step: siguiente });
    await auth.fetchSession(true);
  } finally {
    guardando.value = false;
  }
};

const ir = async (p: Paso) => {
  await avanzar(p.n);
  router.push(p.destino);
};

const terminar = async () => {
  await avanzar(PASOS.length);
  router.push("/");
};
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold mb-1">
        Bienvenido a CamioNex
      </h1>
      <p class="text-body-2 text-medium-emphasis">
        Tres pasos para tener tu operación andando. Podés saltearlos y volver
        cuando quieras.
      </p>
    </div>

    <v-row dense>
      <v-col v-for="p in PASOS" :key="p.n" cols="12" md="4">
        <v-card
          border
          flat
          rounded="lg"
          class="pa-5 h-100 d-flex flex-column"
          :class="{ 'opacity-60': paso > p.n }"
        >
          <div class="d-flex align-center mb-3">
            <v-avatar
              :color="paso > p.n ? 'success' : 'primary'"
              variant="tonal"
              size="42"
              class="mr-3"
            >
              <v-icon>
                {{ paso > p.n ? "mdi-check" : p.icono }}
              </v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                Paso {{ p.n }} de {{ PASOS.length }}
              </div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ p.titulo }}
              </div>
            </div>
          </div>

          <p class="text-body-2 text-medium-emphasis flex-grow-1">
            {{ p.detalle }}
          </p>

          <p v-if="p.nota" class="text-caption text-medium-emphasis mb-0">
            <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
            {{ p.nota }}
          </p>

          <v-btn
            :color="paso === p.n ? 'primary' : undefined"
            :variant="paso === p.n ? 'flat' : 'text'"
            :loading="guardando"
            class="mt-3"
            block
            @click="ir(p)"
          >
            {{ paso > p.n ? "Volver a entrar" : "Empezar" }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- El logo no numera: es opcional y se resuelve sin salir de acá. -->
    <v-card border flat rounded="lg" class="pa-5 mt-4">
      <div class="d-flex align-center mb-3">
        <v-avatar color="primary" variant="tonal" size="42" class="mr-3">
          <v-icon>mdi-image-outline</v-icon>
        </v-avatar>
        <div>
          <div class="text-caption text-medium-emphasis">Opcional</div>
          <div class="text-subtitle-1 font-weight-medium">
            Poné tu logo
          </div>
        </div>
        <v-spacer />
        <v-avatar
          v-if="logoActual"
          size="42"
          rounded="lg"
          class="border"
        >
          <v-img :src="logoActual" />
        </v-avatar>
      </div>

      <p class="text-body-2 text-medium-emphasis mb-3">
        Aparece en el panel y en los remitos y comprobantes que imprimís.
        PNG, JPG, WEBP o SVG.
      </p>

      <div class="d-flex flex-wrap ga-3 align-center">
        <v-file-input
          v-model="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          label="Elegí el archivo"
          variant="outlined"
          density="compact"
          prepend-icon=""
          prepend-inner-icon="mdi-paperclip"
          hide-details
          style="max-width: 340px"
        />
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!logo"
          :loading="subiendoLogo"
          @click="subirLogo"
        >
          {{ logoActual ? "Cambiar" : "Subir" }}
        </v-btn>
      </div>
    </v-card>

    <div class="text-center mt-6">
      <v-btn variant="text" :loading="guardando" @click="terminar">
        Prefiero explorar por mi cuenta
      </v-btn>
    </div>
  </div>
</template>
