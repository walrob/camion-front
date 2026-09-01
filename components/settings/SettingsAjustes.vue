<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore, type SettingDef } from "~/stores/settings";

/**
 * Los ajustes sueltos de la empresa.
 *
 * No conoce ninguno: los pide a `GET /settings`, que devuelve la definición de
 * cada uno junto con su valor. Agregar un ajuste es una entrada en el catálogo
 * del backend; acá no se toca nada (docs/CONFIGURACION.md).
 */
const store = useSettingsStore();
const { groups, settings, loading, saving } = storeToRefs(store);

/** Copia editable: lo que se ve hasta que se aprieta Guardar. */
const borrador = ref<Record<string, string>>({});

const sincronizar = () => {
  borrador.value = Object.fromEntries(settings.value.map((s) => [s.key, s.value]));
};
watch(settings, sincronizar, { immediate: true });

/** Sólo lo que difiere de lo guardado: es lo que se manda y lo que se audita. */
const cambios = computed(() => {
  const out: Record<string, string> = {};
  for (const s of settings.value) {
    const actual = borrador.value[s.key];
    if (actual != null && String(actual) !== s.value) out[s.key] = String(actual);
  }
  return out;
});
const hayCambios = computed(() => Object.keys(cambios.value).length > 0);

const guardar = async () => {
  if (!hayCambios.value) return;
  await store.save(cambios.value);
};

const descartar = () => sincronizar();

/** `v-switch` trabaja con booleanos; el ajuste viaja como texto. */
const leerBool = (def: SettingDef) => borrador.value[def.key] === "true";
const escribirBool = (def: SettingDef, v: boolean) =>
  (borrador.value[def.key] = v ? "true" : "false");

onMounted(() => store.load(true));
</script>

<template>
  <div>
    <v-alert
      type="info"
      variant="tonal"
      rounded="lg"
      density="comfortable"
      class="mb-5"
    >
      Cada opción viene con el comportamiento que el sistema ya tenía. Lo que
      cambies aplica a toda la empresa —incluida la app de los choferes— y queda
      registrado con tu nombre y la fecha.
    </v-alert>

    <div v-if="loading && !settings.length" class="d-flex justify-center my-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <v-card
        v-for="grupo in groups"
        :key="grupo.key"
        border
        flat
        rounded="lg"
        class="mb-4"
      >
        <v-card-text class="pa-5">
          <div class="mb-1 text-subtitle-1 font-weight-bold">
            {{ grupo.label }}
          </div>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ grupo.help }}</p>

          <div
            v-for="(def, i) in store.porGrupo(grupo.key)"
            :key="def.key"
            :class="['ajuste', { 'ajuste--con-linea': i > 0 }]"
          >
            <v-switch
              v-if="def.type === 'boolean'"
              :model-value="leerBool(def)"
              color="primary"
              density="comfortable"
              hide-details
              inset
              @update:model-value="escribirBool(def, $event as boolean)"
            >
              <template #label>
                <span class="text-body-2 font-weight-medium">{{ def.label }}</span>
              </template>
            </v-switch>

            <v-select
              v-else-if="def.type === 'enum'"
              v-model="borrador[def.key]"
              :items="def.options"
              item-title="label"
              item-value="value"
              :label="def.label"
              density="comfortable"
              variant="outlined"
              hide-details
              class="ajuste__campo"
            />

            <v-text-field
              v-else-if="def.type === 'number'"
              v-model="borrador[def.key]"
              type="number"
              :label="def.label"
              :min="def.min"
              :max="def.max"
              density="comfortable"
              variant="outlined"
              hide-details
              class="ajuste__campo"
            />

            <v-text-field
              v-else
              v-model="borrador[def.key]"
              :label="def.label"
              :maxlength="def.maxLength"
              density="comfortable"
              variant="outlined"
              hide-details
              class="ajuste__campo"
            />

            <p class="text-caption text-medium-emphasis mb-0 mt-1">
              {{ def.help }}
            </p>
          </div>
        </v-card-text>
      </v-card>

      <!-- Aparece sólo cuando hay algo que guardar: nadie se queda con un
           cambio sin aplicar creyendo que se guardó solo. -->
      <v-slide-y-reverse-transition>
        <div v-if="hayCambios" class="barra-guardado">
          <v-card border flat rounded="lg" class="pa-3 d-flex align-center ga-3">
            <v-icon color="warning" size="20">mdi-content-save-alert-outline</v-icon>
            <span class="text-body-2">
              {{ Object.keys(cambios).length }}
              {{ Object.keys(cambios).length === 1 ? "cambio" : "cambios" }}
              sin guardar
            </span>
            <v-spacer />
            <v-btn variant="text" size="small" @click="descartar">Descartar</v-btn>
            <v-btn
              color="primary"
              size="small"
              :loading="saving"
              prepend-icon="mdi-check"
              @click="guardar"
            >
              Guardar
            </v-btn>
          </v-card>
        </div>
      </v-slide-y-reverse-transition>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ajuste {
  padding: 12px 0;

  &--con-linea {
    border-top: 1px solid rgb(var(--v-theme-borderColor));
  }

  &__campo {
    max-width: 320px;
  }
}

.barra-guardado {
  position: sticky;
  bottom: 16px;
  z-index: 5;
}
</style>
