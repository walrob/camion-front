<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
      <UiModalCard :title="'Nuevo ' + props.title">
        <v-row>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Nombre</v-label>
            <v-text-field
              v-model="form.name"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              :rules="[r.isRequired]"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Email</v-label>
            <v-text-field
              v-model="form.email"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details
              :rules="[r.isEmail, required ? r.isRequired : true]"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Contraseña</v-label>
            <v-text-field
              v-model="form.password"
              variant="outlined"
              color="primary"
              density="compact"
              autocomplete="current-password"
              :rules="[r.isRequired, r.isPassword]"
              :type="showPass ? 'text' : 'password'"
              :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPass = !showPass"
            />
          </v-col>
        </v-row>

        <template #footer>
          <v-btn text="Cancelar" variant="text" @click="dialog = false"></v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            text="Guardar"
            type="submit"
          ></v-btn>
        </template>
      </UiModalCard>
    </v-form>
  </v-dialog>
</template>

<script setup lang="ts">
import UiModalCard from "@/components/shared/UiModalCard.vue";
import type { UserOperator } from "~/types/project";

import { useValidations } from "~/composables/useValidations";
const r = useValidations();

const props = defineProps({
  required: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object as () => UserOperator,
    default: { e: "", password: "", email: "", name: "" },
  },
  title: {
    type: String,
    default: "Usuario",
  },
});

const showPass = ref(false);

const form = ref<UserOperator>({ ...props.data });
const dialog = defineModel<boolean>();
const dataRef = toRef(props, "data");

const formValid = ref(true);
const formRef = ref();

watch(dataRef, (newValue) => {
  form.value = { ...newValue };
});

const emit = defineEmits(["save"]);

const save = () => {
  formRef.value?.validate().then((resp: any) => {
    if (resp?.valid) {
      emit("save", form.value);
      dialog.value = false;
    }
  });
};
</script>
