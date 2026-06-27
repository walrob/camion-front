<template>
  <div
    class="text-caption text-center mx-auto py-3 d-flex flex-column flex-md-row justify-md-space-around w-100 text-center"
  >
    <div>© {{ year }}. Todos los derechos reservados.</div>
    <div>
      Desarrollado por
      <a
        href="https://www.northar.com.ar/"
        target="_blank"
        class="text-decoration-none font-weight-bold text-textSecondary"
        >Northar Consulting</a
      >
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  classText: {
    type: String,
    default: "text-muted",
  },
});

const year = new Date().getFullYear();
</script>
