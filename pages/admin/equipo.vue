<script setup lang="ts">
import PageHeader from "~/components/shared/PageHeader.vue";
import TablePagination from "~/components/shared/TablePagination.vue";
import ResponsiveTable from "~/components/ResponsiveTable.vue";
import ModalConfirm from "~/components/modal/Confirm.vue";
import { computed, onMounted, ref } from "vue";
import { useDebounceFn } from "@vueuse/core";

/**
 * Accesos al sistema de gente que **no lleva legajo**.
 *
 * Es el camino corto para un despachante tercerizado, el contador, un socio o
 * un auditor externo: personas que necesitan entrar pero de las que no tenés
 * —ni querés inventar— documento, puesto ni fecha de ingreso. Para el personal
 * en relación de dependencia el camino sigue siendo RRHH, que además del acceso
 * arma el legajo.
 *
 * La otra diferencia es quién elige la contraseña: acá la pone la persona al
 * aceptar la invitación, así que el administrador nunca la conoce.
 */
definePageMeta({
  layout: "admin",
  roles: ["admin", "manager"],
});

useHead({ title: "Equipo" });

const { get, post, delete: del } = useApi();
const { fmtDate } = useFormatters();
const { limite } = useFeatures();
const auth = useAuthStore();
const general = useGeneralStore();

const esAdmin = computed(() => auth.user?.role === "admin");

// ───────── Usuarios ─────────

const usuarios = ref<any[]>([]);
const paginacion = ref({ currentPage: 1, totalPages: 1 });
const cargandoUsuarios = ref(true);
const errorUsuarios = ref(false);
const busqueda = ref("");

const ROLES: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerencia",
  dispatcher: "Despachante",
  maintenance: "Taller",
  driver: "Chofer",
  hr: "Recursos Humanos",
  auditor: "Auditoría",
};

const cargarUsuarios = async () => {
  cargandoUsuarios.value = true;
  errorUsuarios.value = false;
  try {
    const r: any = await get("users", {
      page: paginacion.value.currentPage,
      limit: 10,
      search: busqueda.value || undefined,
    });
    usuarios.value = r.items;
    paginacion.value = r.meta;
  } catch (e: any) {
    errorUsuarios.value = true;
  } finally {
    cargandoUsuarios.value = false;
  }
};

const buscar = useDebounceFn(() => {
  paginacion.value.currentPage = 1;
  cargarUsuarios();
}, 350);

const cambiarPagina = (p: number) => {
  paginacion.value.currentPage = p;
  cargarUsuarios();
};

const headersUsuarios = [
  { title: "Nombre", value: "name" },
  { title: "Email", value: "email" },
  { title: "Rol", value: "role" },
  { title: "Última conexión", value: "lastConnection" },
];

// ───────── Invitaciones ─────────

const invitaciones = ref<any[]>([]);
const cargandoInvitaciones = ref(true);

/**
 * Roles ofrecidos, recortados por el plan.
 *
 * `limits.roles` vacío = sin restricción. Esto es sólo la experiencia: quien
 * decide de verdad es el backend, que revalida el rol al crear la invitación
 * **y otra vez al aceptarla**, por si el plan cambió en el medio.
 */
const rolesDisponibles = computed(() => {
  const permitidos = (limite("roles") as string[] | null) ?? [];
  const todos = Object.entries(ROLES).map(([value, title]) => ({
    value,
    title,
  }));

  if (!permitidos.length) return todos;
  return todos.filter((r) => permitidos.includes(r.value));
});

const dialogo = ref(false);
const formRef = ref();
const enviando = ref(false);
const r = useValidations();

const form = ref({ email: "", name: "", role: "dispatcher" });

/** Invitación recién creada: se muestra su link por si el mail no llega. */
const recienCreada = ref<any>(null);

const abrirDialogo = () => {
  form.value = { email: "", name: "", role: "dispatcher" };
  recienCreada.value = null;
  dialogo.value = true;
};

const linkDe = (token: string) =>
  `${window.location.origin}/invite/${token}`;

const copiar = async (token: string) => {
  try {
    await navigator.clipboard.writeText(linkDe(token));
    general.setSnackbar({ color: "success", message: "Link copiado." });
  } catch {
    general.setSnackbar({
      color: "error",
      message: "No se pudo copiar. Seleccionalo y copialo a mano.",
    });
  }
};

