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
          >
            <v-card-item class="pa-sm-8">
              <div class="d-flex justify-center pb-3">
                <LayoutFullLogoVertical />
              </div>
              <div v-if="loading" class="mt-5 text-center text-textSecondary">
                Espere un momento mientras validamos la cuenta...
              </div>
              <div v-if="errorMsg" class="text-error mt-5 mt-md-10 text-center">
                {{ errorMsg }}
              </div>
              <div class="text-center mt-4">
                <NuxtLink
                  to="/"
                  class="text-primary text-decoration-none text-body-1 opacity-1 font-weight-medium"
                >
                  Ir al inicio</NuxtLink
                >
              </div>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
/*-For Set Blank Layout-*/
definePageMeta({
  layout: "blank",
});

useHead({
  title: "Verificación",
});

import { useGeneralStore } from "@/stores/general";
const generalStore = useGeneralStore();

const { $api } = useNuxtApp();

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const errorMsg = ref("");

onMounted(async () => {
  const queryToken: any = route.query.token;
  if (typeof queryToken === "string") {
    sendTokenRegister(queryToken);
  } else {
    errorMsg.value =
      "Error al obtener el token. Regrese al inicio o contacte a Atención a Usuarios.";
  }
});

const sendTokenRegister = async (token: string) => {
  loading.value = true;
  try {
    const res = await $api.post("auth/verify-email", {
      token,
    });
    if (res.data) {
      generalStore.setSnackbar({
        color: "success",
        message: "Cuenta validada correctamente.",
      });
      await navigateTo(`/auth/login?email=${res.data.email}`);
    } else {
      errorMsg.value =
        "Error al intentar validar la cuenta. Por favor comunicarse con Atención a Usuarios.";
    }
  } catch (e) {
    errorMsg.value =
      "Error al intentar validar la cuenta. Por favor comunicarse con Atención a Usuarios.";
  } finally {
    loading.value = false;
  }
};
</script>
