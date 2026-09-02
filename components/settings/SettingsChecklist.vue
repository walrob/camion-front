<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  useChecklistTemplateStore,
  type ChecklistTemplate,
  type ChecklistTemplateItem,
} from "~/stores/checklistTemplate";
import { useFleetStore } from "~/stores/fleet";
import EmptyState from "~/components/shared/EmptyState.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import { useGeneralStore } from "~/stores/general";
import { Feature } from "~/types/plan";

/**
 * Editor de las plantillas del checklist pre-viaje.
 *
 * La plantilla **general** aplica a toda unidad que no tenga una propia; las
 * demás se atan a un tipo de camión, porque un tractor con cisterna no se
 * revisa como un furgón (docs/CONFIGURACION.md §6.1).
 */
const store = useChecklistTemplateStore();
const { templates, defaults, loading, saving } = storeToRefs(store);

const fleet = useFleetStore();

// El gating real lo hace el backend; esto es para no ofrecer un botón que
// después va a rebotar con un 403 (MODELO-COMERCIAL §12).
const { has } = useFeatures();
const puedeEditar = computed(() => has(Feature.CHECKLIST_TEMPLATES));
const puedePorTipo = computed(() => has(Feature.CHECKLIST_BY_TYPE));

/** Tipos de unidad ya cargados en la flota: evita que un tipo con un typo deje
 *  la plantilla sin aplicarse nunca, que es una falla silenciosa. */
const tiposDeUnidad = computed(() =>
  [...new Set((fleet.trucks ?? []).map((t: any) => t.type).filter(Boolean))].sort(),
);

const dialogo = ref(false);
const editandoId = ref<string | undefined>();
const form = ref<{
  name: string;
  vehicleType: string | null;
  items: ChecklistTemplateItem[];
}>({ name: "", vehicleType: null, items: [] });

/** Clave estable a partir del nombre. Se calcula una sola vez, al crear el
 *  ítem: si se recalculara al renombrarlo, se perdería el hilo con el histórico. */
const clavear = (label: string) =>
  label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || `item_${Date.now()}`;

const abrirNueva = async () => {
  await store.getDefaults();
  editandoId.value = undefined;
  form.value = {
    name: templates.value.length ? "" : "Checklist general",
    vehicleType: null,
    // Precargada con los ítems de siempre: se ajusta lo que haga falta en vez
    // de escribir todo de cero.
    items: defaults.value.map((d) => ({ ...d })),
  };
  dialogo.value = true;
};

const abrirEdicion = (t: ChecklistTemplate) => {
  editandoId.value = t.id;
  form.value = {
    name: t.name,
    vehicleType: t.vehicleType,
    items: t.items.map((i) => ({ ...i })),
  };
  dialogo.value = true;
};

const agregarItem = () => {
  form.value.items.push({
    key: "",
    label: "",
    order: form.value.items.length,
    isCritical: false,
    requiresPhotoOnFail: false,
    isActive: true,
  });
};

const quitarItem = (i: number) => form.value.items.splice(i, 1);

const mover = (i: number, delta: number) => {
  const destino = i + delta;
  if (destino < 0 || destino >= form.value.items.length) return;
  const [item] = form.value.items.splice(i, 1);
  form.value.items.splice(destino, 0, item);
};

const puedeGuardar = computed(
  () =>
    !!form.value.name.trim() &&
    form.value.items.length > 0 &&
    form.value.items.every((i) => i.label.trim()),
);

const guardar = async () => {
  if (!puedeGuardar.value) return;
  const payload = {
    name: form.value.name.trim(),
    vehicleType: form.value.vehicleType || null,
    items: form.value.items.map((item, i) => ({
      // Los ítems que ya existían conservan su clave; los nuevos la reciben acá.
      key: item.key || clavear(item.label),
      label: item.label.trim(),
      order: i,
      isCritical: item.isCritical,
      requiresPhotoOnFail: item.requiresPhotoOnFail,
      isActive: item.isActive,
    })),
  };
  const ok = await store.save(payload, editandoId.value);
  if (ok) dialogo.value = false;
};

const confirmar = ref<{ abierto: boolean; id: string }>({ abierto: false, id: "" });
const eliminar = async (payload: { resp: boolean }) => {
  if (!payload?.resp) return;
  await store.remove(confirmar.value.id);
};

// ── Planilla OEA ──────────────────────────────────────────────────────────
// Los 7 puntos AFIP + precintos son piso normativo y no se editan; la empresa
// suma los suyos (docs/CONFIGURACION.md §6.2).
const SECCIONES_OEA = [
  { value: "physical", label: "Inspección física" },
  { value: "security_devices", label: "Dispositivos de seguridad" },
];

const oeaBase = ref<{ key: string; label: string }[]>([]);
const oeaPropios = ref<
  { key: string; label: string; section: string; isActive: boolean }[]
>([]);
const oeaGuardando = ref(false);

