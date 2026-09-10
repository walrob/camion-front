<script setup lang="ts">
import { computed, ref } from "vue";
import { useExcel, EXCEL_ACCEPT } from "~/composables/useExcel";
import type { ExcelImportResult } from "~/composables/useExcel";
import { useFeatures } from "~/composables/useFeatures";
import { useGeneralStore } from "~/stores/general";

const props = withDefaults(
  defineProps<{
    /** Endpoint de descarga, ej. "trucks/export/". */
    exportUrl: string;
    /** Nombre del archivo que baja, ej. "camiones.xlsx". */
    exportName: string;
    /**
     * Filtros actuales de la tabla. Viajan tal cual al endpoint, que ignora la
     * paginación pero los respeta: lo que baja es lo que se está viendo.
     */
    exportParams?: Record<string, any>;
    /** Endpoint de carga. Sin esto, el menú queda de solo descarga. */
    importUrl?: string;
    /** Endpoint de la plantilla vacía. */
    templateUrl?: string;
    /** Cómo se llama lo que se carga, para los textos: "camiones", "choferes". */
    entidad?: string;
    /** Deshabilita la descarga (por ejemplo, si la tabla está vacía). */
    disabled?: boolean;
  }>(),
  { exportParams: () => ({}), entidad: "registros" },
);

const emit = defineEmits<{ imported: [] }>();

const { descargar, subir, resumen } = useExcel();
const { has } = useFeatures();
const general = useGeneralStore();

// El plan decide si se puede exportar (MODELO-COMERCIAL §4.1). Es solo la
// experiencia: quien corta de verdad es el backend.
const puedeExportar = computed(() => has("export_excel"));

const bajando = ref(false);
const dialog = ref(false);
const archivo = ref<File | null>(null);
const validando = ref(false);
const confirmando = ref(false);
const previa = ref<ExcelImportResult | null>(null);

const onDescargar = async () => {
  bajando.value = true;
  await descargar(props.exportUrl, props.exportName, props.exportParams);
  bajando.value = false;
};

const onPlantilla = async () => {
  if (!props.templateUrl) return;
  await descargar(props.templateUrl, `plantilla-${props.entidad}.xlsx`);
};

const abrirCarga = () => {
  archivo.value = null;
  previa.value = null;
  dialog.value = true;
};

/**
 * El archivo se toma del evento del DOM y no del `v-model` —como en el resto de
 * los diálogos— porque `v-file-input` entrega un `File[]` o un `File` según la
 * versión, y acá siempre es uno solo.
 *
 * Además se descarta la previsualización anterior: confirmar con el resumen de
 * otro archivo cargaría algo distinto de lo que se vio.
 */
const onArchivo = (e: Event) => {
  archivo.value = (e.target as HTMLInputElement).files?.[0] ?? null;
  previa.value = null;
};

const onValidar = async () => {
  if (!archivo.value || !props.importUrl) return;
  validando.value = true;
  previa.value = await subir(props.importUrl, archivo.value, true);
  validando.value = false;
};

const onConfirmar = async () => {
  if (!archivo.value || !props.importUrl) return;
  confirmando.value = true;
  const r = await subir(props.importUrl, archivo.value, false);
  confirmando.value = false;
  if (!r) return;

  if (r.errores.length) {
    // Dos casos distintos: un error de validación no escribió nada y alcanza
    // con corregir y volver a subir; una carga interrumpida sí dejó filas
    // guardadas. El diálogo los diferencia y en el segundo se recarga la tabla
    // para que se vea lo que entró.
    previa.value = r;
    if (r.interrumpido) emit("imported");
    return;
  }
  general.setSuccessSnackbar(resumen(r));
  dialog.value = false;
  emit("imported");
};

const hayErrores = computed(() => !!previa.value?.errores.length);
const listoParaConfirmar = computed(
  () => !!previa.value && !hayErrores.value && !!previa.value.procesadas,
);
</script>

