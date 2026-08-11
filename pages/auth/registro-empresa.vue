<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

/**
 * Alta pública de una empresa: el punto de entrada del embudo comercial.
 *
 * Se piden sólo los datos imprescindibles. Todo lo demás —logo, domicilio,
 * flota— se completa en el onboarding guiado: cada campo de más en este
 * formulario es conversión que se pierde (MODELO-COMERCIAL §1.3, barrera de
 * entrada baja).
 */
definePageMeta({ layout: "blank" });
useHead({ title: "Crear cuenta" });

const router = useRouter();
const { post } = useApi();
const r = useValidations();
const auth = useAuthStore();

const formRef = ref();
const cargando = ref(false);
const error = ref("");

const form = ref({
  companyName: "",
  cuit: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  phone: "",
});

const crear = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  cargando.value = true;
  error.value = "";

  try {
    await post("companies/register", {
      ...form.value,
      // El CUIT es opcional: se manda sólo si lo cargaron.
      cuit: form.value.cuit || undefined,
      phone: form.value.phone || undefined,
    });

    // Entra directo: pedirle que vuelva a escribir la contraseña recién creada
    // es fricción sin ningún beneficio.
    const data: any = await post("auth/login", {
      email: form.value.adminEmail,
      password: form.value.adminPassword,
    });
    await auth.setAuth(data.token, data.expiresAt, data.user);
    await auth.fetchSession(true);

    router.push("/initial/empresa");
  } catch (e: any) {
    error.value =
      e?.response?.data?.message ??
      "No pudimos crear la cuenta. Intentá de nuevo en un momento.";
  } finally {
    cargando.value = false;
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
            max-width="560"
          >
            <v-card-item class="pa-sm-8 pa-4">
              <div class="d-flex justify-center pb-4">
                <LayoutFullLogoVertical />
              </div>

              <h2 class="text-h5 font-weight-bold text-center mb-1">
                Probá FleetLog 21 días
              </h2>
              <p class="text-body-2 text-center text-medium-emphasis mb-6">
                Sin tarjeta de crédito. Acceso completo al plan Operación.
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

              <v-form ref="formRef" @submit.prevent="crear">
                <v-row dense>
                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">
                      Razón social
                    </v-label>
                    <v-text-field
                      v-model="form.companyName"
                      variant="outlined"
                      color="primary"
                      placeholder="Transportes del Sur S.A."
                      :rules="[r.isRequired]"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-label class="font-weight-bold mb-1">
                      CUIT <span class="text-medium-emphasis">(opcional)</span>
                    </v-label>
                    <v-text-field
                      v-model="form.cuit"
                      variant="outlined"
                      color="primary"
                      placeholder="30712345678"
                      hint="11 dígitos, sin guiones"
                      persistent-hint
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-label class="font-weight-bold mb-1">
                      Teléfono <span class="text-medium-emphasis">(opcional)</span>
                    </v-label>
                    <v-text-field
                      v-model="form.phone"
                      variant="outlined"
                      color="primary"
                      placeholder="+54 11 5555-5555"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-divider class="my-2" />
                    <div class="text-subtitle-2 font-weight-medium mb-2">
                      Tu usuario administrador
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">
                      Nombre y apellido
                    </v-label>
                    <v-text-field
                      v-model="form.adminName"
                      variant="outlined"
                      color="primary"
                      :rules="[r.isRequired]"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-label class="font-weight-bold mb-1">Email</v-label>
                    <v-text-field
                      v-model="form.adminEmail"
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
                      v-model="form.adminPassword"
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
                      :loading="cargando"
                    >
                      Crear mi cuenta
                    </v-btn>
                  </v-col>

                  <v-col cols="12" class="text-center pt-2">
                    <span class="text-body-2 text-medium-emphasis">
                      ¿Ya tenés cuenta?
                    </span>
                    <NuxtLink to="/auth/login" class="text-primary ml-1">
                      Iniciá sesión
                    </NuxtLink>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
