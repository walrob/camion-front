<script setup lang="ts">
import { computed } from "vue";

interface Crumb {
  title: string;
  to?: string;
  disabled?: boolean;
}

const props = defineProps<{
  /** Título principal de la página. */
  title: string;
  /** Texto de apoyo opcional debajo del título. */
  subtitle?: string;
  /**
   * Migas de pan. Si se omite, se arma "Inicio → {title}" por defecto,
   * dando navegación contextual consistente en toda la app.
   */
  breadcrumbs?: Crumb[];
}>();

const crumbs = computed<Crumb[]>(
  () =>
    props.breadcrumbs ?? [
      { title: "Inicio", to: "/" },
      { title: props.title, disabled: true },
    ],
);
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
    <div style="min-width: 0">
      <v-breadcrumbs
        :items="crumbs"
        density="compact"
        class="pa-0 mb-1 text-caption text-medium-emphasis"
      >
        <template #divider>
          <v-icon size="14">mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>

      <h1 class="text-h5 font-weight-bold">{{ title }}</h1>

      <p v-if="subtitle" class="text-body-2 text-medium-emphasis ma-0 mt-1">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="d-flex flex-wrap align-center ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>
