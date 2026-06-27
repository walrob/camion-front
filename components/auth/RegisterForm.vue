<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useValidations } from "~/composables/useValidations";
import { useGeneralStore } from "@/stores/general";
import { storeToRefs } from "pinia";
import type { UserAddress } from "~/types/project";

const authStore = useAuthStore();
const generalStore = useGeneralStore();
const { loading: loadingPlan } = storeToRefs(generalStore);

const { $api } = useNuxtApp();

const r = useValidations();

// ----------------
// FORM
// ----------------
const email = ref("");
const password = ref("");
const password2 = ref("");
const name = ref("");
const phone = ref("");
const birthDate = ref("");

const todayDate = formatDateInput(new Date());

const address = ref<UserAddress | null>(null);

const loading = ref(false);
const errorMsg = ref("");

const showPass = ref(false);
const showPass2 = ref(false);

const formValid = ref(true);
const formRef = ref();

// ----------------
// REGISTER
// ----------------
const onRegister = async () => {
  errorMsg.value = "";

  const resp = await formRef.value?.validate();

  if (!resp?.valid) return;

  if (password.value !== password2.value) {
    errorMsg.value = "Las contraseñas no coinciden";
    return;
  }

  if (!address.value) {
    errorMsg.value = "Debes completar la dirección";
    return;
  }

  loading.value = true;

  try {
    const res = await $api.post("auth/register", {
      name: name.value,
      email: email.value,
      password: password.value,
      phone: phone.value,
      birthDate: birthDate.value,
      address: address.value, // 👈 ahora viene completo con lat/lng
    });

    if (res.data) {
      generalStore.setSnackbar({
        color: "success",
        message: "Te enviamos un email para verficar tu cuenta.",
      });

      await navigateTo(`/auth/login?email=${res.data.email}`);
    }
  } catch {
    errorMsg.value = "Error al intentar crear el usuario";
  } finally {
    loading.value = false;
  }
};

const passwordMatch = (v: string) =>
  v === password.value || "Las contraseñas no coinciden";
</script>

<template>
  <v-form ref="formRef" v-model="formValid" @submit.prevent="onRegister">
    <v-row dense class="d-flex mb-3">
      <!-- Sección de datos personales -->
      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Nombre</v-label>
        <v-text-field
          v-model="name"
          variant="outlined"
          color="primary"
          density="compact"
          autocomplete="name"
          :rules="[r.isRequired]"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Email</v-label>
        <v-text-field
          v-model="email"
          variant="outlined"
          color="primary"
          density="compact"
          autocomplete="email"
          :rules="[r.isRequired, r.isEmail]"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Contraseña</v-label>
        <v-text-field
          v-model="password"
          variant="outlined"
          color="primary"
          density="compact"
          autocomplete="current-password"
          :rules="[r.isRequired, r.isPassword]"
          :type="showPass ? 'text' : 'password'"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass = !showPass"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Repetir Contraseña</v-label>
        <v-text-field
          v-model="password2"
          variant="outlined"
          color="primary"
          density="compact"
          autocomplete="current-password"
          :rules="[r.isRequired, passwordMatch]"
          :type="showPass2 ? 'text' : 'password'"
          :append-inner-icon="showPass2 ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass2 = !showPass2"
        />
      </v-col>

      <!-- <v-divider class="my-4" /> -->

      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Nacimiento</v-label>
        <v-text-field
          v-model="birthDate"
          type="date"
          variant="outlined"
          color="primary"
          density="compact"
          hide-details
          :max="todayDate"
          :rules="[r.isRequired]"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Teléfono</v-label>
        <v-text-field
          v-model="phone"
          type="number"
          variant="outlined"
          color="primary"
          density="compact"
          hide-details
        />
      </v-col>

      <!-- Sección de dirección de envío -->
      <v-divider class="my-4" />

      <v-col cols="12">
        <h4 class="text-subtitle-1 font-weight-bold mb-2">
          Dirección de envío
        </h4>

        <FormAddressWithGeo v-model="address" :standalone="false" />
      </v-col>

      <!-- Botón de registro -->
      <v-col cols="12" class="mt-6">
        <v-btn
          color="primary"
          size="large"
          block
          flat
          :loading="loading"
          type="submit"
          >Registrar</v-btn
        >
        <div v-if="errorMsg" class="text-error mt-2 text-center">
          {{ errorMsg }}
        </div>
      </v-col>
    </v-row>
  </v-form>
  <SharedLoading v-if="loadingPlan" />
</template>