const invitar = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  enviando.value = true;
  try {
    const res: any = await post("invites", {
      email: form.value.email.trim().toLowerCase(),
      name: form.value.name.trim() || undefined,
      role: form.value.role,
    });

    recienCreada.value = res;
    general.setSnackbar({
      color: res.emailEnviado ? "success" : "warning",
      message: res.emailEnviado
        ? `Invitación enviada a ${res.email}.`
        : "La invitación se creó, pero el mail no pudo salir. Pasale el link.",
    });

    await cargarInvitaciones();
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    enviando.value = false;
  }
};

const cargarInvitaciones = async () => {
  cargandoInvitaciones.value = true;
  try {
    invitaciones.value = await get("invites");
  } catch {
    invitaciones.value = [];
  } finally {
    cargandoInvitaciones.value = false;
  }
};

const confirmar = ref(false);
const aCancelar = ref<any>(null);

const pedirCancelar = (i: any) => {
  aCancelar.value = i;
  confirmar.value = true;
};

const onCancelar = async (payload: { resp: boolean }) => {
  if (payload.resp && aCancelar.value) {
    try {
      await del(`invites/${aCancelar.value.id}`);
      general.setSnackbar({ color: "success", message: "Invitación cancelada." });
      await cargarInvitaciones();
    } catch (e: any) {
      general.setErrorSnackbar(e);
    }
  }
  aCancelar.value = null;
};

const vencida = (i: any) => new Date(i.expiresAt).getTime() < Date.now();

onMounted(() => {
  cargarUsuarios();
  cargarInvitaciones();
});
</script>

