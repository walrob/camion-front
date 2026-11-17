<template>
  <div class="authentication">
    <v-container fluid class="pa-3">
      <v-row class="h-100vh d-flex justify-center align-center">
        <v-col cols="12" class="d-flex align-center">
          <v-card
            rounded="md"
            elevation="10"
            class="px-sm-1 px-0 mx-auto"
            max-width="500"
            width="100%"
          >
            <v-card-item class="pa-sm-8">
              <div class="d-flex justify-center pb-3">
                <LayoutFullLogoVertical />
              </div>

              <div v-if="cargando && !estado" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <div v-else-if="linkInvalido || !token" class="text-center mt-4">
                <h1 class="text-h6 font-weight-bold mb-2">
                  El link no es válido
                </h1>
                <p class="text-body-2 text-medium-emphasis">
                  Usá el link del último email que te llegó, o respondelo y te
                  damos de baja nosotros.
                </p>
              </div>

              <template v-else-if="estado">
                <div class="text-center mt-4 mb-6">
                  <h1 class="text-h6 font-weight-bold mb-2">
                    {{
                      estado.optOut
                        ? "Listo, no te escribimos más"
                        : "Emails de CamioNex"
                    }}
                  </h1>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    <template v-if="estado.name">Hola {{ estado.name }}. </template>
                    <template v-if="estado.optOut">
                      No vas a recibir más consejos ni recordatorios para
                      sacarle provecho a CamioNex en
                      <strong>{{ estado.email }}</strong>.
                    </template>
                    <template v-else>
                      Cada tanto te escribimos a
                      <strong>{{ estado.email }}</strong> con consejos y
                      recordatorios para sacarle provecho a CamioNex.
                    </template>
                  </p>
                </div>

                <v-btn
                  block
                  class="text-none"
                  :variant="estado.optOut ? 'tonal' : 'flat'"
                  :color="estado.optOut ? 'primary' : 'error'"
                  :loading="cargando"
                  @click="cambiar(!estado.optOut)"
                >
                  {{
                    estado.optOut
                      ? "Volver a recibirlos"
                      : "No quiero recibir más estos emails"
                  }}
                </v-btn>

                <p class="text-caption text-medium-emphasis text-center mt-4 mb-0">
                  Los emails necesarios para usar tu cuenta —contraseña,
                  facturas y avisos de pago— te siguen llegando igual.
                </p>
              </template>

              <div class="text-center mt-6">
                <NuxtLink
                  to="/"
                  class="text-primary text-decoration-none text-body-1 opacity-1 font-weight-medium"
                >
                  Ir al inicio
                </NuxtLink>
              </div>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import type { EmailOptOut } from "~/types/engagement";

/**
 * Baja de los emails de activación y re-enganche, desde el link al pie de
 * cada uno.
 *
 * Pública: la abre gente que no tiene la sesión iniciada. Lo que la identifica
 * es el token firmado del link (`?t=`), que sólo sirve para esta preferencia.
 *
 * La baja se confirma con un botón y **no al abrir el link**: los antivirus de
 * correo abren los links de los emails para revisarlos, y darían de baja a
 * cualquiera que los tenga.
 */
definePageMeta({ layout: "blank" });

useHead({ title: "Emails de CamioNex" });

const route = useRoute();
const { get, patch } = useApi();
const general = useGeneralStore();

const token = computed(() => String(route.query.t ?? ""));
const estado = ref<EmailOptOut | null>(null);
const cargando = ref(false);
const linkInvalido = ref(false);

const cargar = async () => {
  cargando.value = true;
  linkInvalido.value = false;
  try {
    estado.value = await get<EmailOptOut>("engagement/unsubscribe", {
      t: token.value,
    });
  } catch {
    linkInvalido.value = true;
  } finally {
    cargando.value = false;
  }
};

const cambiar = async (optOut: boolean) => {
  cargando.value = true;
  try {
    await patch("engagement/unsubscribe", { t: token.value, optOut });
    if (estado.value) estado.value.optOut = optOut;
    if (!optOut) general.setSuccessSnackbar("Listo, vas a volver a recibirlos.");
  } catch (e: any) {
    general.setSnackbar({ color: "error", message: e?.message });
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  if (token.value) cargar();
});
</script>
