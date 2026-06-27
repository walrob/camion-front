<script setup lang="ts">
/*-For Set Blank Layout-*/
definePageMeta({
  layout: "blank",
});

useHead({
  title: "Registración",
});
</script>
<template>
  <div class="authentication">
    <v-container fluid class="pa-3">
      <v-row class="d-flex justify-center align-center">
        <v-col cols="12" class="d-flex align-center">
          <v-card
            rounded="md"
            elevation="10"
            class="px-sm-1 px-0 mx-auto"
            max-width="750"
          >
            <v-card-item class="pa-sm-8">
              <div class="d-flex justify-center pb-3">
                <LayoutFullLogoVertical />
              </div>
              <AuthRegisterForm />
              <div
                class="text-subtitle-2 text-textSecondary font-weight-medium d-flex justify-center align-center"
              >
                Al registrarte aceptas los
                <NuxtLink
                  to="/terminos-y-condiciones"
                  class="text-primary text-decoration-none ml-1"
                >
                  Términos y Condiciones</NuxtLink
                >
              </div>
              <h6
                class="text-h6 text-muted font-weight-medium d-flex justify-center align-center mt-3"
              >
                ¿Ya tienes cuenta?
                <NuxtLink
                  to="/auth/login"
                  class="text-primary text-decoration-none text-body-1 opacity-1 font-weight-medium pl-2"
                >
                  Inicia sesión</NuxtLink
                >
              </h6>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
