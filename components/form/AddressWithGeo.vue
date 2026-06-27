<script setup lang="ts">
import { watch } from "vue";
import { useValidations } from "~/composables/useValidations";
import type { UserAddress } from "~/types/project";

const r = useValidations();

const props = defineProps<{
  modelValue?: UserAddress | null;
  standalone?: boolean; // true = tiene su propio submit (default), false = embebido en otro form
}>();

const emit = defineEmits(["update:modelValue", "submit", "cancel"]);

const formRef = ref();
const formValid = ref(true);

const form = ref<UserAddress>({
  id: "",
  street: "",
  city: "",
  province: "",
  isDefault: false,
  latitude: undefined,
  longitude: undefined,
});

// SYNC v-model
// Flag para evitar el loop reactivo: emit → prop cambia → form cambia → emit → ∞
let isEmitting = false;

watch(
  () => props.modelValue,
  (val) => {
    if (isEmitting) return; // el cambio viene de nuestro propio emit, ignorar
    if (val) form.value = { ...val };
  },
  { immediate: true },
);

watch(
  form,
  (val) => {
    isEmitting = true;
    emit("update:modelValue", val);
    nextTick(() => {
      isEmitting = false;
    });
  },
  { deep: true },
);

// GEOLOCATION
const getGeolocation = () => {
  if (!("geolocation" in navigator)) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.value.latitude = position.coords.latitude;
      form.value.longitude = position.coords.longitude;
    },
    () => {
      // El usuario canceló o no tiene GPS disponible — no bloquear el form
    },
    { timeout: 8000, maximumAge: 60000 },
  );
};

onMounted(getGeolocation);

const submit = async () => {
  const resp = await formRef.value?.validate();
  if (!resp?.valid) return;

  emit("submit", form.value);
};
</script>

<template>
  <v-form
    v-if="standalone !== false"
    id="address-form"
    ref="formRef"
    v-model="formValid"
    @submit.prevent="submit"
  >
    <v-row dense>
      <v-col cols="12">
        <v-label class="font-weight-bold mb-1">Calle</v-label>
        <v-text-field
          v-model="form.street"
          variant="outlined"
          density="compact"
          :rules="[r.isRequired]"
          hide-details
        />
      </v-col>

      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Ciudad</v-label>
        <v-text-field
          v-model="form.city"
          variant="outlined"
          density="compact"
          :rules="[r.isRequired]"
          hide-details
        />
      </v-col>

      <v-col cols="12" sm="6">
        <v-label class="font-weight-bold mb-1">Provincia</v-label>
        <v-text-field
          v-model="form.province"
          variant="outlined"
          density="compact"
          :rules="[r.isRequired]"
          hide-details
        />
      </v-col>

      <slot name="actions" />
    </v-row>
  </v-form>

  <v-row v-else dense>
    <v-col cols="12">
      <v-label class="font-weight-bold mb-1">Calle</v-label>
      <v-text-field
        v-model="form.street"
        variant="outlined"
        density="compact"
        :rules="[r.isRequired]"
        hide-details
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-label class="font-weight-bold mb-1">Ciudad</v-label>
      <v-text-field
        v-model="form.city"
        variant="outlined"
        density="compact"
        :rules="[r.isRequired]"
        hide-details
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-label class="font-weight-bold mb-1">Provincia</v-label>
      <v-text-field
        v-model="form.province"
        variant="outlined"
        density="compact"
        :rules="[r.isRequired]"
        hide-details
      />
    </v-col>

    <slot name="actions" />
  </v-row>
</template>
