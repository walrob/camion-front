<template>
  <!--
    Wrapper que recibe class/style del padre.
    El resto de los atributos (variant, density, rules, label, etc.)
    se reenvían al v-text-field interno via fieldAttrs.
  -->
  <div :class="($attrs as any).class" :style="($attrs as any).style">
    <v-text-field v-bind="fieldAttrs" v-model="model" autocomplete="new-password">
      <!-- ── Slots re-exportados ─────────────────────────────── -->
      <template v-if="$slots.prepend" #prepend="d">
        <slot name="prepend" v-bind="d ?? {}" />
      </template>

      <template v-if="$slots['prepend-inner']" #prepend-inner="d">
        <slot name="prepend-inner" v-bind="d ?? {}" />
      </template>

      <template v-if="$slots.append" #append="d">
        <slot name="append" v-bind="d ?? {}" />
      </template>

      <template v-if="$slots.label" #label="d">
        <slot name="label" v-bind="d ?? {}" />
      </template>

      <template v-if="$slots.message" #message="d">
        <slot name="message" v-bind="d ?? {}" />
      </template>

      <!-- ── append-inner: slot del usuario + botón micrófono ── -->
      <template #append-inner>
        <slot name="append-inner" />

        <v-tooltip v-if="!isReadonly" :text="tooltipText" location="top" :open-delay="400">
          <template #activator="{ props: tp }">
            <v-btn
              v-bind="tp"
              :icon="micIcon"
              :color="micColor"
              :disabled="!isSupported"
              :class="{ 'voice-mic--pulsing': isListening }"
              size="x-small"
              variant="text"
              tabindex="-1"
              aria-label="Dictado por voz"
              @click.stop="handleToggle"
            />
          </template>
        </v-tooltip>
      </template>
    </v-text-field>

    <!-- ── Feedback de voz (texto interino / error) ────────── -->
    <Transition name="voice-feedback">
      <div
        v-if="interimText || errorMessage"
        class="voice-feedback-row px-4"
        role="status"
        aria-live="polite"
      >
        <v-icon size="10" :color="isError ? 'error' : undefined" class="mr-1">
          {{ isError ? "mdi-alert-circle-outline" : "mdi-microphone" }}
        </v-icon>
        <span
          class="text-caption"
          :class="isError ? 'text-error' : 'text-medium-emphasis voice-interim'"
        >
          {{ interimText || errorMessage
          }}<template v-if="interimText">…</template>
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";

// ── Props ──────────────────────────────────────────────────────────────────────

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** BCP-47 language tag. Default: 'es-AR' */
    lang?: string;
    /** Una sola frase por grabación (ideal para campos cortos). Default: false */
    continuous?: boolean;
    /**
     * 'replace' — sobreescribe el valor actual con el texto dictado.
     * 'append'  — agrega el texto dictado al final del valor actual.
     * Default: 'replace'
     */
    appendMode?: "replace" | "append";
  }>(),
  {
    lang: "es-AR",
    continuous: false,
    appendMode: "replace",
  },
);

// ── Model ──────────────────────────────────────────────────────────────────────

const model = defineModel<string | null | undefined>();

// ── Attrs forwarding ───────────────────────────────────────────────────────────
// class y style van al div wrapper; el resto al v-text-field

const attrs = useAttrs();

const fieldAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const isReadonly = computed(() => !!attrs.readonly);

// ── Speech ─────────────────────────────────────────────────────────────────────

const { isSupported, isListening, isError, interimText, errorMessage, toggle } =
  useSpeechInput({ lang: props.lang, continuous: props.continuous });

const deduplicateAppend = (existing: string, incoming: string): string => {
  const eWords = existing.trim().split(/\s+/);
  const iWords = incoming.trim().split(/\s+/);

  let skip = 0;
  for (let len = Math.min(eWords.length, iWords.length); len > 0; len--) {
    const suffix = eWords.slice(-len).join(" ").toLowerCase();
    const prefix = iWords.slice(0, len).join(" ").toLowerCase();
    if (suffix === prefix) {
      skip = len;
      break;
    }
  }

  return iWords.slice(skip).join(" ").trim();
};

const handleToggle = () => {
  toggle((finalText) => {
    if (props.appendMode === "replace") {
      model.value = finalText;
    } else {
      const current = model.value?.trim() || "";
      if (!current) {
        model.value = finalText;
        return;
      }
      const toAppend = deduplicateAppend(current, finalText);
      if (toAppend) model.value = `${current} ${toAppend}`;
    }
  });
};

// ── Computed visuales ─────────────────────────────────────────────────────────

const micIcon = computed<string>(() => {
  if (!isSupported || isError.value) return "mdi-microphone-off";
  return "mdi-microphone";
});

const micColor = computed<string | undefined>(() => {
  if (isListening.value) return "success";
  if (isError.value) return "error";
  return undefined;
});

const tooltipText = computed<string>(() => {
  if (!isSupported) return "Voz no disponible en este navegador";
  if (isError.value) return errorMessage.value;
  if (isListening.value) return "Detener grabación";
  return "Dictado por voz";
});
</script>

<style scoped>
/* ── Botón pulsante mientras graba ─────────────────────────── */

.voice-mic--pulsing {
  animation: voice-pulse 1.4s ease-in-out infinite;
}

@keyframes voice-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.5);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
}

/* ── Texto de feedback ─────────────────────────────────────── */

.voice-feedback-row {
  display: flex;
  align-items: center;
  min-height: 18px;
  margin-top: -10px;
  margin-bottom: 6px;
}

.voice-interim {
  font-style: italic;
}

/* ── Transición ────────────────────────────────────────────── */

.voice-feedback-enter-active,
.voice-feedback-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.15s ease;
}

.voice-feedback-enter-from,
.voice-feedback-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
