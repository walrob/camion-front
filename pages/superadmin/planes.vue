<script setup lang="ts">
import { onMounted, ref } from "vue";
import PageHeader from "~/components/shared/PageHeader.vue";

/**
 * ABM de planes.
 *
 * Es el motivo por el que los precios viven en la base y no en el código: un
 * ajuste de lista —trimestral, por inflación— se hace desde acá y la landing y
 * la facturación lo toman sin deploy (decisión D8).
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Planes" });

const { get, patch } = useApi();
const { money } = useFormatters();

const planes = ref<any[]>([]);
const cargando = ref(true);
const guardando = ref(false);
const aviso = ref<{ texto: string; color: string } | null>(null);

const editando = ref<any>(null);
const dialogo = ref(false);

const cargar = async () => {
  cargando.value = true;
  try {
    planes.value = (await get("plans/public")) as any[];
  } finally {
    cargando.value = false;
  }
};

const abrir = (p: any) => {
  // Copia: no se toca la fila del listado hasta confirmar.
  editando.value = {
    code: p.code,
    name: p.name,
    baseFee: Number(p.baseFee),
    pricePerVehicle: Number(p.pricePerVehicle),
    setupFee: Number(p.setupFee),
  };
  dialogo.value = true;
};

const guardar = async () => {
  guardando.value = true;
  aviso.value = null;
  try {
    const { code, ...datos } = editando.value;
    await patch(`superadmin/plans/${code}`, datos);
    aviso.value = {
      texto: "Plan actualizado. Los clientes lo ven en menos de un minuto.",
      color: "success",
    };
    dialogo.value = false;
    await cargar();
  } catch (e: any) {
    aviso.value = {
      texto: e?.response?.data?.message ?? "No se pudo guardar.",
      color: "error",
    };
  } finally {
    guardando.value = false;
  }
};

onMounted(cargar);
</script>

<template>
  <div>
    <PageHeader
      title="Planes"
      subtitle="Los precios viven en la base: cambiarlos acá actualiza la landing y la facturación sin necesidad de un despliegue."
      :breadcrumbs="[{ title: 'Plataforma', to: '/superadmin' }, { title: 'Planes', disabled: true }]"
    />

    <v-alert
      v-if="aviso"
      :type="aviso.color as any"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="mb-4"
      closable
      @click:close="aviso = null"
    >
      {{ aviso.texto }}
    </v-alert>

    <v-card border flat rounded="lg">
      <div v-if="cargando" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Plan</th>
            <th class="text-right">Abono</th>
            <th class="text-right">Por vehículo</th>
            <th class="text-right">Implementación</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in planes" :key="p.code">
            <td>
              <div class="font-weight-medium">{{ p.name }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ p.features.length }} funcionalidades
              </div>
            </td>
            <td class="text-right">{{ money(p.baseFee) }}</td>
            <td class="text-right">{{ money(p.pricePerVehicle) }}</td>
            <td class="text-right">{{ money(p.setupFee) }}</td>
            <td class="text-right">
              <v-btn size="small" variant="text" @click="abrir(p)">
                Editar
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialogo" max-width="460">
      <v-card v-if="editando" rounded="lg" class="pa-5">
        <div class="text-h6 font-weight-bold mb-1">{{ editando.name }}</div>
        <p class="text-caption text-medium-emphasis mb-4">
          Los períodos ya emitidos no se recalculan: el cambio rige de acá en
          adelante.
        </p>

        <v-text-field
          v-model.number="editando.baseFee"
          label="Abono mensual"
          type="number"
          variant="outlined"
          density="comfortable"
          prefix="$"
        />
        <v-text-field
          v-model.number="editando.pricePerVehicle"
          label="Precio por vehículo"
          type="number"
          variant="outlined"
          density="comfortable"
          prefix="$"
        />
        <v-text-field
          v-model.number="editando.setupFee"
          label="Implementación (pago único)"
          type="number"
          variant="outlined"
          density="comfortable"
          prefix="$"
        />

        <div class="d-flex justify-end ga-2 mt-2">
          <v-btn variant="text" @click="dialogo = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" @click="guardar">
            Guardar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
