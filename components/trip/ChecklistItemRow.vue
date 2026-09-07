<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useChecklistStore,
  type ChecklistAnswer,
  type ChecklistItem,
} from "~/stores/checklist";
import VoiceTextField from "~/components/form/VoiceTextField.vue";
import VoiceTextarea from "~/components/form/VoiceTextarea.vue";

const props = defineProps<{ item: ChecklistItem; disabled?: boolean }>();

const checklistStore = useChecklistStore();

/**
 * El estado lo manda el servidor —es él quien decide qué significa la
 * respuesta—, así que se lee de la prop y no se copia a un `ref`: con una copia
 * local, el ítem quedaba pintado con el estado viejo después de recargar.
 */
const status = computed(() => props.item.status);

// Las observaciones sí son `ref`: es un campo que el chofer está tipeando y no
// se puede repintar debajo del cursor.
const notes = ref(props.item.notes ?? "");

const tipo = computed(() => props.item.type ?? "condition");
const esperada = computed<ChecklistAnswer>(() => props.item.expectedAnswer ?? "yes");

/**
 * Cuál fue la respuesta del chofer.
 *
 * Los checklists emitidos antes de que existiera `answer` sólo tienen `status`:
 * se deduce hacia atrás para que la pantalla los siga mostrando contestados.
 */
const respuesta = computed<ChecklistAnswer | null>(() => {
  if (props.item.answer) return props.item.answer;
  if (status.value === "na") return null;
  const conforme = status.value === "ok";
  return conforme ? esperada.value : esperada.value === "yes" ? "no" : "yes";
});

/**
 * Con qué etiquetas se dibujan los botones.
 *
 * Cuando la respuesta buena es SÍ, el punto se lee como un estado —«Luces»,
 * «Frenos»— y OK/Falla es lo que el chofer viene leyendo desde siempre. Cuando
 * la buena es NO, el punto es una pregunta en negativo —«¿tiene pérdidas de
 * aceite?»— y ahí OK/Falla se vuelve una trampa: hay que preguntar sí o no y
 * dejar que el color diga cuál de las dos es la mala.
 */
const opciones = computed(() => {
  const [siLabel, noLabel] =
    esperada.value === "no" ? ["Sí", "No"] : ["OK", "Falla"];
  return [
    { answer: "yes" as const, label: siLabel },
    { answer: "no" as const, label: noLabel },
    { answer: "na" as const, label: "N/A" },
  ].map((o) => {
    const conforme = o.answer === esperada.value;
    return {
      ...o,
      color: o.answer === "na" ? "grey-darken-1" : conforme ? "success" : "error",
      icon:
        o.answer === "na" ? "mdi-minus" : conforme ? "mdi-check" : "mdi-alert",
    };
  });
});

// ── Fotos ──
const fotos = computed(() => checklistStore.fotosDe(props.item.id));
const minFotos = computed(() =>
  props.item.requiresPhoto ? Math.max(props.item.minPhotos ?? 1, 1) : 0,
);
const exigeFotoPorFalla = computed(
  () => !!props.item.requiresPhotoOnFail && status.value === "fail",
);
const faltanFotos = computed(() => {
  if (exigeFotoPorFalla.value && fotos.value < 1) return true;
  return fotos.value < minFotos.value;
});
const llegoAlTope = computed(
  () => props.item.maxPhotos != null && fotos.value >= props.item.maxPhotos,
);

// Se manda la respuesta, no el estado: qué significa un «sí» lo decide el
// servidor contra la respuesta esperada del punto.
const onAnswer = (answer: ChecklistAnswer) =>
  checklistStore.updateItem(props.item.id, { answer });

/** La declaración se acepta o no: aceptada es la única forma de poder firmar. */
const onAck = (aceptada: boolean | null) =>
  checklistStore.updateItem(props.item.id, { answer: aceptada ? "yes" : "na" });

const onNotesBlur = () => {
  if (notes.value !== (props.item.notes ?? ""))
    checklistStore.updateItem(props.item.id, { notes: notes.value });
};

const onPhoto = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) await checklistStore.updateItem(props.item.id, {}, file);
  (e.target as HTMLInputElement).value = "";
};

const aceptada = computed(() => status.value === "ok");
</script>

