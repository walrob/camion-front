<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { TAX_CONDITION_OPTIONS } from "~/types/plan";
import { useApi } from "~/composables/useApi";
import { useAuth } from "~/composables/useAuth";
import { useGeneralStore } from "~/stores/general";

/**
 * Datos con los que se emite la factura del abono.
 *
 * El sistema **no factura**: la administración emite el comprobante por fuera
 * (AFIP, el estudio contable) y lo sube al período. Esta pantalla es de dónde
 * saca los datos, así que lo que se carga acá es lo que va impreso en la
 * factura, y se pide aparte de los datos operativos porque no siempre
 * coinciden: se opera desde un depósito y se factura a la razón social.
 *
 * No pasa por la sesión (`auth/session`) a propósito: son datos que usa una sola
 * pantalla y la sesión se persiste en cada dispositivo. Se leen de
 * `GET /companies/me`, que ya los devuelve.
 */
const { get, patch } = useApi();
const { isAdmin } = useAuth();
const general = useGeneralStore();

interface DatosDeFacturacion {
  invoiceName: string;
  invoiceCuit: string;
  invoiceTaxCondition: string | null;
  invoiceAddress: string;
  invoiceEmail: string;
}

const vacio = (): DatosDeFacturacion => ({
  invoiceName: "",
  invoiceCuit: "",
  invoiceTaxCondition: null,
  invoiceAddress: "",
  invoiceEmail: "",
});

const datos = ref<DatosDeFacturacion>(vacio());
const nombreDeLaEmpresa = ref("");
const cargando = ref(true);
const guardando = ref(false);
const editando = ref(false);
const formRef = ref<any>(null);

const cargar = async () => {
  cargando.value = true;
  try {
    const c: any = await get("companies/me");
    nombreDeLaEmpresa.value = c?.name ?? "";
    datos.value = {
      invoiceName: c?.invoiceName ?? "",
      invoiceCuit: c?.invoiceCuit ?? c?.cuit ?? "",
      invoiceTaxCondition: c?.invoiceTaxCondition ?? null,
      invoiceAddress: c?.invoiceAddress ?? "",
      invoiceEmail: c?.invoiceEmail ?? "",
    };
  } catch (e) {
    general.setErrorSnackbar(e);
  } finally {
    cargando.value = false;
  }
};

onMounted(cargar);

/**
 * Qué falta para poder emitir. Se avisa en lugar de exigirlo con un formulario
 * bloqueante: la empresa puede operar sin haberlo completado, pero entonces la
 * factura sale a nombre de la razón social del alta y sin condición de IVA.
 */
const faltantes = computed(() => {
  const f: string[] = [];
  if (!datos.value.invoiceName) f.push("razón social");
  if (!datos.value.invoiceCuit) f.push("CUIT");
  if (!datos.value.invoiceTaxCondition) f.push("condición frente al IVA");
  if (!datos.value.invoiceEmail) f.push("email de facturación");
  return f;
});

const completo = computed(() => !faltantes.value.length);

const etiquetaIva = computed(
  () =>
    TAX_CONDITION_OPTIONS.find(
      (o) => o.value === datos.value.invoiceTaxCondition,
    )?.label ?? "—",
);

// El CUIT se muestra formateado pero se guarda con los 11 dígitos pelados: es
// como lo espera cualquier sistema de facturación.
const soloDigitos = (v: string) => String(v ?? "").replace(/\D/g, "");
const cuitFormateado = computed(() => {
  const d = soloDigitos(datos.value.invoiceCuit);
  if (d.length !== 11) return datos.value.invoiceCuit || "—";
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
});

const reglaCuit = (v: string) => {
  if (!v) return true;
  return soloDigitos(v).length === 11 || "El CUIT tiene 11 dígitos.";
};
const reglaEmail = (v: string) => {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Email inválido.";
};

const editar = () => {
  editando.value = true;
};

const cancelar = () => {
  editando.value = false;
  cargar();
};

