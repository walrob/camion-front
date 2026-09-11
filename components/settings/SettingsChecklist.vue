<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  useChecklistTemplateStore,
  TIPOS_DE_PUNTO,
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
  code: string;
  revision: string;
  revisionDate: string;
  vehicleType: string | null;
  items: ChecklistTemplateItem[];
}>({
  name: "",
  code: "",
  revision: "",
  revisionDate: "",
  vehicleType: null,
  items: [],
});

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

/** Los valores nuevos, para que un ítem viejo no llegue con campos sin definir. */
const normalizar = (i: Partial<ChecklistTemplateItem>): ChecklistTemplateItem => ({
  key: i.key ?? "",
  label: i.label ?? "",
  section: i.section ?? null,
  helpText: i.helpText ?? null,
  type: i.type ?? "condition",
  expectedAnswer: i.expectedAnswer ?? "yes",
  order: i.order ?? 0,
  isCritical: i.isCritical ?? false,
  requiresPhotoOnFail: i.requiresPhotoOnFail ?? false,
  requiresPhoto: i.requiresPhoto ?? false,
  minPhotos: i.minPhotos ?? 1,
  maxPhotos: i.maxPhotos ?? null,
  requiresValidationOnFail: i.requiresValidationOnFail ?? false,
  isActive: i.isActive ?? true,
});

const abrirNueva = async () => {
  await store.getDefaults();
  editandoId.value = undefined;
  form.value = {
    name: templates.value.length ? "" : "Checklist general",
    code: "",
    revision: "",
    revisionDate: "",
    vehicleType: null,
    // Precargada con los ítems de siempre: se ajusta lo que haga falta en vez
    // de escribir todo de cero.
    items: defaults.value.map((d) => normalizar(d)),
  };
  dialogo.value = true;
};

const abrirEdicion = (t: ChecklistTemplate) => {
  editandoId.value = t.id;
  form.value = {
    name: t.name,
    code: t.code ?? "",
    revision: t.revision ?? "",
    revisionDate: (t.revisionDate ?? "").slice(0, 10),
    vehicleType: t.vehicleType,
    items: t.items.map((i) => normalizar(i)),
  };
  dialogo.value = true;
};

const agregarItem = () => {
  form.value.items.push(
    normalizar({
      order: form.value.items.length,
      // Hereda el bloque del punto anterior: una planilla se carga bloque por
      // bloque, y volver a tipearlo en cada punto es donde aparecen los typos
      // que después parten una sección en dos.
      section: form.value.items.at(-1)?.section ?? null,
    }),
  );
};

const quitarItem = (i: number) => form.value.items.splice(i, 1);

const mover = (i: number, delta: number) => {
  const destino = i + delta;
  if (destino < 0 || destino >= form.value.items.length) return;
  const [item] = form.value.items.splice(i, 1);
  form.value.items.splice(destino, 0, item);
};

/** Los bloques ya usados en esta plantilla, para ofrecerlos en el combo. */
const seccionesUsadas = computed(() =>
  [...new Set(form.value.items.map((i) => i.section).filter(Boolean))] as string[],
);

// ── Opciones de un punto ──
const opcionesDe = ref<number | null>(null);
const itemEnOpciones = computed(() =>
  opcionesDe.value == null ? null : form.value.items[opcionesDe.value],
);

const puedeGuardar = computed(
  () =>
    !!form.value.name.trim() &&
    form.value.items.length > 0 &&
    form.value.items.every((i) => i.label.trim()) &&
    // Mismo criterio que el backend: un tope menor al mínimo deja un punto que
    // el chofer no puede completar nunca.
    form.value.items.every(
      (i) => i.maxPhotos == null || i.maxPhotos >= (i.minPhotos ?? 1),
    ),
);

