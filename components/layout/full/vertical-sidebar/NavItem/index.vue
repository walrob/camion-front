<script setup>
import Icon from "../Icon.vue";
import { computed } from "vue";

const props = defineProps({ item: Object, level: Number });

const { has } = useFeatures();

/**
 * El ítem se muestra siempre; si el plan no incluye su funcionalidad, se ve
 * apagado y con candado, y lleva a la pantalla que explica qué incluye.
 *
 * No se oculta a propósito: la idea comercial es que el cliente vea todos los
 * días lo que le falta (MODELO-COMERCIAL §6.2).
 */
const bloqueado = computed(
  () => !!props.item?.feature && !has(props.item.feature),
);

/** Destino real: el módulo, o la pantalla de upgrade si está bloqueado. */
const destino = computed(() =>
  bloqueado.value ? `/upgrade/${props.item.feature}` : props.item.to,
);
</script>

<template>
  <!---Single Item-->
  <v-list-item
    :href="item.external && !bloqueado ? item.to : undefined"
    :to="!item.external || bloqueado ? destino : undefined"
    rounded
    class="mb-1"
    color="primary"
    :disabled="item.disabled"
    :class="{ 'nav-item--bloqueado': bloqueado }"
    :target="item.external === true && !bloqueado ? '_blank' : undefined"
  >
    <!---If icon-->
    <template v-slot:prepend>
      <Icon :item="item.icon" :level="level" />
    </template>
    <v-list-item-title
      >{{ item.title }}
      <span v-if="item.children">
        <span v-if="item.chip" class="ps-3">
          <v-chip
            color="primary"
            class="sidebarchip"
            :size="item.chipIcon ? 'x-small' : 'x-small'"
            :variant="item.chipVariant"
            :prepend-icon="item.chipIcon"
          >
            {{ item.chip }}
          </v-chip>
        </span>
      </span>
    </v-list-item-title>

    <!---If Caption-->
    <v-list-item-subtitle
      v-if="item.subCaption"
      class="text-caption mt-n1 hide-menu"
    >
      {{ item.subCaption }}
    </v-list-item-subtitle>
    <!---Candado: la funcionalidad no está incluida en el plan-->
    <template v-slot:append v-if="bloqueado">
      <v-icon size="16" class="nav-item__candado">mdi-lock-outline</v-icon>
    </template>
    <!---If any chip or label-->
    <template v-slot:append v-else-if="item.chip">
      <!-- `chipColor` es lo que permite que el aviso de deuda salga en rojo y
           no en el color de marca, que no comunicaría nada. -->
      <v-chip
        :color="item.chipColor || 'primary'"
        class="sidebarchip"
        :size="item.chipIcon ? 'x-small' : 'x-small'"
        :variant="item.chipVariant"
        :prepend-icon="item.chipIcon"
      >
        {{ item.chip }}
      </v-chip>
    </template>
  </v-list-item>
</template>

<style scoped>
/* Apagado, pero clicable: lleva a la pantalla que explica qué incluye. */
.nav-item--bloqueado {
  opacity: 0.45;
}
.nav-item--bloqueado:hover {
  opacity: 0.7;
}
.nav-item__candado {
  opacity: 0.8;
}
</style>
