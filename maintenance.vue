<script setup lang="ts">
useHead({
  titleTemplate: "Maintenance Page",
});
</script>
<template>
  <div class="d-flex justify-center align-center text-center h-100vh">
    <div>
      <img src="/images/background/maintenance.svg" width="500" alt="404" />
      <h1 class="text-h1 pt-3">Página en mantenimiento!!!</h1>
      <h4 class="text-h4 my-8">
        El sitio web está en construcción. ¡Vuelva pronto!
      </h4>
      <v-btn flat color="primary" class="mb-4" to="/dashboard"
        >Regresar al panel</v-btn
      >
    </div>
  </div>
</template>
