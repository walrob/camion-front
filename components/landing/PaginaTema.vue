<script setup lang="ts">
import { CONTACTO } from "~/composables/useContacto";

/**
 * Molde de las páginas temáticas públicas (`/costo-por-kilometro`,
 * `/control-vencimientos-cnrt`, `/rendicion-de-viajes`).
 *
 * Estas páginas no son variantes de la landing: la landing vende el producto y
 * estas explican un problema del rubro. Quien llega acá lo hace desde una
 * búsqueda concreta ("cómo calcular el costo por kilómetro de un camión") y
 * quiere la respuesta, no un folleto. Por eso el cuerpo es texto largo con
 * índice, y la oferta comercial aparece una sola vez, al final.
 *
 * Piezas que el molde aporta y que cada página no tiene que repetir:
 *
 *  - **Migas de pan visibles.** Le dan al lector de dónde viene y a Google la
 *    jerarquía del sitio; van acompañadas del `BreadcrumbList` en JSON-LD que
 *    declara cada página.
 *  - **Índice lateral con anclas.** Además de servir para leer, es lo que puede
 *    convertirse en enlaces de sección debajo del resultado de búsqueda.
 *  - **Cierre con llamada a la acción.** Una página de contenido sin salida
 *    posiciona y no vende.
 */
defineProps<{
  /** `<h1>`. Es el título de la página, no el de la pestaña: puede ser más largo. */
  titulo: string;
  /** Párrafo de entrada. Es el primer texto del cuerpo que lee el buscador. */
  bajada: string;
  /** Etiqueta corta sobre el título ("Vencimientos", "Costos"). */
  eyebrow?: string;
  /** Miga de pan del último nivel. Suele ser una versión corta del título. */
  miga: string;
  /** Índice lateral. Los `id` deben existir como `<h2 :id>` en el contenido. */
  secciones: { id: string; titulo: string }[];
  /** Título de la banda de cierre. */
  cierreTitulo: string;
  /** Bajada de la banda de cierre. */
  cierreTexto: string;
}>();

/** Días de prueba. Debe coincidir con `DIAS_DE_TRIAL` del backend. */
const DIAS_DE_PRUEBA = 30;
</script>

<template>
  <div>
    <!-- ── Encabezado ────────────────────────────────────────────────────── -->
    <section class="lp-oscuro py-12 py-md-14">
      <div class="lp-glow" />

      <v-container>
        <!--
          Migas reales, con `<a>` navegables y no un texto decorativo: son un
          enlace interno hacia la portada desde cada página temática, que es lo
          que reparte autoridad hacia adentro del sitio.
        -->
        <nav class="tema-migas" aria-label="Migas de pan">
          <NuxtLink to="/">Inicio</NuxtLink>
          <v-icon size="14" class="mx-1">mdi-chevron-right</v-icon>
          <span aria-current="page">{{ miga }}</span>
        </nav>

        <span v-if="eyebrow" class="lp-eyebrow mt-6 d-inline-flex">
          <span class="lp-pulso" />
          {{ eyebrow }}
        </span>

        <h1 class="lp-h2 mt-5 mb-4 lp-medida">{{ titulo }}</h1>

        <p class="lp-lead lp-tenue lp-medida mb-0">{{ bajada }}</p>
      </v-container>
    </section>

    <!-- ── Cuerpo ────────────────────────────────────────────────────────── -->
    <v-container class="py-10 py-md-14">
      <v-row>
        <v-col cols="12" md="4" lg="3" class="d-none d-md-block">
          <nav class="legal-indice" aria-label="Contenido de la página">
            <div class="text-overline text-medium-emphasis mb-2">En esta página</div>
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
          <article class="legal tema">
            <slot />
          </article>
        </v-col>
      </v-row>
    </v-container>

    <!-- ── Cierre ────────────────────────────────────────────────────────── -->
    <section class="lp-oscuro py-16">
      <div class="lp-glow" />

      <v-container class="text-center">
        <h2 class="lp-h2 mb-4 lp-medida-centro">{{ cierreTitulo }}</h2>
        <p class="lp-lead lp-tenue lp-medida-centro mb-8">{{ cierreTexto }}</p>

        <div class="d-flex flex-wrap justify-center ga-3">
          <v-btn
            color="primary"
            size="x-large"
            flat
            to="/auth/registro-empresa"
            append-icon="mdi-arrow-right"
          >
            Probar gratis {{ DIAS_DE_PRUEBA }} días
          </v-btn>
          <v-btn
            size="x-large"
            variant="outlined"
            class="lp-btn-ghost"
            :href="CONTACTO.whatsappUrl"
            target="_blank"
            rel="noopener"
            prepend-icon="mdi-whatsapp"
          >
            Escribinos
          </v-btn>
        </div>

        <p class="text-body-2 lp-tenue mt-5 mb-0">
          Sin tarjeta de crédito · Acceso completo · Cancelás cuando quieras
        </p>
      </v-container>
    </section>
  </div>
</template>
