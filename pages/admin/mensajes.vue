<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useDisplay } from "vuetify";
import { useMessageStore, type Message } from "~/stores/message";
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
const { messages, inbox, loading } = storeToRefs(messageStore);
const { mdAndUp } = useDisplay();

const myId = computed(() => authStore.user?.id);
const selectedUser = ref<string | null>(null);
const userNames = ref<Record<string, string>>({});
const text = ref("");
const search = ref("");
const listRef = ref<HTMLElement | null>(null);

// Conversaciones a partir de la bandeja, agrupadas por interlocutor. El "otro"
// es el destinatario si el mensaje lo envié yo, o el remitente si lo recibí.
const conversations = computed(() => {
  const map = new Map<string, any>();
  for (const m of inbox.value) {
    const otherId = m.fromUserId === myId.value ? m.toUserId : m.fromUserId;
    if (!otherId) continue; // mensajes a un rol (sin destinatario puntual)
    if (!map.has(otherId)) map.set(otherId, m);
  }
  return Array.from(map.entries()).map(([userId, last]) => ({
    userId,
    last,
    unread: !!(last.toUserId === myId.value && !last.readAt),
  }));
});

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return conversations.value;
  return conversations.value.filter((c) =>
    nameOf(c.userId).toLowerCase().includes(q),
  );
});

const nameOf = (id: string) => userNames.value[id] || id.slice(0, 8);

const initials = (id: string) => {
  const n = nameOf(id).trim();
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
};

// Color de avatar determinístico por usuario.
const AVATAR_COLORS = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "accent",
];
const avatarColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const timeOf = (d: string) => formatHourLocal(d);

const dayLabel = (d: string) => {
  const date = new Date(d);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, today)) return "Hoy";
  if (same(date, yest)) return "Ayer";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "long" });
};