const guardar = async () => {
  const res = await formRef.value?.validate();
  if (res && !res.valid) return;

  guardando.value = true;
  try {
    await patch("companies/me", {
      invoiceName: datos.value.invoiceName || null,
      invoiceCuit: soloDigitos(datos.value.invoiceCuit) || null,
      invoiceTaxCondition: datos.value.invoiceTaxCondition || null,
      invoiceAddress: datos.value.invoiceAddress || null,
      invoiceEmail: datos.value.invoiceEmail || null,
    });
    general.setSuccessSnackbar("Datos de facturación guardados");
    editando.value = false;
    await cargar();
  } catch (e) {
    general.setErrorSnackbar(e);
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <v-card border flat rounded="lg" class="pa-6">
    <div class="d-flex align-center ga-2 mb-1">
      <div class="text-subtitle-1 font-weight-medium">
        Datos de facturación
      </div>
      <v-chip
        v-if="!cargando"
        size="x-small"
        :color="completo ? 'success' : 'warning'"
        variant="tonal"
        label
      >
        {{ completo ? "Completos" : "Incompletos" }}
      </v-chip>
      <v-spacer />
      <v-btn
        v-if="isAdmin && !editando && !cargando"
        size="small"
        variant="text"
        color="primary"
        prepend-icon="mdi-pencil"
        @click="editar"
      >
        Editar
      </v-btn>
    </div>

    <p class="text-body-2 text-medium-emphasis mb-4">
      Con estos datos se emite la factura del abono. Podés facturar a una razón
      social y un domicilio distintos de los operativos.
    </p>

    <v-skeleton-loader v-if="cargando" type="paragraph" />

    <!-- Lectura -->
    <template v-else-if="!editando">
      <v-alert
        v-if="!completo"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Falta {{ faltantes.join(", ") }}. Sin esos datos la factura se emite a
        nombre de «{{ nombreDeLaEmpresa }}» y puede no servirte para descargar
        el IVA.
      </v-alert>

      <div class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-2 text-medium-emphasis">Razón social</span>
        <strong class="text-body-2 text-right">
          {{ datos.invoiceName || "—" }}
        </strong>
      </div>
      <div class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-2 text-medium-emphasis">CUIT</span>
        <strong class="text-body-2 text-right">{{ cuitFormateado }}</strong>
      </div>
      <div class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-2 text-medium-emphasis">
          Condición frente al IVA
        </span>
        <strong class="text-body-2 text-right">{{ etiquetaIva }}</strong>
      </div>
      <div class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-2 text-medium-emphasis">Domicilio fiscal</span>
        <strong class="text-body-2 text-right">
          {{ datos.invoiceAddress || "—" }}
        </strong>
      </div>
      <div class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-2 text-medium-emphasis">
          Email de facturación
        </span>
        <strong class="text-body-2 text-right">
          {{ datos.invoiceEmail || "—" }}
        </strong>
      </div>
    </template>

    <!-- Edición -->
    <v-form v-else ref="formRef" @submit.prevent="guardar">
      <v-row dense>
        <v-col cols="12" md="7">
          <v-text-field
            v-model="datos.invoiceName"
            label="Razón social"
            variant="outlined"
            density="compact"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="datos.invoiceCuit"
            label="CUIT"
            placeholder="30-71234567-4"
            variant="outlined"
            density="compact"
            :rules="[reglaCuit]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="datos.invoiceTaxCondition"
            :items="TAX_CONDITION_OPTIONS"
            item-title="label"
            item-value="value"
            label="Condición frente al IVA"
            variant="outlined"
            density="compact"
            clearable
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="datos.invoiceEmail"
            label="Email de facturación"
            type="email"
            variant="outlined"
            density="compact"
            :rules="[reglaEmail]"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="datos.invoiceAddress"
            label="Domicilio fiscal"
            variant="outlined"
            density="compact"
            hide-details="auto"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-end ga-2 mt-4">
        <v-btn variant="text" @click="cancelar">Cancelar</v-btn>
        <v-btn color="primary" :loading="guardando" type="submit">
          Guardar
        </v-btn>
      </div>
    </v-form>
  </v-card>
</template>