const puedeGuardarOea = computed(() =>
  oeaPropios.value.every((p) => p.label.trim()),
);

const cargarOea = async () => {
  const { $api } = useNuxtApp();
  try {
    const { data } = await $api.get("oea/template/");
    oeaBase.value = data.base;
    oeaPropios.value = data.propios.map((p: any) => ({ ...p }));
  } catch {
    // La planilla es un extra de la pantalla: si falla, el resto sigue andando.
  }
};

const agregarPuntoOea = () =>
  oeaPropios.value.push({
    key: "",
    label: "",
    section: "physical",
    isActive: true,
  });

const guardarOea = async () => {
  if (!puedeGuardarOea.value) return;
  const { $api } = useNuxtApp();
  const general = useGeneralStore();
  oeaGuardando.value = true;
  try {
    const { data } = await $api.put("oea/template/", {
      items: oeaPropios.value.map((p, i) => ({
        key: p.key || clavear(p.label),
        label: p.label.trim(),
        section: p.section,
        order: i,
        isActive: p.isActive,
      })),
    });
    oeaBase.value = data.base;
    oeaPropios.value = data.propios.map((p: any) => ({ ...p }));
    general.setSuccessSnackbar("Planilla OEA guardada.");
  } catch (e) {
    general.setErrorSnackbar(e);
  } finally {
    oeaGuardando.value = false;
  }
};