// Mensajes agrupados por día para mostrar separadores.
const groupedMessages = computed(() => {
  const groups: { label: string; items: Message[] }[] = [];
  for (const m of messages.value) {
    const label = dayLabel(m.createdAt);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
});

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
  const ok = await messageStore.send({
    body: text.value,
    toUserId: selectedUser.value,
  });
  if (ok) {
    text.value = "";
    scrollDown();
    messageStore.getInbox();
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

const route = useRoute();

onMounted(async () => {
  await Promise.all([messageStore.getInbox(), loadUsers()]);
  socket.connect();
  // Permite abrir/iniciar una conversación directo desde otra pantalla
  // (ej. "Enviar mensaje" al chofer desde Vencimientos): /admin/mensajes?user=<id>
  const target = route.query.user;
  if (typeof target === "string" && target) await openConversation(target);
});
onBeforeUnmount(() => socket.disconnect());
</script>

<template>
  <div>
    <PageHeader
      title="Mensajes"
      subtitle="Comunicación con los choferes en ruta"
    />

    <v-card border flat rounded="lg" class="chat-shell d-flex overflow-hidden">
      <!-- ───── Lista de conversaciones ───── -->
      <div
        v-if="mdAndUp || !selectedUser"
        class="chat-aside d-flex flex-column"
      >
        <div class="pa-3">
          <v-text-field
            v-model="search"
            placeholder="Buscar conversación"
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            density="compact"
            hide-details
            rounded="lg"
          />
        </div>
        <v-divider />

        <div class="flex-grow-1" style="overflow-y: auto">
          <v-list class="py-0" nav>
            <v-list-item
              v-for="c in filteredConversations"
              :key="c.userId"
              :active="selectedUser === c.userId"
              class="px-3 py-2"
              @click="openConversation(c.userId)"
            >
              <template #prepend>
                <v-avatar :color="avatarColor(c.userId)" size="42" class="mr-1">
                  <span class="text-body-2 font-weight-bold">{{
                    initials(c.userId)
                  }}</span>
                </v-avatar>
              </template>

              <v-list-item-title
                class="font-weight-bold d-flex align-center justify-space-between"
              >
                <span class="text-truncate">{{ nameOf(c.userId) }}</span>
                <span class="text-caption text-medium-emphasis ml-2">{{
                  timeOf(c.last.createdAt)
                }}</span>
              </v-list-item-title>
              <v-list-item-subtitle
                class="d-flex align-center justify-space-between"
              >
                <span class="text-truncate">{{ c.last.body }}</span>
                <v-icon v-if="c.unread" size="12" color="primary" class="ml-2"
                  >mdi-circle</v-icon
                >
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <div
            v-if="!filteredConversations.length"
            class="text-center text-body-2 text-medium-emphasis py-10 px-4"
          >
            <v-icon size="32" class="mb-2 d-block mx-auto"
              >mdi-chat-outline</v-icon
            >
            Sin conversaciones
          </div>
        </div>
      </div>

      <v-divider v-if="mdAndUp" vertical />

      <!-- ───── Conversación ───── -->
      <div
        v-if="mdAndUp || selectedUser"
        class="chat-main flex-grow-1 d-flex flex-column"
      >
        <!-- Encabezado -->
        <template v-if="selectedUser">
          <div class="d-flex align-center ga-2 pa-3">
            <v-btn
              v-if="!mdAndUp"
              icon="mdi-arrow-left"
              variant="text"
              size="small"
              aria-label="Volver"
              @click="selectedUser = null"
            />
            <v-avatar :color="avatarColor(selectedUser)" size="38">
              <span class="text-body-2 font-weight-bold">{{
                initials(selectedUser)
              }}</span>
            </v-avatar>
            <div class="font-weight-bold">{{ nameOf(selectedUser) }}</div>
          </div>
          <v-divider />
        </template>

        <!-- Mensajes -->
        <div ref="listRef" class="chat-body flex-grow-1 pa-4">
          <div
            v-if="!selectedUser"
            class="chat-empty text-center text-medium-emphasis"
          >
            <v-icon size="56" class="mb-3">mdi-forum-outline</v-icon>
            <p class="text-body-1">
              Elegí una conversación para empezar a chatear.
            </p>
          </div>

          <div v-else-if="loading && !messages.length" class="text-center pt-8">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <template v-else>
            <div v-for="(group, gi) in groupedMessages" :key="gi">
              <div class="text-center my-3">
                <span class="day-chip text-caption">{{ group.label }}</span>
              </div>

              <div
                v-for="m in group.items"
                :key="m.id"
                class="d-flex mb-2"
                :class="m.fromUserId === myId ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="msg-bubble"
                  :class="m.fromUserId === myId ? 'msg-sent' : 'msg-recv'"
                >
                  <div class="text-body-2" style="white-space: pre-wrap">
                    {{ m.body }}
                  </div>
                  <div class="msg-meta">
                    <span>{{ timeOf(m.createdAt) }}</span>
                    <v-icon v-if="m.fromUserId === myId" size="14">
                      {{ m.readAt ? "mdi-check-all" : "mdi-check" }}
                    </v-icon>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Composer -->
        <div v-if="selectedUser" class="pa-3 chat-composer">
          <div class="d-flex ga-2 align-center">
            <VoiceTextField
              v-model="text"
              placeholder="Escribí un mensaje…"
              variant="solo-filled"
              flat
              density="comfortable"
              hide-details
              rounded="pill"
              class="flex-grow-1"
              @keyup.enter="send"
            />
            <v-btn
              icon="mdi-send"
              color="primary"
              size="large"
              :disabled="!text.trim()"
              aria-label="Enviar"
              @click="send"
            />
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.chat-shell {
  height: calc(100vh - 210px);
  min-height: 460px;
}

.chat-aside {
  width: 320px;
  max-width: 100%;
  flex: 0 0 auto;
}
@media (max-width: 959px) {
  .chat-aside {
    width: 100%;
  }
}

.chat-body {
  overflow-y: auto;
  background:
    radial-gradient(rgba(var(--v-theme-primary), 0.04) 1px, transparent 1px) 0
      0 / 22px 22px,
    rgb(var(--v-theme-grey100));
}

.chat-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.day-chip {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-textSecondary));
  padding: 2px 10px;
  border-radius: 999px;
}

.msg-bubble {
  max-width: 72%;
  padding: 7px 11px 4px;
  border-radius: 14px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
}

.msg-sent {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-recv {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-borderColor));
  border-bottom-left-radius: 4px;
}

.msg-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  font-size: 0.65rem;
  line-height: 1;
  margin-top: 3px;
  opacity: 0.75;
}

.chat-composer {
  border-top: 1px solid rgb(var(--v-theme-borderColor));
}
</style>
