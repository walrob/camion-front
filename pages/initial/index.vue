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

const paso = computed(() => auth.company?.onboardingStep ?? 1);
const guardando = ref(false);

const PASOS = [
  {
    n: 1,
    titulo: "Cargá tu flota",
    detalle: "Camiones y acoplados con su patente y número interno.",
    icono: "mdi-truck-outline",
    destino: "/admin/flota",
  },
  {
    n: 2,
    titulo: "Sumá a tu equipo",
    detalle:
      "Invitá a despachantes, taller y choferes. Los choferes son ilimitados en todos los planes.",
    icono: "mdi-account-multiple-plus-outline",
    destino: "/admin/choferes",
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

const ir = async (p: (typeof PASOS)[number]) => {
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
        Bienvenido a FleetLog
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

    <div class="text-center mt-6">
      <v-btn variant="text" :loading="guardando" @click="terminar">
        Prefiero explorar por mi cuenta
      </v-btn>
    </div>
  </div>
</template>