<template>
  <div class="d-inline-flex">
    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="tonal"
          color="success"
          prepend-icon="mdi-file-excel"
          :loading="bajando"
        >
          Excel
        </v-btn>
      </template>

      <v-list density="compact" min-width="240">
        <!--
          Sin el plan que habilita la exportación el ítem no se esconde: se
          muestra con candado y lleva al upsell, que es lo que hace el resto de
          la app con lo que el plan no incluye.
        -->
        <v-list-item
          v-if="puedeExportar"
          prepend-icon="mdi-download"
          :disabled="disabled"
          @click="onDescargar"
        >
          <v-list-item-title>Descargar Excel</v-list-item-title>
          <v-list-item-subtitle>Con los filtros aplicados</v-list-item-subtitle>
        </v-list-item>
        <v-list-item
          v-else
          prepend-icon="mdi-lock-outline"
          to="/upgrade/export_excel"
        >
          <v-list-item-title>Descargar Excel</v-list-item-title>
          <v-list-item-subtitle>Incluido desde Operación</v-list-item-subtitle>
        </v-list-item>

        <template v-if="importUrl">
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-upload" @click="abrirCarga">
            <v-list-item-title>Cargar desde Excel</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="templateUrl"
            prepend-icon="mdi-file-download-outline"
            @click="onPlantilla"
          >
            <v-list-item-title>Descargar plantilla</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <v-dialog v-model="dialog" max-width="680" scrollable>
      <v-card border flat rounded="lg">
        <v-card-title class="text-h6 font-weight-bold py-4">
          Cargar {{ entidad }} desde Excel
        </v-card-title>
        <v-divider />

        <v-card-text class="py-4">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Subí un archivo .xlsx o .csv con los encabezados de la plantilla. Se
            valida antes de guardar: si alguna fila tiene un problema no se
            carga ninguna, así no queda una carga a medias.
          </p>

          <v-file-input
            :accept="EXCEL_ACCEPT"
            label="Archivo"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            variant="outlined"
            density="compact"
            show-size
            hide-details="auto"
            @change="onArchivo"
          />

          <v-btn
            v-if="templateUrl"
            variant="text"
            size="small"
            color="primary"
            prepend-icon="mdi-file-download-outline"
            class="mt-2 px-0"
            @click="onPlantilla"
          >
            Descargar plantilla
          </v-btn>

          <!-- Resultado de la validación -->
          <template v-if="previa">
            <v-divider class="my-4" />

            <v-alert
              v-if="previa.interrumpido"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              La carga se detuvo al guardar: {{ resumen(previa) }}. Las filas
              siguientes quedaron sin cargar. Revisá el motivo, sacá del archivo
              lo que ya entró o volvé a subirlo completo (lo que ya existe se
              actualiza, no se duplica).
            </v-alert>
            <v-alert
              v-else-if="hayErrores"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              No se cargó nada. Corregí estas filas y volvé a subir el archivo.
            </v-alert>
            <v-alert
              v-else-if="previa.procesadas"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ previa.procesadas }} filas leídas · {{ resumen(previa) }}.
            </v-alert>
            <v-alert v-else type="info" variant="tonal" density="compact">
              El archivo no tiene filas para cargar.
            </v-alert>

            <v-table v-if="hayErrores" density="compact" class="excel-errores">
              <thead>
                <tr>
                  <th class="text-left">Fila</th>
                  <th class="text-left">Columna</th>
                  <th class="text-left">Problema</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(e, i) in previa.errores" :key="i">
                  <td>{{ e.fila }}</td>
                  <td>{{ e.columna ?? "-" }}</td>
                  <td>{{ e.motivo }}</td>
                </tr>
              </tbody>
            </v-table>
          </template>
        </v-card-text>

        <v-divider />
        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn
            v-if="!listoParaConfirmar"
            color="primary"
            :loading="validando"
            :disabled="!archivo"
            @click="onValidar"
          >
            Validar
          </v-btn>
          <v-btn
            v-else
            color="primary"
            :loading="confirmando"
            @click="onConfirmar"
          >
            Confirmar carga
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* La lista de errores puede ser larga: se scrollea sola en vez de estirar el
   diálogo hasta que el botón Confirmar quede fuera de pantalla. */
.excel-errores {
  max-height: 260px;
  overflow-y: auto;
}
</style>
