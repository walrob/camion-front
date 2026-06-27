<template>
  <v-form ref="formRef" v-model="formValid" @submit.prevent="save">
    <UiChildCard title="Datos personales" :hideaction="!editData">
      <template #header>
        <v-tooltip location="top" text="Editar">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              variant="text"
              size="small"
              v-bind="props"
              @click="editData = true"
            >
              <EditIcon size="20" stroke-width="1.5" />
            </v-btn>
          </template>
        </v-tooltip>
      </template>
      <v-row>
        <v-col cols="12" sm="6" :md="editData ? 6 : 4">
          <EditableField
            label="Nombre"
            :edit="editData"
            :display-value="form.name"
          >
            <v-text-field
              v-model="form.name"
              variant="outlined"
              density="compact"
              hide-details
              :rules="[r.isRequired]"
            />
          </EditableField>
        </v-col>
        <v-col cols="12" sm="6" :md="editData ? 6 : 4">
          <EditableField label="DNI" :edit="editData" :display-value="form.dni">
            <v-text-field
              v-model="form.dni"
              variant="outlined"
              density="compact"
              hide-details
              type="number"
              :rules="[r.isRequired]"
            />
          </EditableField>
        </v-col>
        <v-col cols="12" sm="6" :md="editData ? 6 : 4">
          <EditableField
            label="Nacimiento"
            :edit="editData"
            :display-value="formatDateLocal(form.birthDate)"
          >
            <v-text-field
              v-model="form.birthDate"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </EditableField>
        </v-col>
        <v-col cols="12" sm="6" :md="editData ? 6 : 4">
          <EditableField
            label="Email"
            :edit="editData"
            :display-value="form.email"
          >
            <v-text-field
              v-model="form.email"
              variant="outlined"
              density="compact"
              hide-details
              :rules="[r.isEmail]"
            />
          </EditableField>
        </v-col>
        <v-col cols="12" sm="6" :md="editData ? 6 : 4">
          <EditableField
            label="Teléfono"
            :edit="editData"
            :display-value="form.phone"
          >
            <v-text-field
              v-model="form.phone"
              variant="outlined"
              density="compact"
              hide-details
              :rules="[r.isPhone]"
            />
          </EditableField>
        </v-col>
        <v-col cols="12" sm="6" :md="editData ? 6 : 4">
          <EditableField
            label="Sexo"
            :edit="editData"
            :display-value="form.sex === 'male' ? 'Masculino' : 'Femenino'"
          >
            <v-radio-group v-model="form.sex" inline hide-details>
              <v-radio label="Masculino" value="male" />
              <v-radio label="Femenino" value="female" />
            </v-radio-group>
          </EditableField>
        </v-col>
      </v-row>

      <template #footer>
        <v-btn text="Cancelar" variant="text" @click="reset"></v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          text="Guardar"
          type="submit"
        ></v-btn>
      </template>
    </UiChildCard>
  </v-form>
</template>

<script setup lang="ts">
import UiChildCard from "@/components/shared/UiChildCard.vue";
import type { Person } from "~/types/clinical";
import { EditIcon } from "vue-tabler-icons";
import { useValidations } from "~/composables/useValidations";
import { formatDateLocal } from "~/composables/functions";
import EditableField from "../shared/EditableField.vue";
const r = useValidations();

const editData = ref(false);

const props = defineProps({
  data: {
    type: Object as () => Person,
    default: {
      id: "",
      birthDate: "",
      dni: "",
      email: "",
      name: "",
      phone: "",
      sex: "",
    },
  },
});

const form = ref<Person>({ ...props.data });
const dataRef = toRef(props, "data");

const formValid = ref(true);
const formRef = ref();

watch(dataRef, (newValue) => {
  form.value = { ...newValue };
});

const emit = defineEmits(["save", "reset"]);

const save = () => {
  formRef.value?.validate().then((resp: any) => {
    if (resp?.valid) {
      emit("save", form.value);
      editData.value = false;
    }
  });
};

const reset = () => {
  emit("reset");
  editData.value = false;
};
</script>
