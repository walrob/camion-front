<template>
  <ResponsiveTable
    :headers="headers"
    :items="data"
    fixed-header
    :loading="loading"
  >
    <template v-slot:item.name="{ item }">
      <div class="d-flex align-center justify-end justify-sm-start">
        <v-avatar v-if="item.profileImage" :size="30" class="mr-2">
          <v-img :src="returnUrlImg(item.profileImage)" />
        </v-avatar>
        {{ item.name }}
      </div>
    </template>

    <template v-slot:item.birthDate="{ item }">
      {{ formatDateLocal(item.birthDate) }}
    </template>

    <template v-slot:item.connection="{ item }">
      {{ formatDateLocal(item.lastConnection) }}
    </template>

    <template v-slot:item.verified="{ item }">
      <v-chip v-if="item.isEmailVerified" size="small" color="success">
        Si
      </v-chip>
      <v-chip v-else size="small" color="error"> No </v-chip>
    </template>

    <template v-if="user.isAdmin" v-slot:item.actions="{ item }">
      <v-tooltip v-if="item.blocked" location="top" text="Usuario bloqueado">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            v-bind="props"
            @click="enableUser(item)"
          >
            <UserXIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-else location="top" text="Usuario habilitado">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="success"
            v-bind="props"
            @click="blockUser(item)"
          >
            <UserCheckIcon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <template v-slot:bottom>
      <div class="text-center pt-3">
        <v-pagination
          v-model="page"
          :length="pagination.totalPages"
          density="compact"
          total-visible="5"
        ></v-pagination>
      </div>
    </template>

    <!-- 📱 Slot mobile-item -->
    <template #mobile-item="{ item }">
      <div class="text-body-1 text-textPrimary mb-1 font-weight-bold">
        <v-icon size="small" color="primary" class="mr-2"
          >mdi-account-tie</v-icon
        >
        {{ item.name }}
      </div>
      <div v-if="item.phone" class="text-body-1 text-textPrimary mb-1">
        <v-icon size="small" color="primary" class="mr-2">mdi-phone</v-icon>
        {{ item.phone }}
      </div>
      <div v-if="item.email" class="text-body-1 text-textPrimary mb-1">
        <v-icon size="small" color="primary" class="mr-2">mdi-email</v-icon>
        {{ item.email }}
      </div>
      <div class="text-body-1 text-textPrimary mb-1">
        <span class="mr-2"> Verificado:</span>
        <v-chip v-if="item.isEmailVerified" size="small" color="success">
          Si
        </v-chip>
        <v-chip v-else size="small" color="error"> No </v-chip>
      </div>
    </template>
  </ResponsiveTable>

  <ModalConfirm
    v-model="showConfirm"
    :title="titleConfirm"
    :description="textConfirm"
    @save="confirmSave"
  />
</template>

<script setup lang="ts">
import { UserCheckIcon } from "vue-tabler-icons";
import type { Client } from "~/types/project";
import { formatDateLocal, returnUrlImg } from "~/composables/functions";
import type { Pagination, ResponseConfirm } from "~/types/enums";

const props = defineProps({
  data: {
    type: Array as () => Client[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object as () => Pagination,
    required: true,
  },
});

const user = useAuth();

const headers = [
  { title: "", value: "actions", minWidth: "50px" },
  { title: "Nombre", value: "name", minWidth: "200px" },
  { title: "Email", value: "email" },
  { title: "Teléfono", value: "phone", minWidth: "120px" },
  { title: "Nacimiento", value: "birthDate" },
  { title: "Verificado", value: "verified" },
  { title: "Última conexión", value: "connection" },
];

const emit = defineEmits(["change-pagination", "change-block"]);

const page = computed({
  get() {
    return props.pagination.currentPage;
  },
  set(newValue) {
    const payload = {
      ...props.pagination,
      currentPage: newValue,
    };
    emit("change-pagination", payload);
  },
});

const showConfirm = ref(false);
const textConfirm = ref("");
const titleConfirm = ref("");
const clientData = ref<Client | undefined>(undefined);

const enableUser = (item: Client) => {
  clientData.value = item;
  textConfirm.value = `<p>Se habilitará el acceso al sistema a <b>${item.name}</b></p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Habilitar usuario";
  showConfirm.value = true;
};

const blockUser = (item: Client) => {
  clientData.value = item;
  textConfirm.value = `<p>Se bloqueará el acceso al sistema a <b>${item.name}</b></p><p>¿Está seguro de realizar la operación?</p>`;
  titleConfirm.value = "Bloquear usuario";
  showConfirm.value = true;
};

const confirmSave = (value: ResponseConfirm) => {
  if (value.resp) {
    emit("change-block", clientData.value);
    showConfirm.value = false;
  }
};
</script>

<style scoped></style>
