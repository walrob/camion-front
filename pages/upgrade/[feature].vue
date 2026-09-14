<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "~/components/shared/PageHeader.vue";
import { FEATURE_INFO } from "~/types/plan";
import { CONTACTO } from "~/composables/useContacto";

definePageMeta({ layout: "admin" });

const route = useRoute();
const { plan } = useFeatures();

const codigo = computed(() => String(route.params.feature || ""));
const info = computed(() => FEATURE_INFO[codigo.value] ?? null);

useHead(() => ({
  title: info.value ? `${info.value.titulo} — Actualizar plan` : "Actualizar plan",
}));
</script>

<template>
  <div>
    <!-- No está en el menú: se cuelga de "Mi plan", que es de donde se contrata. -->
    <PageHeader
      :title="info ? info.titulo : 'Funcionalidad no incluida'"
      :subtitle="
        plan
          ? `Tu plan actual es ${plan.name}`
          : 'Esta funcionalidad no está incluida en tu plan'
      "
      :breadcrumbs="[
        { title: 'Panel', to: '/admin' },
        { title: 'Cuenta', disabled: true },
        { title: 'Mi plan', to: '/estado-plan' },
        { title: 'Actualizar plan', disabled: true },
      ]"
    />

    <v-row dense>
      <v-col cols="12" md="7">
        <v-card border flat rounded="lg" class="pa-6">
          <div class="d-flex align-center mb-4">
            <v-avatar color="primary" variant="tonal" size="44" class="mr-3">
              <v-icon>mdi-lock-open-variant-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6">{{ info?.titulo ?? codigo }}</div>
              <div class="text-body-2 text-medium-emphasis">
                Disponible desde el plan
                <strong>{{ info?.plan ?? "superior" }}</strong>
              </div>
            </div>
          </div>

          <p v-if="info" class="text-body-1 mb-5">{{ info.pitch }}</p>

          <v-list v-if="info" density="compact" class="bg-transparent pa-0">
            <v-list-item
              v-for="(d, i) in info.detalle"
              :key="i"
              class="px-0"
              min-height="34"
            >
              <template #prepend>
                <v-icon size="18" color="success" class="mr-2">
                  mdi-check-circle-outline
                </v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ d }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <p v-else class="text-body-2 text-medium-emphasis">
            Esta funcionalidad no está incluida en tu plan actual.
          </p>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card border flat rounded="lg" class="pa-6">
          <div class="text-subtitle-1 font-weight-medium mb-2">
            Activarlo en tu cuenta
          </div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            El cambio de plan es inmediato y se prorratea: sólo se cobra la
            diferencia del período en curso. No hay que volver a cargar datos ni
            capacitar de nuevo al equipo.
          </p>

          <!-- Dos caminos: lo cambia el admin desde Mi plan, o lo pide a soporte. -->
          <v-btn color="primary" block class="mb-2" to="/estado-plan#planes">
            Ver planes y cambiar
          </v-btn>
          <v-btn
            variant="tonal"
            block
            class="mb-2"
            prepend-icon="mdi-whatsapp"
            :href="CONTACTO.whatsappUrl"
            target="_blank"
            rel="noopener"
          >
            Pedirlo a soporte
          </v-btn>
          <v-btn variant="text" block @click="$router.back()">Volver</v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
