<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";
import { roleOptions } from "~/composables/useHrStatus";

/**
 * Usuarios de todas las empresas, para soporte.
 *
 * Responde el «no puedo entrar» sin pedir capturas: rol, si la cuenta está
 * habilitada (activa, no bloqueada y con el email verificado) y cuándo entró
 * por última vez. Sólo lectura: la cuenta la administra el admin de su empresa.
 *
 * Filtra y pagina contra el servidor, como Empresas. Acepta `?empresa=<id>`
 * en la URL para llegar filtrado desde la ficha de una empresa.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Usuarios" });

const { get } = useApi();
const { fmtDateTime, fmtDate } = useFormatters();
const general = useGeneralStore();
const route = useRoute();

const usuarios = ref<any[]>([]);
const meta = ref<any>(null);
const cargando = ref(true);
const pagina = ref(1);
const busqueda = ref("");
const rol = ref<string | null>(null);
const acceso = ref<string | null>(null);
const empresa = ref<string | null>(
  typeof route.query.empresa === "string" ? route.query.empresa : null,
);
const empresaNombre = ref<string | null>(null);

/**
 * Resumen de las tres condiciones que hacen falta para poder entrar. Es el
 * mismo cálculo que hace el backend (`acceso`); acá sólo se le pone color.
 */
const ACCESO: Record<string, { label: string; color: string; icon: string }> = {
  habilitado: { label: "Habilitado", color: "success", icon: "mdi-check-circle" },
  "sin-verificar": { label: "Email sin verificar", color: "warning", icon: "mdi-email-alert" },
  bloqueado: { label: "Bloqueado", color: "error", icon: "mdi-cancel" },
  inactivo: { label: "Inactivo", color: "grey", icon: "mdi-account-off" },
};
const ACCESOS = Object.entries(ACCESO).map(([value, a]) => ({ value, title: a.label }));

const ROLES = [
  { value: "superadmin", title: "Superadmin" },
  ...roleOptions.map((r) => ({ value: r.value, title: r.label })),
];
const rolLabel = (r: string) => ROLES.find((x) => x.value === r)?.title ?? r;

const cargar = async () => {
  cargando.value = true;
  try {
    const r: any = await get("superadmin/users", {
      page: pagina.value,
      limit: 25,
      search: busqueda.value || undefined,
      rol: rol.value || undefined,
      acceso: acceso.value || undefined,
      empresa: empresa.value || undefined,
    });
    usuarios.value = r.items;
    meta.value = r.meta;
    // El filtro por empresa viene por URL sin nombre: se toma de la primera fila.
    if (empresa.value && r.items.length) empresaNombre.value = r.items[0].companyName;
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    cargando.value = false;
  }
};

let debounce: ReturnType<typeof setTimeout>;
watch([busqueda, rol, acceso, empresa], () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    pagina.value = 1;
    cargar();
  }, 400);
});

watch(pagina, cargar);

onMounted(cargar);
</script>

<template>
  <div>
    <PageHeader
      title="Usuarios"
      :subtitle="`${meta?.totalItems ?? 0} usuarios.`"
      :breadcrumbs="[{ title: 'Plataforma', to: '/superadmin' }, { title: 'Usuarios', disabled: true }]"
    />

    <div class="d-flex flex-wrap ga-3 mb-4">
      <v-text-field
        v-model="busqueda"
        placeholder="Buscar por email, nombre o empresa"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 320px"
      />
      <v-select
        v-model="rol"
        :items="ROLES"
        label="Rol"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 180px"
      />
      <v-select
        v-model="acceso"
        :items="ACCESOS"
        label="Acceso"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 200px"
      />
      <!-- Filtro por empresa: sólo llega por URL, desde la ficha. -->
      <v-chip
        v-if="empresa"
        variant="tonal"
        color="primary"
        closable
        class="align-self-center"
        @click:close="empresa = null; empresaNombre = null"
      >
        <v-icon start size="16">mdi-office-building</v-icon>
        {{ empresaNombre ?? "Empresa" }}
      </v-chip>
    </div>

    <v-card border flat rounded="lg">
      <div v-if="cargando" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Empresa</th>
            <th>Rol</th>
            <th>Acceso</th>
            <th>Email verificado</th>
            <th>Última conexión</th>
            <th>Alta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>
              <div class="font-weight-medium">{{ u.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ u.email }}</div>
              <div v-if="u.phone" class="text-caption text-medium-emphasis">{{ u.phone }}</div>
            </td>
            <td>
              <NuxtLink
                v-if="u.companyId"
                :to="`/superadmin/empresas/${u.companyId}`"
                class="text-decoration-none"
              >
                {{ u.companyName }}
              </NuxtLink>
              <span v-else>—</span>
            </td>
            <td>{{ rolLabel(u.role) }}</td>
            <td>
              <v-chip :color="ACCESO[u.acceso]?.color" variant="tonal" size="x-small">
                <v-icon start size="12">{{ ACCESO[u.acceso]?.icon }}</v-icon>
                {{ ACCESO[u.acceso]?.label ?? u.acceso }}
              </v-chip>
            </td>
            <td>
              <span v-if="u.emailVerifiedAt">{{ fmtDate(u.emailVerifiedAt) }}</span>
              <span v-else class="text-warning">Pendiente</span>
            </td>
            <td>{{ u.lastConnection ? fmtDateTime(u.lastConnection) : "Nunca" }}</td>
            <td>{{ fmtDate(u.createdAt) }}</td>
          </tr>
          <tr v-if="!usuarios.length">
            <td colspan="7" class="text-center text-medium-emphasis py-6">
              Sin resultados.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <div v-if="meta && meta.totalPages > 1" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="pagina"
        :length="meta.totalPages"
        :total-visible="7"
        density="comfortable"
      />
    </div>
  </div>
</template>
