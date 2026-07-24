<template>
  <v-text-field
    v-model="inputValue"
    :label="label"
    :variant="variant"
    :density="density"
    :min="min"
    :max="max"
    :rules="computedRules"
    :readonly="readonly"
    :placeholder="readonly ? '' : 'dd/mm/aaaa  ó  +2'"
    @blur="resolver"
    @keydown.enter.prevent="resolver"
  >
    <template v-if="!readonly" #append-inner>
      <IconBtn
        tooltip="Seleccionar fecha"
        icon="mdi-calendar"
        size="x-small"
        variant="text"
        color="primary"
        @click.stop="abrirCalendario"
      />
      <input
        ref="nativePickerRef"
        type="date"
        style="
          position: absolute;
          opacity: 0;
          pointer-events: none;
          width: 0;
          height: 0;
        "
        :value="resolvedDate"
        :min="min"
        :max="max"
        @change="onPickerChange"
      />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | undefined;
    label?: string;
    rules?: ((v: string) => true | string)[];
    readonly?: boolean;
    variant?: "outlined" | "filled" | "plain" | "solo" | "solo-filled" | "solo-inverted" | "underlined";
    density?: "default" | "comfortable" | "compact";
    min?: string;
    max?: string;
  }>(),
  {
    variant: "outlined",
    density: "compact",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputValue = ref("");
const resolvedDate = ref(""); // YYYY-MM-DD
const nativePickerRef = ref<HTMLInputElement>();

// ── Helpers ───

const toIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const formatDisplay = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const parseInput = (val: string): string | null => {
  val = val.trim();
  if (!val) return "";

  // Shortcut: +N o -N (relativo a hoy)
  if (/^[+-]\d+$/.test(val)) {
    const days = parseInt(val, 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toIso(d);
  }

  // dd/mm/yyyy o dd-mm-yyyy
  const sepMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (sepMatch) {
    const [, d, m, y] = sepMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // ddmmyyyy (8 dígitos sin separador)
  const compactMatch = val.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compactMatch) {
    const [, d, m, y] = compactMatch;
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD (ISO directo)
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  return null;
};

// ── Sincronizar desde el padre ───

watch(
  () => props.modelValue,
  (v) => {
    resolvedDate.value = v ?? "";
    inputValue.value = formatDisplay(v ?? "");
  },
  { immediate: true },
);

// ── Resolución del shortcut / parseo ───

const resolver = () => {
  const parsed = parseInput(inputValue.value);
  if (parsed !== null) {
    resolvedDate.value = parsed;
    inputValue.value = formatDisplay(parsed);
    emit("update:modelValue", parsed);
  }
  // Si parsed === null (entrada inválida), se deja el texto para que el
  // usuario lo corrija; no se emite nada.
};

// ── Calendario nativo ───

const abrirCalendario = () => {
  nativePickerRef.value?.showPicker?.();
};

const onPickerChange = (e: Event) => {
  const iso = (e.target as HTMLInputElement).value; // YYYY-MM-DD
  if (iso) {
    resolvedDate.value = iso;
    inputValue.value = formatDisplay(iso);
    emit("update:modelValue", iso);
  }
};

// ── Reglas con validación sobre la fecha resuelta ───

const computedRules = computed(() =>
  (props.rules ?? []).map((rule) => () => rule(resolvedDate.value)),
);
</script>
