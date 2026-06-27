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
                Nueva contraseña
              </h2>

              <div v-if="!token" class="text-center">
                <v-icon color="error" size="48" class="mb-3">mdi-alert-circle-outline</v-icon>
                <p class="text-body-1 text-error">
                  El enlace de restablecimiento es inválido o ha expirado.
                </p>
              </div>

              <div v-else-if="success" class="text-center">
                <v-icon color="success" size="48" class="mb-3">mdi-check-circle-outline</v-icon>
                <p class="text-body-1 text-success font-weight-medium">
                  Contraseña restablecida correctamente.
                </p>
              </div>

              <v-form v-else ref="formRef" @submit.prevent="handleSubmit">
                <v-row dense>
                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">Nueva contraseña</v-label>
                    <v-text-field
                      v-model="password"
                      variant="outlined"
                      color="primary"
                      :type="showPass ? 'text' : 'password'"
                      :rules="[r.isRequired, r.isPassword]"
                      autocomplete="new-password"
                      :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="showPass = !showPass"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">Confirmar contraseña</v-label>
                    <v-text-field
                      v-model="password2"
                      variant="outlined"
                      color="primary"
                      :type="showPass2 ? 'text' : 'password'"
                      :rules="[r.isRequired, passwordMatch]"
                      autocomplete="new-password"
                      :append-inner-icon="showPass2 ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="showPass2 = !showPass2"
                    />
                  </v-col>
                  <v-col cols="12" class="pt-2">
                    <v-btn
                      color="primary"
                      size="large"
                      block
                      flat
                      type="submit"
                      :loading="loading"
                    >
                      Restablecer contraseña
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <div class="text-center mt-4">
                <NuxtLink
                  to="/auth/login"
                  class="text-primary text-decoration-none text-body-2 font-weight-medium"
                >
                  Ir al inicio de sesión
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
  layout: 'blank',
})

useHead({ title: 'Restablecer contraseña' })

import { useValidations } from '~/composables/useValidations'
import { useGeneralStore } from '~/stores/general'

const r = useValidations()
const generalStore = useGeneralStore()
const { $api } = useNuxtApp()
const route = useRoute()

const formRef = ref<any>(null)
const token = ref('')
const password = ref('')
const password2 = ref('')
const showPass = ref(false)
const showPass2 = ref(false)
const loading = ref(false)
const success = ref(false)

const passwordMatch = (v: string) =>
  v === password.value || 'Las contraseñas no coinciden'

onMounted(() => {
  const queryToken = route.query.token
  if (typeof queryToken === 'string') {
    token.value = queryToken
  }
})

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    await $api.post('auth/reset-password', {
      token: token.value,
      newPassword: password.value,
    })
    success.value = true
    generalStore.setSuccessSnackbar('Contraseña restablecida correctamente')
    setTimeout(() => navigateTo('/auth/login'), 2000)
  } catch (error: any) {
    generalStore.setErrorSnackbar(error)
  } finally {
    loading.value = false
  }
}
</script>
