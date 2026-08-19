<script setup lang="ts">
/**
 * Molde de los documentos legales públicos (términos, privacidad).
 *
 * Un texto legal se lee distinto que una landing: nadie lo lee entero, se busca
 * una cláusula puntual. De ahí el índice pegajoso al costado y los títulos con
 * ancla propia — para poder mandar por correo el link a una sección concreta.
 *
 * El contenido va por slot: la maqueta vive acá una sola vez y cada página
 * aporta únicamente su articulado.
 */
defineProps<{
  titulo: string;
  bajada: string;
  /** Fecha de vigencia, escrita en letras ("17 de agosto de 2026"). */
  actualizado: string;
  /** Índice lateral. Los `id` deben existir como `<h2 :id>` en el contenido. */
  secciones: { id: string; titulo: string }[];
}>();
</script>

<template>
  <div>
    <!-- Encabezado: misma banda oscura de la landing, en versión corta -->
    <section class="lp-oscuro py-12 py-md-14">
      <div class="lp-glow" />

      <v-container>
        <NuxtLink
          to="/"
          class="text-body-2 lp-tenue text-decoration-none d-inline-flex align-center ga-1"
        >
          <v-icon size="16">mdi-arrow-left</v-icon>
          Volver al inicio
        </NuxtLink>

        <h1 class="lp-h2 mt-5 mb-4">{{ titulo }}</h1>

        <p class="lp-lead lp-tenue lp-medida mb-6">{{ bajada }}</p>

        <span class="lp-eyebrow">
          <v-icon size="14">mdi-update</v-icon>
          Vigente desde el {{ actualizado }}
        </span>
      </v-container>
    </section>

    <v-container class="py-10 py-md-14">
      <v-row>
        <v-col cols="12" md="4" lg="3" class="d-none d-md-block">
          <nav class="legal-indice" aria-label="Índice del documento">
            <div class="text-overline text-medium-emphasis mb-2">Contenido</div>
            <a
              v-for="(s, i) in secciones"
              :key="s.id"
              :href="`#${s.id}`"
              class="legal-indice__item"
            >
              <span class="legal-indice__num">{{ i + 1 }}</span>
              {{ s.titulo }}
            </a>
          </nav>
        </v-col>

        <v-col cols="12" md="8">
          <article class="legal">
            <slot />
          </article>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
