<script setup lang="ts">
// Barra segmentada para un conteo **ordinal y corto**: severidades de
// incidente, niveles de alerta, ventanas de vencimiento.
//
// Reemplaza a la torta en estos casos a propósito. La torta desordena una
// secuencia que tiene orden natural (crítica → aviso), obliga a comparar
// ángulos para ver cuál pesa más y gasta media pantalla en cuatro números. La
// barra conserva el orden, se compara de un vistazo y deja lugar para la
// leyenda con las cifras exactas, que es lo que el gerente termina leyendo.
import { computed } from "vue";
import { NuxtLink } from "#components";
import EmptyState from "~/components/shared/EmptyState.vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    /** En orden de severidad/urgencia: así se dibuja y así se lee. */
    items: { label: string; value: number; color: string; to?: string }[];
    emptyText?: string;
    emptyIcon?: string;
  }>(),
  { emptyText: "Sin pendientes.", emptyIcon: "mdi-check-circle-outline" },
);

const { chartHex } = useChartColors();
const { num } = useFormatters();

const total = computed(() =>
  props.items.reduce((suma, i) => suma + (i.value || 0), 0),
);

// Sólo los tramos con valor: un segmento de ancho cero igual dibuja su borde y
// ensucia la barra.
const tramos = computed(() =>
  props.items
    .filter((i) => i.value > 0)
    .map((i) => ({
      ...i,
      pct: (i.value / total.value) * 100,
      hex: chartHex(i.color),
    })),
);
</script>

<template>
  <div>
    <div v-if="title" class="d-flex align-center mb-2">
      <span class="text-subtitle-2 font-weight-bold">{{ title }}</span>
      <v-spacer />
      <span class="text-caption text-medium-emphasis">{{ num(total) }}</span>
    </div>

    <template v-if="total">
      <div class="strip">
        <div
          v-for="t in tramos"
          :key="t.label"
          class="strip__seg"
          :style="{ width: `${t.pct}%`, background: t.hex }"
          :title="`${t.label}: ${t.value}`"
        />
      </div>

      <!--
        Leyenda en columna y no en fila: las cifras quedan alineadas a la
        derecha, que es como se comparan de un vistazo. En fila, con tarjetas
        angostas, los números terminan desparramados a media línea y hay que
        buscarlos uno por uno.
      -->
      <div class="mt-3">
        <component
          :is="i.to ? NuxtLink : 'div'"
          v-for="i in items"
          :key="i.label"
          v-bind="i.to ? { to: i.to } : {}"
          class="d-flex align-center text-decoration-none strip__legend"
          :class="{ 'strip__legend--muted': !i.value }"
        >
          <span
            class="strip__dot mr-2"
            :style="{ background: chartHex(i.color) }"
          />
          <span class="text-caption text-medium-emphasis text-truncate">
            {{ i.label }}
          </span>
          <v-spacer />
          <span class="text-caption font-weight-bold ml-2">{{ i.value }}</span>
        </component>
      </div>
    </template>

    <EmptyState v-else :icon="emptyIcon" :text="emptyText" />
  </div>
</template>

<style scoped lang="scss">
.strip {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.06);

  &__seg {
    height: 100%;
    transition: width 0.3s ease;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: 0 0 auto;
  }

  &__legend {
    color: inherit;
    padding: 3px 0;
    border-radius: 4px;

    // El renglón entero es el área clickeable, no sólo el texto.
    &:hover {
      background: rgba(var(--v-theme-on-surface), 0.04);
    }

    &--muted {
      opacity: 0.45;
    }
  }
}
</style>
