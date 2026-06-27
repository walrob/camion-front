<script setup lang="ts">
import { useDisplay } from "vuetify";
import { useGeneralStore } from "@/stores/general";

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `Super Natu | ${titleChunk}` : "Super Natu";
  },
});

const year = new Date().getFullYear();

const generalStore = useGeneralStore();
const { snackbar } = storeToRefs(generalStore);

const icons = [
  {
    icon: "mdi-instagram",
    url: "https://www.instagram.com/hielosnatu_supernatu/",
  },
  // {
  //   icon: "mdi-linkedin",
  //   url: "https://www.linkedin.com/",
  // },
  {
    icon: "mdi-whatsapp",
    url: "https://wa.me/+5493725465398",
  },
];

const { mdAndUp } = useDisplay();
</script>

<template>
  <v-locale-provider>
    <v-app style="scroll-behavior: smooth">
      <v-main class="mx-0 pa-0">
        <NuxtPage />
      </v-main>

      <!-- Footer -->
      <v-footer class="d-flex flex-column ga-4 py-4 pt-lg-8" color="primary">
        <div class="d-flex ga-2 justify-center d-sm-none">
          <v-btn
            v-for="icon in icons"
            :key="icon.icon"
            :icon="icon.icon"
            variant="text"
            density="comfortable"
            :href="icon.url"
            target="_blank"
            rel="noopener"
            color="white"
          />
        </div>

        <div
          class="d-flex flex-row justify-space-between footer-info text-caption"
        >
          <div class="d-flex flex-column ga-2">
            <!-- <div class="no-wrap">
              <v-icon color="white" start>mdi-store</v-icon> Super Natu
            </div> -->
            <div class="no-wrap">
              <v-icon color="white" start>mdi-map-marker</v-icon>
              Islas Malvinas 898, Gral. José de San Martín, Chaco
            </div>
            <div>
              <v-icon color="white" start>mdi-email</v-icon>
              info@supernatu.com
            </div>
          </div>

          <div class="d-flex flex-column ga-2 justify-start">
            <NuxtLink
              to="/terminos-y-condiciones"
              class="text-white text-decoration-none no-wrap"
              >Términos y Condiciones</NuxtLink
            >
            <NuxtLink
              to="/politica-de-privacidad"
              class="text-white text-decoration-none no-wrap"
              >Política de Privacidad</NuxtLink
            >
          </div>

          <div class="d-none d-sm-flex ga-2 justify-start">
            <v-btn
              v-for="icon in icons"
              :key="icon.icon"
              :icon="icon.icon"
              variant="text"
              density="comfortable"
              :href="icon.url"
              target="_blank"
              rel="noopener"
              color="white"
            />
          </div>
        </div>

        <v-divider thickness="2" :width="mdAndUp ? 500 : 200" color="white" />

        <div
          class="text-white py-2 text-caption d-flex flex-column flex-md-row justify-md-space-around w-100 text-center"
        >
          <div>© {{ year }} Super Natu. Todos los derechos reservados.</div>
          <div>
            Desarrollado por
            <a
              href="https://www.northar.com.ar/"
              target="_blank"
              class="text-decoration-none text-white font-weight-bold"
              >Northar Consulting</a
            >
          </div>
        </div>
      </v-footer>

      <!-- Snackbar global -->
      <v-snackbar
        v-model="snackbar.state"
        :timeout="snackbar.timeout"
        :color="snackbar.color"
        rounded="pill"
      >
        {{ snackbar.message }}
      </v-snackbar>
    </v-app>
  </v-locale-provider>
</template>

<style scoped>
.footer-info {
  width: 800px;
}
.no-wrap {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

@media (max-width: 960px) {
  .footer-info {
    width: 600px;
  }
}

@media (max-width: 600px) {
  .footer-info {
    width: 100%;
  }
  /* .no-wrap {
    max-width: 95%;
  } */
}
</style>