const guardar = async () => {
  if (!puedeGuardar.value) return;
  const payload = {
    name: form.value.name.trim(),
    code: form.value.code.trim() || null,
    revision: form.value.revision.trim() || null,
    revisionDate: form.value.revisionDate || null,
    vehicleType: form.value.vehicleType || null,
    items: form.value.items.map((item, i) => ({
      // Los ítems que ya existían conservan su clave; los nuevos la reciben acá.
      key: item.key || clavear(item.label),
      label: item.label.trim(),
      section: item.section?.trim() || null,
      helpText: item.helpText?.trim() || null,
      type: item.type,
      expectedAnswer: item.expectedAnswer,
      order: i,
      isCritical: item.isCritical,
      requiresPhotoOnFail: item.requiresPhotoOnFail,
      // Un punto de fotos exige foto por definición: si no, no es un punto de
      // fotos, y el backend lo rechaza.
      requiresPhoto: item.type === "photo" ? true : item.requiresPhoto,
      minPhotos: item.minPhotos ?? 1,
      maxPhotos: item.maxPhotos ?? null,
      requiresValidationOnFail: item.requiresValidationOnFail,
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

/** Las etiquetas del punto, para verlas sin abrir el editor. */
const chipsDe = (item: ChecklistTemplateItem) => {
  const chips: { text: string; color: string }[] = [];
  if (item.type && item.type !== "condition") {
    chips.push({
      text: TIPOS_DE_PUNTO.find((t) => t.value === item.type)?.label ?? item.type,
      color: "secondary",
    });
  }
  if (item.expectedAnswer === "no")
    chips.push({ text: "Lo bueno es NO", color: "info" });
  if (item.isCritical) chips.push({ text: "Crítico", color: "error" });
  if (item.requiresValidationOnFail)
    chips.push({ text: "Valida Tráfico", color: "warning" });
  if (item.requiresPhoto)
    chips.push({
      text: (item.minPhotos ?? 1) > 1 ? `${item.minPhotos} fotos` : "Foto siempre",
      color: "warning",
    });
  else if (item.requiresPhotoOnFail)
    chips.push({ text: "Foto si falla", color: "warning" });
  return chips;
};

// ── Planilla OEA ──────────────────────────────────────────────────────────
// Los 7 puntos AFIP + precintos son piso normativo y no se editan; la empresa
// suma los suyos (docs/CONFIGURACION.md §6.2).
const SECCIONES_OEA = [
  { value: "physical", label: "Inspección física" },
  { value: "security_devices", label: "Dispositivos de seguridad" },
];

const oeaBase = ref<{ key: string; label: string }[]>([]);
// `enUso`: en cuántas planillas ya se revisó el punto. Uno usado no se puede
// eliminar (la planilla firmada tiene que seguir explicando qué se revisó): se
// desactiva. Uno sin uso se quita con la X y al guardar se elimina.
const oeaPropios = ref<
  {
    key: string;
    label: string;
    section: string;
    isActive: boolean;
    enUso: number;
  }[]
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
    enUso: 0,
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
        <div class="d-flex align-center ga-2 mb-1 flex-wrap">
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

        <!-- El código y la revisión del formulario: es por ese nombre que una
             auditoría lo pide, y cada checklist emitido guarda una copia. -->
        <p v-if="t.code || t.revision" class="text-caption text-medium-emphasis mb-3">
          {{ [t.code, t.revision].filter(Boolean).join(" · ") }}
          <span v-if="t.revisionDate">
            · {{ String(t.revisionDate).slice(0, 10) }}</span
          >
        </p>

        <div
          v-for="item in t.items"
          :key="item.key"
          class="d-flex align-center ga-2 py-1 text-body-2 flex-wrap"
        >
          <v-icon size="16" color="medium-emphasis">
            mdi-checkbox-blank-circle-outline
          </v-icon>
          <span
            v-if="item.section"
            class="text-caption text-medium-emphasis"
          >
            {{ item.section }} ·
          </span>
          <span :class="{ 'text-medium-emphasis': !item.isActive }">
            {{ item.label }}
          </span>
          <v-chip
            v-for="chip in chipsDe(item)"
            :key="chip.text"
            size="x-small"
            label
            :color="chip.color"
          >
            {{ chip.text }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Editor -->
    <v-dialog v-model="dialogo" max-width="860" scrollable>
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

          <!-- Identidad documental. Opcional: una empresa sin sistema de calidad
               no tiene código de formulario y no debería tener que inventarlo. -->
          <v-row dense class="mt-2">
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.code"
                label="Código del formulario"
                placeholder="RIP 06 09 01"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.revision"
                label="Revisión"
                placeholder="REV.04"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.revisionDate"
                label="Fecha de revisión"
                type="date"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12">
              <p class="text-caption text-medium-emphasis mb-0 mt-1">
                Cada planilla emitida guarda una copia del código y la revisión:
                es lo que permite responder con qué versión del formulario firmó
                el chofer ese día.
              </p>
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
            class="punto d-flex align-center ga-2 py-2 flex-wrap"
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

            <div class="punto__campos flex-grow-1">
              <v-text-field
                v-model="item.label"
                label="Punto"
                variant="outlined"
                density="compact"
                hide-details
              />
              <div class="d-flex ga-1 mt-1 flex-wrap">
                <v-chip
                  v-for="chip in chipsDe(item)"
                  :key="chip.text"
                  size="x-small"
                  label
                  :color="chip.color"
                >
                  {{ chip.text }}
                </v-chip>
              </div>
            </div>

            <v-combobox
              v-model="item.section"
              :items="seccionesUsadas"
              label="Bloque"
              placeholder="Sin bloque"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="punto__seccion"
            />

            <IconBtn
              tooltip="Opciones del punto"
              icon="mdi-tune"
              size="small"
              variant="text"
              @click="opcionesDe = i"
            />
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

    <!-- Opciones de un punto. Van en su propio diálogo y no en la fila: son
         nueve campos, y metidos en la lista vuelven ilegible la plantilla. -->
    <v-dialog
      :model-value="opcionesDe !== null"
      max-width="600"
      scrollable
      @update:model-value="opcionesDe = null"
    >
      <v-card v-if="itemEnOpciones" rounded="lg">
        <v-card-title class="text-h6 font-weight-bold">
          {{ itemEnOpciones.label || "Opciones del punto" }}
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="itemEnOpciones.type"
            :items="TIPOS_DE_PUNTO"
            item-title="label"
            item-value="value"
            label="Tipo de punto"
            variant="outlined"
            density="comfortable"
            :hint="TIPOS_DE_PUNTO.find((t) => t.value === itemEnOpciones!.type)?.help"
            persistent-hint
            class="mb-4"
          />

          <!-- La polaridad sólo tiene sentido en una pregunta. En una
               declaración o en un punto de fotos no hay respuesta que evaluar. -->
          <template v-if="itemEnOpciones.type === 'condition'">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              ¿Cuál es la respuesta que indica que está todo bien?
            </div>
            <p class="text-caption text-medium-emphasis mb-2">
              «¿Los zunchos están OK?» espera <strong>Sí</strong>. «¿Tiene
              pérdidas de aceite?» espera <strong>No</strong>: ahí el sí es la
              respuesta mala.
            </p>
            <v-btn-toggle
              v-model="itemEnOpciones.expectedAnswer"
              mandatory
              variant="outlined"
              divided
              density="comfortable"
              class="mb-4"
            >
              <v-btn value="yes">Sí</v-btn>
              <v-btn value="no">No</v-btn>
            </v-btn-toggle>
          </template>

          <v-textarea
            v-model="itemEnOpciones.helpText"
            label="Texto de ayuda o advertencia"
            placeholder="En caso de presentar alguna alarma, avisar de inmediato a su operador de tráfico."
            variant="outlined"
            density="comfortable"
            rows="2"
            auto-grow
            class="mb-2"
            hint="Se le muestra al chofer junto al punto."
            persistent-hint
          />

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Qué pasa si falla</div>
          <v-switch
            v-model="itemEnOpciones.isCritical"
            color="error"
            density="compact"
            hide-details
            label="Crítico: la planilla queda rechazada y el camión no sale"
          />
          <v-switch
            v-model="itemEnOpciones.requiresValidationOnFail"
            color="warning"
            density="compact"
            hide-details
            label="Requiere validación de Tráfico antes de liberar la unidad"
            :disabled="itemEnOpciones.isCritical"
            :messages="
              itemEnOpciones.isCritical
                ? 'Un punto crítico no se valida: directamente no sale.'
                : undefined
            "
          />

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Fotos</div>
          <v-switch
            v-model="itemEnOpciones.requiresPhotoOnFail"
            color="warning"
            density="compact"
            hide-details
            label="Exigir foto cuando el punto falla"
          />
          <v-switch
            v-model="itemEnOpciones.requiresPhoto"
            color="warning"
            density="compact"
            hide-details
            label="Exigir foto siempre, salga como salga"
            :disabled="itemEnOpciones.type === 'photo'"
            :messages="
              itemEnOpciones.type === 'photo'
                ? 'Un punto de fotos siempre las exige.'
                : undefined
            "
          />
          <v-row dense class="mt-2">
            <v-col cols="6">
              <v-text-field
                v-model.number="itemEnOpciones.minPhotos"
                label="Mínimo"
                type="number"
                min="1"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="itemEnOpciones.maxPhotos"
                label="Máximo"
                type="number"
                min="1"
                variant="outlined"
                density="compact"
                placeholder="Sin tope"
                clearable
                :error="
                  itemEnOpciones.maxPhotos != null &&
                  itemEnOpciones.maxPhotos < (itemEnOpciones.minPhotos ?? 1)
                "
                :error-messages="
                  itemEnOpciones.maxPhotos != null &&
                  itemEnOpciones.maxPhotos < (itemEnOpciones.minPhotos ?? 1)
                    ? 'No puede ser menor que el mínimo.'
                    : undefined
                "
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-switch
            v-model="itemEnOpciones.isActive"
            color="success"
            density="compact"
            hide-details
            label="Activo"
            messages="Un punto desactivado deja de pedirse en las planillas nuevas. Las ya firmadas lo conservan."
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="opcionesDe = null">
            Listo
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
            label="Activo"
          />
          <IconBtn
            v-if="!punto.enUso"
            tooltip="Quitar punto"
            icon="mdi-close"
            size="small"
            variant="text"
            color="error"
            @click="oeaPropios.splice(i, 1)"
          />
          <!-- Usado en planillas firmadas: no se elimina, se desactiva. -->
          <IconBtn
            v-else
            :tooltip="`Revisado en ${punto.enUso} planilla${punto.enUso === 1 ? '' : 's'}: no se puede eliminar, solo desactivar.`"
            icon="mdi-lock-outline"
            size="small"
            variant="text"
            class="text-medium-emphasis"
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

  &__campos {
    min-width: 220px;
  }

  &__seccion {
    flex: 0 0 200px;
  }
}
</style>
