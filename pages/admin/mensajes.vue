<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useMessageStore } from "~/stores/message";
import { useAuthStore } from "~/stores/auth";
import { useMessageSocket } from "~/composables/useMessageSocket";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

definePageMeta({
  layout: "admin",
  roles: ["admin", "dispatcher", "manager"],
});
useHead({ title: "Mensajes" });

const messageStore = useMessageStore();
const authStore = useAuthStore();
const { messages, inbox } = storeToRefs(messageStore);

const myId = computed(() => authStore.user?.id);
const selectedUser = ref<string | null>(null);
const userNames = ref<Record<string, string>>({});
const text = ref("");
const listRef = ref<HTMLElement | null>(null);

// Conversaciones distintas a partir de la bandeja (por remitente).
const conversations = computed(() => {
  const map = new Map<string, any>();
  for (const m of inbox.value) {
    if (m.fromUserId === myId.value) continue;
    if (!map.has(m.fromUserId)) map.set(m.fromUserId, m);
  }
  return Array.from(map.entries()).map(([userId, last]) => ({ userId, last }));
});

const nameOf = (id: string) => userNames.value[id] || id.slice(0, 8);

const scrollDown = () =>
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });

const openConversation = async (userId: string) => {
  selectedUser.value = userId;
  await messageStore.getConversation(userId);
  scrollDown();
};

const send = async () => {
  if (!text.value.trim() || !selectedUser.value) return;
  const ok = await messageStore.send({ body: text.value, toUserId: selectedUser.value });
  if (ok) {
    text.value = "";
    scrollDown();
  }
};

const loadUsers = async () => {
  const { $api } = useNuxtApp();
  try {
    const resp = await $api.get("users/", { params: { limit: 100 } });
    const map: Record<string, string> = {};
    (resp.data.items || []).forEach((u: any) => (map[u.id] = u.name));
    userNames.value = map;
  } catch {
    /* noop */
  }
};

const socket = useMessageSocket((m) => {
  messageStore.getInbox();
  if (
    selectedUser.value &&
    (m.fromUserId === selectedUser.value || m.toUserId === selectedUser.value)
  ) {
    messageStore.append(m);
    scrollDown();
  }
});

onMounted(async () => {
  await Promise.all([messageStore.getInbox(), loadUsers()]);
  socket.connect();
});
onBeforeUnmount(() => socket.disconnect());
</script>

<template>
  <div>
    <PageHeader title="Mensajes" subtitle="Comunicación con los choferes en ruta" />

    <v-row>
      <!-- Conversaciones -->
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-list>
            <v-list-subheader>Conversaciones</v-list-subheader>
            <v-list-item
              v-for="c in conversations"
              :key="c.userId"
              :active="selectedUser === c.userId"
              @click="openConversation(c.userId)"
            >
              <v-list-item-title>{{ nameOf(c.userId) }}</v-list-item-title>
              <v-list-item-subtitle>{{ c.last.body }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="!conversations.length">
              <v-list-item-subtitle>Sin mensajes.</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Conversación -->
      <v-col cols="12" md="8">
        <v-card variant="outlined" class="d-flex flex-column" style="height: 60vh">
          <v-card-title v-if="selectedUser" class="text-subtitle-1">
            {{ nameOf(selectedUser) }}
          </v-card-title>
          <v-divider />

          <div ref="listRef" class="flex-grow-1 pa-3" style="overflow-y: auto">
            <p v-if="!selectedUser" class="text-body-2 text-medium-emphasis text-center mt-8">
              Elegí una conversación.
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
                max-width="75%"
              >
                <div class="text-body-2">{{ m.body }}</div>
                <div class="text-caption text-right" style="opacity: 0.7">
                  {{ new Date(m.createdAt).toLocaleTimeString() }}
                </div>
              </v-card>
            </div>
          </div>

          <v-divider />
          <div v-if="selectedUser" class="d-flex ga-2 align-center pa-2">
            <VoiceTextField
              v-model="text"
              placeholder="Escribí una respuesta"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
              @keyup.enter="send"
            />
            <v-btn icon="mdi-send" aria-label="Enviar" color="primary" @click="send" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
