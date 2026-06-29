<script setup lang="ts">
useHead({
  titleTemplate: "404 - Page Not Found",
});
</script>
<template>
  <div class="d-flex justify-center align-center text-center h-100vh">
    <div>
      <img :src="'/images/background/errorimg.svg'" width="500" alt="404" />
      <h1 class="text-h1 pt-3">Opps!!!</h1>
      <h4 class="text-h4 my-8">
        Esta página que estás buscando no pudo ser encontrada.
      </h4>
      <v-btn flat color="primary" class="mb-4" to="/"
        >Regresar al inicio</v-btn
      >
    </div>
  </div>
</template>