<template>
  <div>
    <PageHeader
      title="Equipo"
      subtitle="Quién tiene acceso al sistema y qué invitaciones están pendientes"
    >
      <template #actions>
        <v-btn
          v-if="esAdmin"
          color="primary"
          prepend-icon="mdi-account-plus-outline"
          @click="abrirDialogo"
        >
          Invitar
        </v-btn>
      </template>
    </PageHeader>

    <v-alert
      type="info"
      variant="tonal"
      rounded="lg"
      density="comfortable"
      class="mb-5"
    >
      <div class="text-body-2">
        <strong>Las invitaciones son para gente sin legajo</strong>: un
        despachante tercerizado, tu contador, un socio, un auditor externo.
        Reciben un mail, eligen su propia contraseña y entran con el rol que les
        asignes.
      </div>
      <div class="text-body-2 mt-1">
        Para <strong>personal en relación de dependencia</strong> —choferes,
        taller, administración— usá
        <NuxtLink to="/admin/rrhh" class="text-primary">RRHH</NuxtLink>: además
        del acceso, arma el legajo con documento, puesto y fecha de ingreso.
      </div>
    </v-alert>

    <!-- ───────── Invitaciones pendientes ───────── -->
    <v-card
      v-if="invitaciones.length || cargandoInvitaciones"
      border
      flat
      rounded="lg"
      class="mb-5"
    >
      <div class="pa-5 pb-2">
        <div class="text-subtitle-1 font-weight-medium">
          Invitaciones pendientes
        </div>
        <div class="text-caption text-medium-emphasis">
          Todavía nadie las aceptó. Vencen a los 7 días de enviadas.
        </div>
      </div>

      <div v-if="cargandoInvitaciones" class="d-flex justify-center py-6">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Email</th>
            <th>Rol</th>
            <th>Vence</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in invitaciones" :key="i.id">
            <td>
              <div class="text-body-2">{{ i.email }}</div>
              <div v-if="i.name" class="text-caption text-medium-emphasis">
                {{ i.name }}
              </div>
            </td>
            <td>
              <v-chip size="x-small" variant="tonal">
                {{ ROLES[i.role] ?? i.role }}
              </v-chip>
            </td>
            <td>
              <span :class="{ 'text-error': vencida(i) }">
                {{ fmtDate(i.expiresAt) }}
                <template v-if="vencida(i)">(vencida)</template>
              </span>
            </td>
            <td class="text-right">
              <IconBtn
                tooltip="Copiar el link de la invitación"
                icon="mdi-link-variant"
                size="small"
                variant="text"
                @click="copiar(i.token)"
              />
              <IconBtn
                v-if="esAdmin"
                tooltip="Cancelar la invitación"
                icon="mdi-close"
                size="small"
                variant="text"
                color="error"
                @click="pedirCancelar(i)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- ───────── Usuarios con acceso ───────── -->
    <div class="d-flex flex-wrap ga-2 align-center mb-4">
      <v-text-field
        v-model="busqueda"
        label="Buscar por nombre o email"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="min-width: 240px; max-width: 360px"
        @update:model-value="buscar"
      />
    </div>

    <ResponsiveTable
      :headers="headersUsuarios"
      :items="usuarios"
      :loading="cargandoUsuarios"
      :error="errorUsuarios"
      all-items
      no-data-text="No hay usuarios que coincidan"
      @retry="cargarUsuarios"
    >
      <template #item.role="{ item }">
        <v-chip size="small" variant="tonal" label>
          {{ ROLES[item.role] ?? item.role }}
        </v-chip>
      </template>
      <template #item.lastConnection="{ item }">
        <span v-if="item.lastConnection">
          {{ fmtDate(item.lastConnection) }}
        </span>
        <span v-else class="text-medium-emphasis">Nunca entró</span>
      </template>
    </ResponsiveTable>

    <TablePagination
      :page="paginacion.currentPage"
      :length="paginacion.totalPages"
      @change="cambiarPagina"
    />

    <!-- ───────── Alta de invitación ───────── -->
    <v-dialog v-model="dialogo" max-width="520">
      <v-card border flat rounded="lg" class="pa-6">
        <div class="text-h6 font-weight-bold mb-1">Invitar a alguien</div>
        <p class="text-body-2 text-medium-emphasis mb-5">
          Le llega un mail con un link. Elige su contraseña y entra: vos nunca
          la conocés.
        </p>

        <!-- Creada: se muestra el link como respaldo del mail. -->
        <template v-if="recienCreada">
          <v-alert
            :type="recienCreada.emailEnviado ? 'success' : 'warning'"
            variant="tonal"
            rounded="lg"
            density="comfortable"
            class="mb-4"
          >
            <div class="text-body-2">
              <template v-if="recienCreada.emailEnviado">
                Le mandamos el mail a <strong>{{ recienCreada.email }}</strong>.
              </template>
              <template v-else>
                La invitación quedó creada, pero <strong>el mail no salió</strong>.
                Pasale este link por otro medio.
              </template>
            </div>
          </v-alert>

          <v-text-field
            :model-value="linkDe(recienCreada.token)"
            label="Link de la invitación"
            variant="outlined"
            density="compact"
            readonly
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copiar(recienCreada.token)"
          />

          <div class="d-flex justify-end ga-2 mt-2">
            <v-btn variant="text" @click="dialogo = false">Cerrar</v-btn>
            <v-btn color="primary" variant="flat" @click="abrirDialogo">
              Invitar a otra persona
            </v-btn>
          </div>
        </template>

        <v-form v-else ref="formRef" @submit.prevent="invitar">
          <v-label class="font-weight-bold mb-1">Email</v-label>
          <v-text-field
            v-model="form.email"
            variant="outlined"
            density="comfortable"
            type="email"
            placeholder="contador@estudio.com"
            :rules="[r.isRequired, r.isEmail]"
          />

          <v-label class="font-weight-bold mb-1">
            Nombre <span class="text-medium-emphasis">(opcional)</span>
          </v-label>
          <v-text-field
            v-model="form.name"
            variant="outlined"
            density="comfortable"
            placeholder="Cómo lo vas a ver en el listado"
          />

          <v-label class="font-weight-bold mb-1">Rol</v-label>
          <v-select
            v-model="form.role"
            :items="rolesDisponibles"
            variant="outlined"
            density="comfortable"
            :rules="[r.isRequired]"
            hint="Sólo aparecen los roles que incluye tu plan"
            persistent-hint
          />

          <div class="d-flex justify-end ga-2 mt-5">
            <v-btn variant="text" @click="dialogo = false">Cancelar</v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              :loading="enviando"
            >
              Enviar invitación
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <ModalConfirm
      v-model="confirmar"
      title="Cancelar invitación"
      description="<p>El link deja de funcionar. Si la persona todavía la necesita, vas a tener que invitarla de nuevo.</p>"
      @save="onCancelar"
    />
  </div>
</template>
