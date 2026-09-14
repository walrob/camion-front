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

              <h2 class="text-h5 font-weight-bold text-center mb-6">
                Iniciar sesión
              </h2>

              <v-alert
                v-if="faltaVerificar"
                type="warning"
                variant="tonal"
                density="comfortable"
                rounded="lg"
                class="mb-4"
              >
                <div class="text-body-2">
                  Falta confirmar tu correo. Revisá tu casilla —también el
                  correo no deseado—.
                </div>
                <v-btn
                  variant="text"
                  color="warning"
                  size="small"
                  class="mt-2 px-0"
                  :loading="reenviando"
                  @click="reenviarVerificacion"
                >
                  Reenviar el mensaje
                </v-btn>
              </v-alert>

              <v-form ref="formRef" @submit.prevent="handleLogin">
                <v-row>
                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">Email</v-label>
                    <v-text-field
                      v-model="email"
                      variant="outlined"
                      color="primary"
                      type="email"
                      placeholder="ejemplo@empresa.com"
                      :rules="[r.isRequired, r.isEmail]"
                      autocomplete="username"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">Contraseña</v-label>
                    <v-text-field
                      v-model="password"
                      variant="outlined"
                      color="primary"
                      :type="showPass ? 'text' : 'password'"
                      :rules="[r.isRequired]"
                      autocomplete="current-password"
                      :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="showPass = !showPass"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      color="primary"
                      size="large"
                      block
                      flat
                      type="submit"
                      :loading="loading"
                    >
                      Ingresar
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <div class="text-center mt-4">
                <NuxtLink
                  to="/auth/forgot-password"
                  class="text-primary text-decoration-none text-body-2 font-weight-medium"
                >
                  ¿Olvidaste tu contraseña?
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
definePageMeta({
  layout: "blank",
});

useHead({ title: "Iniciar sesión" });

import { useValidations } from "~/composables/useValidations";
import { useAuthStore } from "~/stores/auth";
import { useGeneralStore } from "~/stores/general";

const r = useValidations();
const authStore = useAuthStore();
const generalStore = useGeneralStore();
const { $api } = useNuxtApp();

const formRef = ref<any>(null);
const email = ref("");
const password = ref("");
const showPass = ref(false);
const loading = ref(false);
const faltaVerificar = ref(false);
const reenviando = ref(false);

/**
 * Cómo se reconoce el rechazo por casilla sin confirmar.
 *
 * Se busca una frase corta y estable del mensaje del backend
 * (`EMAIL_SIN_VERIFICAR`) en vez del texto entero: así una coma corregida del
 * lado del servidor no deja al usuario sin el botón de reenvío, que es
 * justamente su única salida.
 */
const MARCA_SIN_VERIFICAR = "confirmar tu correo";

// El middleware global encamina según el rol que devuelve el backend.
const handleLogin = async () => {
  const { valid } = await formRef.value?.validate();
  if (!valid) return;

  loading.value = true;
  faltaVerificar.value = false;
  try {
    const res = await $api.post("auth/login", {
      email: email.value,
      password: password.value,
    });
    const { token, expiresAt, user } = res.data;
    await authStore.setAuth(token, expiresAt, user);
    // Al panel que corresponde al rol, no a la landing: el middleware sólo
    // saca de `/` al chofer, así que un admin se quedaría en la página pública.
    await navigateTo(authStore.paginaDeInicio);
  } catch (error: any) {
    const mensaje = String(error?.response?.data?.message ?? "");
    if (mensaje.includes(MARCA_SIN_VERIFICAR)) {
      // El aviso queda fijo en la pantalla con el botón de reenvío: un snackbar
      // que se va solo no le sirve a alguien que necesita hacer algo con él.
      faltaVerificar.value = true;
    } else {
      generalStore.setErrorSnackbar(error);
    }
  } finally {
    loading.value = false;
  }
};

const reenviarVerificacion = async () => {
  reenviando.value = true;
  try {
    await $api.post("auth/resend-verification", { email: email.value });
    generalStore.setSnackbar({
      color: "success",
      message:
        "Si la dirección corresponde a una cuenta sin confirmar, te enviamos el mensaje.",
    });
  } catch (error: any) {
    generalStore.setErrorSnackbar(error);
  } finally {
    reenviando.value = false;
  }
};
</script>
