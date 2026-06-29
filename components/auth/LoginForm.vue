<script setup lang="ts">
import { ref } from "vue";

import { useAuthStore } from "~/stores/auth";
const authStore = useAuthStore();
const { $api } = useNuxtApp();

const route = useRoute();
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");
// const remember = ref(false);
const showPass = ref(false);

onMounted(async () => {
  const emailQuery: any = route.query.email;
  if (typeof emailQuery === "string") {
    email.value = emailQuery;
  } else {
    email.value = await authStore.loadLastUserEmail();
  }
});

const onLogin = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await $api.post("auth/login", {
      email: email.value,
      password: password.value,
    });

    if (res.data && res.data.token) {
      authStore.setLastUserEmail(email.value);
      authStore.setAuth(res.data.token, res.data.expiresAt, res.data.user);
      await navigateTo("/");
    } else {
      errorMsg.value = "Credenciales incorrectas";
    }
  } catch (e: any) {
    // errorMsg.value = e.response?.data?.message || "Error de autenticación";
    errorMsg.value = "Error de autenticación";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form
    @submit.prevent="onLogin"
    action="/login"
    method="post"
    autocomplete="on"
  >
    <v-row class="d-flex mb-3">
      <v-col cols="12">
        <v-label class="font-weight-bold mb-1">Email</v-label>
        <v-text-field
          v-model="email"
          name="email"
          variant="outlined"
          hide-details
          color="primary"
          :input-attrs="{ autocomplete: 'username' }"
        />
      </v-col>

      <v-col cols="12">
        <v-label class="font-weight-bold mb-1">Contraseña</v-label>
        <v-text-field
          v-model="password"
          name="password"
          variant="outlined"
          hide-details
          color="primary"
          :type="showPass ? 'text' : 'password'"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass = !showPass"
          :input-attrs="{ autocomplete: 'current-password' }"
        />
      </v-col>

      <v-col cols="12" class="pt-3">
        <v-btn
          color="primary"
          size="large"
          block
          flat
          :loading="loading"
          type="submit"
        >
          Iniciar sesión
        </v-btn>
        <div v-if="errorMsg" class="text-error mt-2 text-center">
          {{ errorMsg }}
        </div>
      </v-col>
    </v-row>
  </form>
</template>
