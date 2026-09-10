<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  useCatalogStore,
  BEHAVIOR_ADVANCE,
  type CatalogItem,
} from "~/stores/catalog";
import { Feature } from "~/types/plan";

/**
 * Editor de los catálogos de negocio de la empresa: tipos de gasto, tipos de
 * incidente, categorías de documento, permisos, puestos, motivos de licencia y
 * tipos de combustible (docs/CONFIGURACION.md §5).
 *
 * Los elementos que trae el sistema se renombran, recolorean, reordenan y
 * desactivan, pero no se eliminan: el histórico los sigue nombrando y el código
 * los espera por su clave.
 */
const store = useCatalogStore();
const { catalogs, loading, saving } = storeToRefs(store);

const { has } = useFeatures();
const puedeEditar = computed(() => has(Feature.CATALOGS));

const abierto = ref<string | null>(null);
const borrador = ref<CatalogItem[]>([]);

const defActual = computed(() =>
  catalogs.value.find((c) => c.key === abierto.value),
);

const clavear = (label: string) =>
  label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || `item_${Date.now()}`;

const abrir = (catalog: string) => {
  abierto.value = catalog;
  borrador.value = store.todos(catalog).map((i) => ({ ...i }));
};

const agregar = () => {
  borrador.value.push({
    key: "",
    label: "",
    order: borrador.value.length,
    isActive: true,
    isSystem: false,
  });
};

const quitar = (i: number) => borrador.value.splice(i, 1);

const mover = (i: number, delta: number) => {
  const destino = i + delta;
  if (destino < 0 || destino >= borrador.value.length) return;
  const [item] = borrador.value.splice(i, 1);
  borrador.value.splice(destino, 0, item);
};

const puedeGuardar = computed(() => borrador.value.every((i) => i.label.trim()));

