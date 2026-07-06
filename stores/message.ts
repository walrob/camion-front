import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface Message {
  id: string;
  createdAt: string;
  tripId?: string;
  fromUserId: string;
  toUserId?: string;
  toRole?: string;
  body: string;
  readAt?: string | null;
}

export const useMessageStore = defineStore("message", {
  state: () => ({
    messages: [] as Message[],
    inbox: [] as Message[],
    loading: false,
  }),

  actions: {
    async getMyThread() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("messages/me/")
        .then((resp) => (this.messages = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async getInbox() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("messages/inbox/")
        .then((resp) => (this.inbox = resp.data))
        .catch((e) => general.setErrorSnackbar(e));
    },

    async getConversation(userId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get(`messages/conversation/${userId}/`)
        .then((resp) => (this.messages = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async send(payload: { body: string; toUserId?: string; toRole?: string; tripId?: string }) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.post("messages/", payload);
        // Usamos append (dedup por id) porque el eco por WebSocket puede llegar
        // antes que la respuesta del POST y agregar el mismo mensaje.
        this.append(resp.data);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    append(message: Message) {
      if (!this.messages.find((m) => m.id === message.id)) this.messages.push(message);
    },
  },
});
