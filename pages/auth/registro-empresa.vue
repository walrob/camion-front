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

const { post } = useApi();
const r = useValidations();
const general = useGeneralStore();

const formRef = ref();
const cargando = ref(false);
const reenviando = ref(false);
const error = ref("");
/** Alta hecha: falta que confirme la casilla. */
const creada = ref(false);

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

    // No se entra directo: el backend manda un mail de confirmación y el login
    // rechaza a quien no la hizo. Intentarlo acá sólo mostraría un error justo
    // después de un alta que salió bien.
    creada.value = true;
  } catch (e: any) {
    error.value =
      e?.response?.data?.message ??
      "No pudimos crear la cuenta. Intentá de nuevo en un momento.";
  } finally {
    cargando.value = false;
  }
};

const reenviar = async () => {
  reenviando.value = true;
  try {
    await post("auth/resend-verification", { email: form.value.adminEmail });
    general.setSnackbar({
      color: "success",
      message: "Listo, te lo mandamos de nuevo.",
    });
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    reenviando.value = false;
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

              <!-- Alta hecha: sólo falta que confirme la casilla. -->
              <template v-if="creada">
                <div class="text-center">
                  <v-avatar color="success" variant="tonal" size="64" class="mb-4">
                    <v-icon size="34">mdi-email-check-outline</v-icon>
                  </v-avatar>

                  <h2 class="text-h5 font-weight-bold mb-2">
                    Revisá tu correo
                  </h2>
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Te mandamos un mensaje a
                  </p>
                  <p class="text-body-1 font-weight-medium mb-4">
                    {{ form.adminEmail }}
                  </p>
                  <p class="text-body-2 text-medium-emphasis mb-6">
                    Confirmá la dirección desde ese mensaje y empezás tus 30
                    días. Si no aparece, mirá en el correo no deseado.
                  </p>

                  <v-btn
                    variant="tonal"
                    color="primary"
                    block
                    :loading="reenviando"
                    @click="reenviar"
                  >
                    Reenviar el mensaje
                  </v-btn>

                  <div class="mt-4">
                    <NuxtLink to="/auth/login" class="text-primary text-body-2">
                      Ya lo confirmé, iniciar sesión
                    </NuxtLink>
                  </div>
                </div>
              </template>

              <template v-else>
              <h2 class="text-h5 font-weight-bold text-center mb-1">
                Probá FleetLog 30 días
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
              </template>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
