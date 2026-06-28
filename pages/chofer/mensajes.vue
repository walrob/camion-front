<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { storeToRefs } from "pinia";
import { useMessageStore } from "~/stores/message";
import { useAuthStore } from "~/stores/auth";
import { useMessageSocket } from "~/composables/useMessageSocket";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

definePageMeta({ layout: "driver", middleware: "auth" });
useHead({ title: "Mensajes" });

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

const send = async () => {
  if (!text.value.trim()) return;
  const ok = await messageStore.send({ body: text.value, toRole: "dispatcher" });
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
    <h1 class="text-h6 font-weight-bold mb-2">Mensajes con la base</h1>

    <div ref="listRef" class="chat-list">
      <div v-if="loading" class="d-flex justify-center my-6">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <p v-else-if="!messages.length" class="text-body-2 text-medium-emphasis text-center">
        No hay mensajes todavía.
      </p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="d-flex mb-2"
        :class="m.fromUserId === myId ? 'justify-end' : 'justify-start'"
      >
        <v-card
          :color="m.fromUserId === myId ? 'primary' : 'grey-lighten-3'"
          :variant="m.fromUserId === myId ? 'flat' : 'tonal'"
          class="pa-2 px-3"
          max-width="80%"
        >
          <div class="text-body-2">{{ m.body }}</div>
          <div class="text-caption text-right" style="opacity: 0.7">
            {{ new Date(m.createdAt).toLocaleTimeString() }}
          </div>
        </v-card>
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
      <v-btn icon="mdi-send" color="primary" @click="send" />
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.chat-input {
  padding-top: 8px;
}
</style>