onMounted(() => {
  store.getTemplates();
  if (!fleet.trucks?.length) fleet.getTrucks();
  cargarOea();
});
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
      Mientras no crees ninguna plantilla, el checklist usa los siete puntos de
      siempre. Los cambios valen para los <strong>viajes nuevos</strong>: los
      checklists ya firmados conservan los puntos con los que se revisó la unidad
      ese día.
    </v-alert>

    <!-- El plan no incluye armar la plantilla: se ve qué es y con qué plan
         viene, en vez de esconderlo (MODELO-COMERCIAL §6.2). -->
    <v-card v-if="!puedeEditar" border flat rounded="lg" class="mb-4">
      <v-card-text class="pa-5 d-flex align-center ga-4 flex-wrap">
        <v-icon color="medium-emphasis" size="24">mdi-lock-outline</v-icon>
        <div class="min-w-0 flex-grow-1">
          <div class="text-subtitle-2 font-weight-bold">
            Armar tu propio checklist viene con el plan Operación
          </div>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Con tu plan actual, el checklist usa los siete puntos por defecto.
          </p>
        </div>
        <v-btn color="primary" variant="tonal" to="/upgrade/checklist_templates">
          Ver qué incluye
        </v-btn>
      </v-card-text>
    </v-card>

    <div v-else class="d-flex mb-4">
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirNueva">
        Nueva plantilla
      </v-btn>
    </div>

    <div v-if="loading && !templates.length" class="d-flex justify-center my-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <EmptyState
      v-else-if="!templates.length"
      icon="mdi-clipboard-check-outline"
      text="Todavía no configuraste ninguna plantilla. Creá una a partir de los puntos por defecto y ajustala a tu operación."
    />

    <v-card
      v-for="t in templates"
      :key="t.id"
      border
      flat
      rounded="lg"
      class="mb-4"
    >
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-3 flex-wrap">
          <span class="text-subtitle-1 font-weight-bold">{{ t.name }}</span>
          <v-chip size="x-small" label :color="t.vehicleType ? 'info' : 'primary'">
            {{ t.vehicleType ? `Tipo: ${t.vehicleType}` : "General" }}
          </v-chip>
          <v-chip v-if="!t.isActive" size="x-small" label color="grey">
            Inactiva
          </v-chip>
          <v-spacer />
          <template v-if="puedeEditar">
            <IconBtn
              tooltip="Editar plantilla"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="abrirEdicion(t)"
            />
            <IconBtn
              tooltip="Eliminar plantilla"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmar = { abierto: true, id: t.id }"
            />
          </template>
        </div>

        <div
          v-for="item in t.items"
          :key="item.key"
          class="d-flex align-center ga-2 py-1 text-body-2"
        >
          <v-icon size="16" color="medium-emphasis">mdi-checkbox-blank-circle-outline</v-icon>
          <span :class="{ 'text-medium-emphasis': !item.isActive }">
            {{ item.label }}
          </span>
          <v-chip v-if="item.isCritical" size="x-small" label color="error">
            Crítico
          </v-chip>
          <v-chip v-if="item.requiresPhotoOnFail" size="x-small" label color="warning">
            Foto si falla
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Editor -->
    <v-dialog v-model="dialogo" max-width="760" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold">
          {{ editandoId ? "Editar plantilla" : "Nueva plantilla" }}
        </v-card-title>

        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.name"
                label="Nombre *"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-combobox
                v-model="form.vehicleType"
                :items="tiposDeUnidad"
                :disabled="!puedePorTipo"
                :append-inner-icon="puedePorTipo ? undefined : 'mdi-lock-outline'"
                label="Tipo de unidad"
                placeholder="Dejalo vacío para que aplique a todas"
                variant="outlined"
                density="comfortable"
                clearable
                :hint="
                  puedePorTipo
                    ? 'Si una unidad no tiene plantilla de su tipo, usa la general.'
                    : 'Tener una plantilla por tipo de unidad viene con el plan Gestión. Tu plantilla aplica a toda la flota.'
                "
                persistent-hint
              />
            </v-col>
          </v-row>

          <div class="d-flex align-center mt-5 mb-2">
            <span class="text-subtitle-2 font-weight-bold">Puntos a revisar</span>
            <v-spacer />
            <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="agregarItem">
              Agregar
            </v-btn>
          </div>

          <div
            v-for="(item, i) in form.items"
            :key="i"
            class="punto d-flex align-center ga-2 py-2"
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
                :disabled="i === form.items.length - 1"
                @click="mover(i, 1)"
              />
            </div>

            <v-text-field
              v-model="item.label"
              label="Punto"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
            />

            <v-tooltip text="Si falla, el checklist queda rechazado" location="top">
              <template #activator="{ props }">
                <v-switch
                  v-bind="props"
                  v-model="item.isCritical"
                  color="error"
                  density="compact"
                  hide-details
                  inset
                  label="Crítico"
                  class="punto__flag"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Si falla, el chofer tiene que adjuntar la foto" location="top">
              <template #activator="{ props }">
                <v-switch
                  v-bind="props"
                  v-model="item.requiresPhotoOnFail"
                  color="warning"
                  density="compact"
                  hide-details
                  inset
                  label="Foto"
                  class="punto__flag"
                />
              </template>
            </v-tooltip>

            <IconBtn
              tooltip="Quitar punto"
              icon="mdi-close"
              size="small"
              variant="text"
              color="error"
              @click="quitarItem(i)"
            />
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogo = false">Cancelar</v-btn>
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

    <!-- ── Planilla OEA ───────────────────────────────────────────────── -->
    <v-divider class="my-6" />

    <div class="text-subtitle-1 font-weight-bold mb-1">Planilla OEA</div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Los <strong>7 puntos AFIP y los precintos</strong> son un piso normativo: no
      se editan ni se desactivan. Lo que sí podés hacer es <strong>agregar</strong>
      los puntos propios de tu operación.
    </p>

    <v-card border flat rounded="lg" class="mb-4">
      <v-card-text class="pa-5">
        <div class="text-caption text-medium-emphasis mb-2">
          Puntos de la norma ({{ oeaBase.length }})
        </div>
        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-chip v-for="p in oeaBase" :key="p.key" size="small" label variant="outlined">
            <v-icon start size="14">mdi-lock-outline</v-icon>
            {{ p.label }}
          </v-chip>
        </div>

        <div class="d-flex align-center mb-2">
          <span class="text-subtitle-2 font-weight-bold">Puntos propios</span>
          <v-spacer />
          <v-btn
            v-if="puedeEditar"
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="agregarPuntoOea"
          >
            Agregar
          </v-btn>
        </div>

        <p v-if="!oeaPropios.length" class="text-body-2 text-medium-emphasis mb-0">
          Todavía no agregaste ninguno: la planilla usa sólo los puntos de la norma.
        </p>

        <div
          v-for="(punto, i) in oeaPropios"
          :key="i"
          class="punto d-flex align-center ga-2 py-2"
        >
          <v-text-field
            v-model="punto.label"
            label="Punto a revisar"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <v-select
            v-model="punto.section"
            :items="SECCIONES_OEA"
            item-title="label"
            item-value="value"
            label="Bloque"
            variant="outlined"
            density="compact"
            hide-details
            class="punto__seccion"
          />
          <v-switch
            v-model="punto.isActive"
            color="success"
            density="compact"
            hide-details
            inset
            label="Activo"
          />
          <IconBtn
            tooltip="Quitar punto"
            icon="mdi-close"
            size="small"
            variant="text"
            color="error"
            @click="oeaPropios.splice(i, 1)"
          />
        </div>

        <div v-if="puedeEditar" class="d-flex mt-3">
          <v-spacer />
          <v-btn
            color="primary"
            :loading="oeaGuardando"
            :disabled="!puedeGuardarOea"
            @click="guardarOea"
          >
            Guardar planilla
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <ModalConfirm
      v-model="confirmar.abierto"
      title="Eliminar plantilla"
      description="<p>¿Eliminar esta plantilla?</p><p>Los checklists ya emitidos no se tocan: conservan los puntos con los que se firmaron.</p>"
      @save="eliminar"
    />
  </div>
</template>

<style scoped lang="scss">
.punto {
  border-top: 1px solid rgb(var(--v-theme-borderColor));

  &:first-of-type {
    border-top: none;
  }

  &__flag {
    flex: 0 0 auto;
  }

  &__seccion {
    flex: 0 0 220px;
  }
}
</style>
