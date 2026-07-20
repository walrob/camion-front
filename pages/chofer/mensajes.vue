<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { storeToRefs } from "pinia";
import { useMessageStore } from "~/stores/message";
import { useAuthStore } from "~/stores/auth";
import { useMessageSocket } from "~/composables/useMessageSocket";
import { useKeyboardInset } from "~/composables/useKeyboardInset";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

definePageMeta({ layout: "driver" });
useHead({ title: "Mensajes" });
useDriverPage({ title: "Mensajes", subtitle: "Chat con la base" });

const messageStore = useMessageStore();
const authStore = useAuthStore();
const { messages, loading } = storeToRefs(messageStore);

const myId = computed(() => authStore.user?.id);
const text = ref("");
const listRef = ref<HTMLElement | null>(null);

const scrollDown = () =>
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });

// Refuerzo iOS: sube el input sobre el teclado y mantiene el chat al final.
useKeyboardInset(scrollDown);

const send = async () => {
  if (!text.value.trim()) return;
  const ok = await messageStore.send({
    body: text.value,
    toRole: "dispatcher",
  });
  if (ok) {
    text.value = "";
    scrollDown();
  }
};

const socket = useMessageSocket((m) => {
  if (m.fromUserId === myId.value || m.toUserId === myId.value) {
    messageStore.append(m);
    scrollDown();
  }
});

onMounted(async () => {
  await messageStore.getMyThread();
  socket.connect();
  scrollDown();
});
onBeforeUnmount(() => socket.disconnect());
</script>

<template>
  <div class="chat-wrapper">
    <div ref="listRef" class="chat-list">
      <div v-if="loading" class="d-flex justify-center my-6">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <p
        v-else-if="!messages.length"
        class="text-body-2 text-medium-emphasis text-center"
      >
        No hay mensajes todavía.
      </p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="d-flex mb-2"
        :class="m.fromUserId === myId ? 'justify-end' : 'justify-start'"
      >
        <div
          class="bubble"
          :class="m.fromUserId === myId ? 'bubble--mine' : 'bubble--theirs'"
        >
          <div class="text-body-2">{{ m.body }}</div>
          <div class="text-caption text-right bubble__time">
            {{ formatHourLocal(m.createdAt) }}
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input d-flex ga-2 align-center">
      <VoiceTextField
        v-model="text"
        placeholder="Escribí un mensaje"
        variant="outlined"
        density="compact"
        hide-details
        class="flex-grow-1"
        @keyup.enter="send"
      />
      <v-btn
        icon="mdi-send"
        aria-label="Enviar"
        color="primary"
        @click="send"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  /*
    Llena el alto disponible entre el hero y la barra inferior.
    dvh (dynamic viewport height) se ajusta al viewport visible en mobile y,
    con `interactive-widget=resizes-content`, se achica al abrir el teclado,
    subiendo el input por encima de él.
    --driver-hero-h la publica el layout con un ResizeObserver (el hero cambia de
    alto según el subtítulo y los chips de estado); 132px = barra inferior (72) +
    padding de la hoja (20 sup. + 68 inf.) - el solape del hero (28).
    --keyboard-inset (visualViewport) refuerza el caso iOS, donde dvh no se achica.
  */
  height: calc(
    100dvh - var(--driver-hero-h, 140px) - 132px - var(--keyboard-inset, 0px)
  );
  min-height: 320px;
}
.chat-list {
  flex: 1;
  min-height: 0; /* permite el scroll interno dentro del flex */
  overflow-y: auto;
  padding: 8px 0;
}
.chat-input {
  padding-top: 8px;
  /* El input queda pegado al fondo del wrapper (justo sobre la barra inferior). */
  background: rgb(var(--v-theme-background));
}

/*
  Burbujas: la esquina "mordida" del lado del emisor es lo que hace que un chat
  se lea como chat. La propia va en color de marca, la entrante en superficie con
  borde —así se distinguen por forma y por peso, no solo por color.
*/
.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 16px;
}
.bubble__time {
  opacity: 0.65;
  font-size: 0.6875rem;
  margin-top: 2px;
}
.bubble--mine {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-bottom-right-radius: 4px;
}
.bubble--theirs {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-borderColor));
  border-bottom-left-radius: 4px;
}
</style>
