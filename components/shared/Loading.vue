<template>
  <v-overlay
    :model-value="true"
    class="d-flex align-center justify-center"
    persistent
    z-index="9999"
  >
    <v-progress-circular indeterminate color="primary" size="64" width="6" />
  </v-overlay>
</template>
