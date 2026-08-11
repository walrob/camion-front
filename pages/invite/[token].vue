<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * Aceptación de una invitación.
 *
 * Es el flujo por el que entra la mayor parte de los usuarios —sobre todo los
 * choferes—, así que tiene que funcionar del primer intento y explicar bien
 * cualquier rechazo: quien recibe un link vencido no sabe si se equivocó o si
 * tiene que pedir otro.
 */
definePageMeta({ layout: "blank" });
useHead({ title: "Sumarte a la empresa" });

const route = useRoute();
const router = useRouter();
const { get, post } = useApi();
const r = useValidations();
const auth = useAuthStore();

const token = String(route.params.token ?? "");

const cargando = ref(true);
const enviando = ref(false);
/** Motivo por el que la invitación no sirve. Vacío = es válida. */
const rechazo = ref("");
const invitacion = ref<{
  email: string;
  name: string | null;
  role: string;
  companyName: string;
} | null>(null);

const formRef = ref();
const form = ref({ name: "", password: "" });
const error = ref("");

const ROLES: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerencia",
  dispatcher: "Despachante",
  maintenance: "Taller",
  driver: "Chofer",
  hr: "Recursos Humanos",
  auditor: "Auditoría",
};

onMounted(async () => {
  try {
    const data: any = await get(`invites/token/${token}`);
    invitacion.value = data;
    form.value.name = data.name ?? "";
  } catch (e: any) {
    rechazo.value =
      e?.response?.data?.message ??
      "No pudimos validar la invitación. Pedí que te la envíen de nuevo.";
  } finally {
    cargando.value = false;
  }
});

const aceptar = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  enviando.value = true;
  error.value = "";

  try {
    await post(`invites/token/${token}/accept`, form.value);

    // Entra directo con la contraseña que acaba de definir.
    const data: any = await post("auth/login", {
      email: invitacion.value!.email,
      password: form.value.password,
    });
    await auth.setAuth(data.token, data.expiresAt, data.user);
    await auth.fetchSession(true);

    router.push(data.user?.role === "driver" ? "/chofer" : "/");
  } catch (e: any) {
    error.value =
      e?.response?.data?.message ?? "No pudimos completar el alta.";
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <div class="authentication">
    <v-container fluid class="pa-3">
      <v-row class="h-100vh d-flex justify-center align-center">
        <v-col cols="12" class="d-flex align-center">
          <v-card
            rounded="md"
            elevation="10"
            class="px-sm-1 px-0 mx-auto"
            max-width="480"
          >
            <v-card-item class="pa-sm-8 pa-4">
              <div class="d-flex justify-center pb-4">
                <LayoutFullLogoVertical />
              </div>

              <div v-if="cargando" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <!-- Invitación no utilizable: se explica el motivo concreto. -->
              <div v-else-if="rechazo" class="text-center py-4">
                <v-icon size="42" color="warning" class="mb-3">
                  mdi-link-variant-off
                </v-icon>
                <h2 class="text-h6 font-weight-bold mb-2">
                  No se puede usar esta invitación
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-5">
                  {{ rechazo }}
                </p>
                <v-btn color="primary" variant="text" to="/auth/login">
                  Ir a iniciar sesión
                </v-btn>
              </div>

              <template v-else-if="invitacion">
                <h2 class="text-h5 font-weight-bold text-center mb-1">
                  Sumate a {{ invitacion.companyName }}
                </h2>
                <p class="text-body-2 text-center text-medium-emphasis mb-6">
                  Te invitaron como
                  <strong>{{ ROLES[invitacion.role] ?? invitacion.role }}</strong>
                </p>

                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mb-4"
                  rounded="lg"
                >
                  {{ error }}
                </v-alert>

                <v-form ref="formRef" @submit.prevent="aceptar">
                  <v-row dense>
                    <v-col cols="12">
                      <v-label class="font-weight-bold mb-1">Email</v-label>
                      <v-text-field
                        :model-value="invitacion.email"
                        variant="outlined"
                        disabled
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-label class="font-weight-bold mb-1">
                        Nombre y apellido
                      </v-label>
                      <v-text-field
                        v-model="form.name"
                        variant="outlined"
                        color="primary"
                        :rules="[r.isRequired]"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-label class="font-weight-bold mb-1">
                        Elegí tu contraseña
                      </v-label>
                      <v-text-field
                        v-model="form.password"
                        variant="outlined"
                        color="primary"
                        type="password"
                        :rules="[r.isRequired]"
                        hint="Al menos 8 caracteres"
                        persistent-hint
                        autocomplete="new-password"
                      />
                    </v-col>

                    <v-col cols="12" class="pt-4">
                      <v-btn
                        type="submit"
                        color="primary"
                        size="large"
                        block
                        flat
                        :loading="enviando"
                      >
                        Entrar
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </template>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
