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

              <h2 class="text-h5 font-weight-bold text-center mb-2">
                Recuperar contraseña
              </h2>
              <p class="text-body-2 text-medium-emphasis text-center mb-6">
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div v-if="sent" class="text-center">
                <v-icon color="success" size="48" class="mb-3">mdi-email-check-outline</v-icon>
                <p class="text-body-1 text-success font-weight-medium">
                  Se envió el enlace a tu correo electrónico.
                </p>
                <p class="text-body-2 text-medium-emphasis mt-2">
                  Revisá tu bandeja de entrada (y la carpeta de spam).
                </p>
              </div>

              <v-form v-else ref="formRef" @submit.prevent="handleSubmit">
                <v-row dense>
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
                  <v-col cols="12" class="pt-2">
                    <v-btn
                      color="primary"
                      size="large"
                      block
                      flat
                      type="submit"
                      :loading="loading"
                    >
                      Enviar enlace
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <div class="text-center mt-4">
                <NuxtLink
                  to="/auth/login"
                  class="text-primary text-decoration-none text-body-2 font-weight-medium"
                >
                  Volver al inicio de sesión
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

useHead({ title: 'Recuperar contraseña' })

import { useValidations } from '~/composables/useValidations'
import { useGeneralStore } from '~/stores/general'

const r = useValidations()
const generalStore = useGeneralStore()
const { $api } = useNuxtApp()

const formRef = ref<any>(null)
const email = ref('')
const loading = ref(false)
const sent = ref(false)

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    await $api.post('auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (error: any) {
    generalStore.setErrorSnackbar(error)
  } finally {
    loading.value = false
  }
}
</script>