const guardar = async () => {
  if (!abierto.value || !puedeGuardar.value) return;
  const ok = await store.save(
    abierto.value,
    borrador.value.map((item, i) => ({
      key: item.key || clavear(item.label),
      label: item.label.trim(),
      color: item.color,
      icon: item.icon,
      order: i,
      // El comportamiento de los de sistema no viaja: lo fija el producto.
      behavior: item.isSystem ? undefined : item.behavior,
      isActive: item.isActive,
    })),
  );
  if (ok) abierto.value = null;
};

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
      Las listas que el sistema ofrece al cargar un gasto, reportar un incidente,
      guardar un documento o dar de alta a alguien. Podés renombrarlas,
      reordenarlas y sumar las tuyas: los cambios se ven enseguida en la app de
      los choferes.
    </v-alert>

    <v-card v-if="!puedeEditar" border flat rounded="lg" class="mb-4">
      <v-card-text class="pa-5 d-flex align-center ga-4 flex-wrap">
        <v-icon color="medium-emphasis" size="24">mdi-lock-outline</v-icon>
        <div class="min-w-0 flex-grow-1">
          <div class="text-subtitle-2 font-weight-bold">
            Editar los catálogos viene con el plan Operación
          </div>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Con tu plan actual se usan las listas que trae el sistema.
          </p>
        </div>
        <v-btn color="primary" variant="tonal" to="/upgrade/catalogs">
          Ver qué incluye
        </v-btn>
      </v-card-text>
    </v-card>

    <div v-if="loading && !catalogs.length" class="d-flex justify-center my-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card
      v-for="c in catalogs"
      :key="c.key"
      border
      flat
      rounded="lg"
      class="mb-4"
    >
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-1 flex-wrap">
          <span class="text-subtitle-1 font-weight-bold">{{ c.label }}</span>
          <v-spacer />
          <v-btn
            v-if="puedeEditar"
            size="small"
            variant="tonal"
            prepend-icon="mdi-pencil"
            @click="abrir(c.key)"
          >
            Editar
          </v-btn>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-3">{{ c.help }}</p>

        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="item in store.todos(c.key)"
            :key="item.key"
            size="small"
            label
            :color="item.isActive ? item.color || 'primary' : undefined"
            :variant="item.isActive ? 'tonal' : 'outlined'"
          >
            <v-icon v-if="item.icon" start size="14">{{ item.icon }}</v-icon>
            {{ item.label }}
            <span v-if="!item.isActive" class="ms-1 text-caption">(inactivo)</span>
            <v-icon
              v-if="item.behavior === BEHAVIOR_ADVANCE"
              end
              size="14"
              title="Resta en la rendición"
            >
              mdi-cash-minus
            </v-icon>
            <!-- En puestos, el comportamiento es el rol de acceso: se muestra
                 porque es lo que define con qué permisos entra la persona. -->
            <span
              v-else-if="c.comportamiento && item.behavior"
              class="ms-1 text-caption"
            >
              ·
              {{
                c.comportamiento.opciones.find((o) => o.value === item.behavior)
                  ?.label ?? item.behavior
              }}
            </span>
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Editor -->
    <v-dialog
      :model-value="!!abierto"
      max-width="720"
      scrollable
      @update:model-value="abierto = null"
    >
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold">
          {{ defActual?.label }}
        </v-card-title>

        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">{{ defActual?.help }}</p>

          <div class="d-flex align-center mt-4 mb-2">
            <span class="text-subtitle-2 font-weight-bold">Elementos</span>
            <v-spacer />
            <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="agregar">
              Agregar
            </v-btn>
          </div>

          <div
            v-for="(item, i) in borrador"
            :key="i"
            class="elemento d-flex align-center ga-2 py-2"
          >
            <div class="d-flex flex-column">
              <IconBtn
                tooltip="Subir"
                icon="mdi-chevron-up"
                size="x-small"
                variant="text"
                :disabled="i === 0"
                @click="mover(i, -1)"
              />
              <IconBtn
                tooltip="Bajar"
                icon="mdi-chevron-down"
                size="x-small"
                variant="text"
                :disabled="i === borrador.length - 1"
                @click="mover(i, 1)"
              />
            </div>

            <v-text-field
              v-model="item.label"
              label="Nombre"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
            />

            <!-- Sólo en catálogos que declaran comportamiento (gastos,
                 puestos), y sólo en los elementos propios: el de fábrica es
                 parte del producto. -->
            <v-select
              v-if="defActual?.comportamiento && !item.isSystem"
              :model-value="item.behavior ?? defActual.comportamiento.porDefecto"
              :items="defActual.comportamiento.opciones"
              item-title="label"
              item-value="value"
              :label="defActual.comportamiento.label"
              variant="outlined"
              density="compact"
              hide-details
              class="elemento__comportamiento"
              @update:model-value="item.behavior = $event"
            />

            <v-tooltip text="Se puede seguir usando" location="top">
              <template #activator="{ props }">
                <v-switch
                  v-bind="props"
                  v-model="item.isActive"
                  color="success"
                  density="compact"
                  hide-details
                  label="Activo"
                  class="elemento__flag"
                />
              </template>
            </v-tooltip>

            <IconBtn
              v-if="!item.isSystem"
              tooltip="Quitar"
              icon="mdi-close"
              size="small"
              variant="text"
              color="error"
              @click="quitar(i)"
            />
            <v-tooltip v-else text="Lo trae el sistema: se desactiva, no se elimina" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" size="18" color="medium-emphasis" class="mx-2">
                  mdi-lock-outline
                </v-icon>
              </template>
            </v-tooltip>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="abierto = null">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!puedeGuardar"
            @click="guardar"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
.elemento {
  border-top: 1px solid rgb(var(--v-theme-borderColor));

  &:first-of-type {
    border-top: none;
  }

  &__flag {
    flex: 0 0 auto;
  }

  &__comportamiento {
    flex: 0 0 200px;
  }
}
</style>
