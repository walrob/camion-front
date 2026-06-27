<script setup lang="ts">
const props = defineProps({
  title: String,
  showClose: Boolean,
  hideAction: Boolean,
  classCard: String,
  classFooter: {
    type: String,
    default: "justify-end",
  },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <v-card elevation="0" :class="classCard">
    <v-card-item class="py-3">
      <v-card-title class="text-h5 d-flex justify-space-between align-center"
        >{{ title }}
        <div class="d-flex">
          <slot name="header" />
          <v-btn
            v-if="showClose"
            icon
            variant="text"
            size="small"
            @click="emit('close')"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
    </v-card-item>
    <v-divider />
    <v-card-text>
      <slot />
    </v-card-text>
    <v-divider />
    <v-card-actions v-if="!hideAction" :class="classFooter">
      <slot name="footer" />
    </v-card-actions>
  </v-card>
</template>
