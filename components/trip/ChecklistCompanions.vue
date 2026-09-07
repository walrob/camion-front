<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import {
  useChecklistStore,
  type CompanionCandidate,
} from "~/stores/checklist";
import { useSettingsStore } from "~/stores/settings";
import VoiceTextField from "~/components/form/VoiceTextField.vue";

/**
 * Bloque de acompañantes de la planilla pre-viaje.
 *
 * Declarar un acompañante no es un dato más: según cómo esté configurada la
 * empresa, deja la unidad esperando la validación de Tráfico y puede exigir el
 * seguro y el documento antes de poder firmar. Todo eso se dice acá, mientras
 * el chofer carga los datos, y no cuando la firma rebota.
 */
defineProps<{ disabled?: boolean }>();

const store = useChecklistStore();
const { checklist } = storeToRefs(store);
const settings = useSettingsStore();

// Su default en el back es `true`, así que se pide con default: sin esto, el
// bloque desaparecería mientras los ajustes no hayan cargado.
const permitidos = computed(() =>
  settings.boolCon("checklist.allowCompanion", true),
);
const exigeSeguro = computed(() =>
  settings.bool("checklist.requireCompanionInsurance"),
);
const exigeDocumento = computed(() =>
  settings.bool("checklist.requireCompanionDocument"),
);
const validaTrafico = computed(() =>
  settings.bool("checklist.requireValidationWithCompanion"),
);

const companions = computed(() => checklist.value?.companions ?? []);
const viajaAcompanado = computed(
  () => !!checklist.value?.hasCompanion || companions.value.length > 0,
);

const dialogo = ref(false);
const guardando = ref(false);
const form = ref({
  fullName: "",
  document: "",
  relationship: "",
  insuranceRequested: false,
  notes: "",
});

/**
 * Alguien que ya está en el sistema.
 *
 * Un chofer que viaja de acompañante de otro ya tiene su nombre, su documento y
 * su DNI cargados en el legajo: volver a pedirlos es pedir dos veces el mismo
 * dato, y es donde aparece el documento tipeado distinto.
 */
const delSistema = ref(true);
const candidatos = ref<CompanionCandidate[]>([]);
const buscando = ref(false);
const elegido = ref<CompanionCandidate | null>(null);

const buscar = async (texto?: string) => {
  buscando.value = true;
  candidatos.value = await store.getCompanionCandidates(texto);
  buscando.value = false;
};

const puedeGuardar = computed(() => {
  if (delSistema.value) return !!elegido.value;
  return (
    !!form.value.fullName.trim() &&
    (!exigeDocumento.value || !!form.value.document.trim())
  );
});

const abrir = async () => {
  form.value = {
    fullName: "",
    document: "",
    relationship: "",
    insuranceRequested: false,
    notes: "",
  };
  elegido.value = null;
  delSistema.value = true;
  dialogo.value = true;
  await buscar();
  // Sin candidatos —sin señal, o una empresa de un solo chofer— el selector
  // vacío sería un callejón: se arranca directamente en la carga manual.
  if (!candidatos.value.length) delSistema.value = false;
};

const guardar = async () => {
  if (!puedeGuardar.value) return;
  guardando.value = true;
  const ok = await store.addCompanion(
    delSistema.value
      ? {
          employeeId: elegido.value!.id,
          relationship: form.value.relationship.trim() || undefined,
          insuranceRequested: form.value.insuranceRequested,
          notes: form.value.notes.trim() || undefined,
        }
      : {
          fullName: form.value.fullName.trim(),
          document: form.value.document.trim() || undefined,
          relationship: form.value.relationship.trim() || undefined,
          insuranceRequested: form.value.insuranceRequested,
          notes: form.value.notes.trim() || undefined,
        },
  );
  guardando.value = false;
  if (ok) dialogo.value = false;
};

const onDeclarar = (valor: boolean | null) =>
  store.updateHeader({ hasCompanion: !!valor });

const subiendoDni = ref<string | null>(null);
const dniInput = ref<HTMLInputElement | null>(null);
const companionParaDni = ref<string | null>(null);

const pedirDni = (companionId: string) => {
  companionParaDni.value = companionId;
  dniInput.value?.click();
};

const onDni = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  const id = companionParaDni.value;
  if (file && id) {
    subiendoDni.value = id;
    await store.uploadCompanionDocument(id, file);
    subiendoDni.value = null;
  }
  (e.target as HTMLInputElement).value = "";
  companionParaDni.value = null;
};
</script>