<template>
  <v-card
    border
    flat
    rounded="lg"
    class="mb-3 checklist-item"
    :class="`checklist-item--${status}`"
  >
    <v-card-text class="pa-4">
      <div class="d-flex align-center ga-2 mb-1 flex-wrap">
        <span class="text-subtitle-1 font-weight-bold">{{ item.label }}</span>
        <!-- La empresa marcó este punto como crítico: si falla, el checklist
             queda rechazado y el camión no sale. Se avisa antes, no después. -->
        <v-chip v-if="item.isCritical" size="x-small" color="error" label>
          Crítico
        </v-chip>
        <!-- No frena la salida, pero la condiciona: la resuelve una persona. -->
        <v-chip
          v-else-if="item.requiresValidationOnFail"
          size="x-small"
          color="warning"
          label
        >
          Valida Tráfico
        </v-chip>
        <v-spacer />
        <v-chip
          v-if="fotos"
          size="small"
          color="success"
          variant="tonal"
          prepend-icon="mdi-camera-check"
        >
          {{ fotos }}
        </v-chip>
      </div>

      <!-- La advertencia que la empresa puso en la planilla: el chofer la tiene
           que leer acá, no en un instructivo aparte que nadie abre. -->
      <p
        v-if="item.helpText"
        class="text-caption text-medium-emphasis mb-0 mt-1"
        style="white-space: pre-line"
      >
        {{ item.helpText }}
      </p>

      <!-- ── Declaración: se acepta, no se evalúa ── -->
      <v-checkbox
        v-if="tipo === 'ack'"
        :model-value="aceptada"
        :disabled="disabled"
        color="primary"
        density="comfortable"
        hide-details
        class="mt-2"
        label="Leído y acepto"
        @update:model-value="onAck($event)"
      />

      <!--
        Botonera propia en vez de v-btn-toggle: el toggle pega los tres botones
        (`divided`) y con el camión en marcha un roce cambia la respuesta de al
        lado. Acá van separados, a un tercio del ancho cada uno y con 48px de
        alto —el mínimo táctil recomendado—, que además es lo que permite
        contestar con el pulgar sin mirar.
      -->
      <div
        v-else-if="tipo === 'condition'"
        class="d-flex ga-2 mt-3"
        role="group"
        :aria-label="`Respuesta de ${item.label}`"
      >
        <v-btn
          v-for="o in opciones"
          :key="o.answer"
          :disabled="disabled"
          :color="respuesta === o.answer ? o.color : undefined"
          :variant="respuesta === o.answer ? 'flat' : 'outlined'"
          :aria-pressed="respuesta === o.answer"
          :prepend-icon="respuesta === o.answer ? o.icon : undefined"
          size="small"
          class="checklist-item__status"
          rounded="lg"
          @click="onAnswer(o.answer)"
        >
          {{ o.label }}
        </v-btn>
      </div>

      <!-- La foto es obligatoria para firmar: mejor enterarse acá que cuando el
           backend rechaza la firma, que en la ruta puede ser mucho después. -->
      <v-alert
        v-if="faltanFotos && !disabled"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        <template v-if="exigeFotoPorFalla && !minFotos">
          Sacale una foto a esta falla: sin la foto no vas a poder firmar.
        </template>
        <template v-else>
          Faltan fotos ({{ fotos }} de {{ minFotos }}): sin ellas no vas a poder
          firmar.
        </template>
      </v-alert>

      <v-alert
        v-if="item.maxPhotos != null && llegoAlTope"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        Llegaste al máximo de {{ item.maxPhotos }}
        {{ item.maxPhotos === 1 ? "foto" : "fotos" }}.
      </v-alert>

      <div class="d-flex ga-2 align-center mt-3">
        <!-- Un punto de texto libre es todo campo: se le da lugar para escribir
             de verdad, no un renglón. -->
        <VoiceTextarea
          v-if="tipo === 'text'"
          v-model="notes"
          label="Escribí lo que consideres importante"
          variant="outlined"
          density="comfortable"
          rows="3"
          auto-grow
          hide-details
          class="flex-grow-1"
          :readonly="disabled"
          @blur="onNotesBlur"
        />
        <VoiceTextField
          v-else
          v-model="notes"
          :label="status === 'fail' ? 'Describí la falla' : 'Observaciones'"
          variant="outlined"
          density="comfortable"
          hide-details
          class="flex-grow-1"
          :readonly="disabled"
          @blur="onNotesBlur"
        />
        <IconBtn
          v-if="!disabled && tipo !== 'text'"
          :tooltip="llegoAlTope ? 'Llegaste al máximo de fotos' : 'Tomar foto'"
          icon="mdi-camera"
          variant="tonal"
          :disabled="llegoAlTope"
          :color="fotos ? 'success' : undefined"
          class="checklist-item__photo"
          @click="($refs.fileInput as HTMLInputElement).click()"
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          @change="onPhoto"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* Franja de color al costado: de un vistazo, y sin leer, se ve qué quedó
   marcado como falla mientras se baja por la lista. */
.checklist-item {
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: transparent;
}
.checklist-item--ok {
  border-left-color: rgb(var(--v-theme-success));
}
.checklist-item--fail {
  border-left-color: rgb(var(--v-theme-error));
}

/* Ancho completo a un tercio cada uno; alto cómodo pero sin ser un bloque:
   40px sigue por encima del mínimo táctil sin dominar la tarjeta. */
.checklist-item__status {
  flex: 1 1 0;
  min-height: 40px;
  min-width: 0;
}

/* El botón de foto acompaña el alto del campo de observaciones. */
.checklist-item__photo {
  width: 40px;
  height: 40px;
}
</style>