<template>
  <v-card v-if="permitidos" border flat rounded="lg" class="mb-3">
    <v-card-text class="pa-4">
      <div class="text-subtitle-2 font-weight-bold mb-1">Acompañantes</div>

      <v-checkbox
        :model-value="viajaAcompanado"
        :disabled="disabled"
        color="primary"
        density="comfortable"
        hide-details
        label="Viajo con acompañante"
        @update:model-value="onDeclarar($event)"
      />

      <!-- Lo que va a pasar si declara uno, dicho antes y no después de firmar. -->
      <v-alert
        v-if="viajaAcompanado && validaTrafico"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        Con acompañante declarado, la unidad <strong>no queda liberada</strong>
        automáticamente: Tráfico tiene que validar la planilla antes de que te
        dirijas al cliente.
      </v-alert>

      <v-alert
        v-if="viajaAcompanado && exigeSeguro"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        Es obligatorio pedirle el seguro a tu operador de tráfico enviándole el
        DNI. Sin marcarlo, no vas a poder firmar.
      </v-alert>

      <template v-if="viajaAcompanado">
        <v-list v-if="companions.length" density="compact" class="mt-2 pa-0">
          <v-list-item
            v-for="c in companions"
            :key="c.id"
            class="px-0"
            :title="c.fullName"
          >
            <template #subtitle>
              <span>{{ c.document || "Sin documento" }}</span>
              <span v-if="c.relationship"> · {{ c.relationship }}</span>
            </template>
            <template #append>
              <v-chip
                :color="c.insuranceRequested ? 'success' : 'warning'"
                size="x-small"
                variant="tonal"
                label
                class="mr-1"
              >
                {{ c.insuranceRequested ? "Seguro pedido" : "Sin seguro" }}
              </v-chip>
              <!-- El DNI ya está en su legajo: pedirlo de nuevo es pedir dos
                   veces el mismo papel. -->
              <v-tooltip
                v-if="c.idDocumentOnFile"
                text="El DNI ya está cargado en su legajo"
                location="top"
              >
                <template #activator="{ props: t }">
                  <v-icon v-bind="t" size="20" color="success" class="mx-1">
                    mdi-card-account-details-outline
                  </v-icon>
                </template>
              </v-tooltip>
              <IconBtn
                v-else-if="!disabled"
                tooltip="Adjuntar foto del DNI"
                icon="mdi-card-account-details-outline"
                size="small"
                variant="text"
                :loading="subiendoDni === c.id"
                @click="pedirDni(c.id)"
              />
              <IconBtn
                v-if="!disabled"
                tooltip="Quitar acompañante"
                icon="mdi-close"
                size="small"
                variant="text"
                color="error"
                @click="store.removeCompanion(c.id)"
              />
            </template>
          </v-list-item>
        </v-list>

        <p v-else class="text-body-2 text-medium-emphasis mt-2 mb-0">
          Declaraste que viajás acompañado: cargá los datos de cada persona antes
          de firmar.
        </p>

        <v-btn
          v-if="!disabled"
          size="small"
          variant="tonal"
          prepend-icon="mdi-account-plus"
          class="mt-3"
          @click="abrir"
        >
          Agregar acompañante
        </v-btn>
      </template>

      <input
        ref="dniInput"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        @change="onDni"
      />
    </v-card-text>

    <v-dialog v-model="dialogo" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6 font-weight-bold">
          Agregar acompañante
        </v-card-title>
        <v-card-text>
          <v-btn-toggle
            v-model="delSistema"
            mandatory
            variant="outlined"
            divided
            density="comfortable"
            class="mb-4"
          >
            <v-btn :value="true">Está en el sistema</v-btn>
            <v-btn :value="false">Cargar a mano</v-btn>
          </v-btn-toggle>

          <template v-if="delSistema">
            <v-autocomplete
              v-model="elegido"
              :items="candidatos"
              :loading="buscando"
              item-title="fullName"
              return-object
              label="Buscá a la persona *"
              placeholder="Nombre o documento"
              variant="outlined"
              density="comfortable"
              no-filter
              clearable
              class="mb-2"
              @update:search="buscar"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :subtitle="item.raw.position">
                  <template #append>
                    <v-icon
                      v-if="item.raw.hasIdDocument"
                      size="18"
                      color="success"
                    >
                      mdi-card-account-details-outline
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
              <template #no-data>
                <v-list-item
                  title="No encontramos a nadie"
                  subtitle="Probá con otro nombre, o cargalo a mano."
                />
              </template>
            </v-autocomplete>

            <!-- El nombre y el documento salen del legajo. Decirlo evita la
                 pregunta de por qué desaparecieron los campos. -->
            <v-alert
              v-if="elegido"
              :type="elegido.hasIdDocument ? 'success' : 'info'"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              <template v-if="elegido.hasIdDocument">
                Su nombre, documento y foto de DNI ya están en el sistema. No
                hace falta que cargues nada más.
              </template>
              <template v-else>
                Su nombre y documento salen del legajo. La foto del DNI no está
                cargada: vas a poder adjuntarla desde la lista.
              </template>
            </v-alert>
          </template>

          <template v-else>
            <VoiceTextField
              v-model="form.fullName"
              label="Nombre y apellido *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="form.document"
              :label="exigeDocumento ? 'Documento *' : 'Documento'"
              variant="outlined"
              density="comfortable"
              inputmode="numeric"
              class="mb-3"
              :hint="
                exigeDocumento
                  ? 'Tu empresa lo exige para poder firmar la planilla.'
                  : undefined
              "
              persistent-hint
            />
          </template>
          <VoiceTextField
            v-model="form.relationship"
            label="Vínculo"
            placeholder="Cónyuge, hijo/a, compañero/a de trabajo…"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-checkbox
            v-model="form.insuranceRequested"
            color="primary"
            density="comfortable"
            hide-details
            label="Ya le pedí el seguro a mi operador de tráfico"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogo = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="guardando"
            :disabled="!puedeGuardar"
            @click="guardar"
          >
            Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
