<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

/**
 * Cobranza: todo lo emitido y sin pagar, de todas las empresas.
 *
 * Ordenado por vencimiento porque así es como se trabaja: lo que vence primero
 * es lo que hay que reclamar primero. Los totales los calcula el servidor sobre
 * toda la deuda, no sobre la página visible: un "por cobrar" que cambiara al
 * pasar de página no serviría para decidir nada.
 */
definePageMeta({ layout: "superadmin", roles: ["superadmin"] });
useHead({ title: "Cobranzas" });

const { get } = useApi();
const { money } = useFormatters();
const general = useGeneralStore();

const periodos = ref<any[]>([]);
const meta = ref<any>(null);
const totales = ref({ porCobrar: 0, vencido: 0 });
const cargando = ref(true);
const pagina = ref(1);

const hoy = new Date().setHours(0, 0, 0, 0);

const vencido = (p: any) => new Date(p.expiration).getTime() < hoy;

const cargar = async () => {
  cargando.value = true;
  try {
    const r: any = await get("superadmin/billing", {
      page: pagina.value,
      limit: 20,
    });
    periodos.value = r.items;
    meta.value = r.meta;
    totales.value = r.totales;
  } catch (e: any) {
    general.setErrorSnackbar(e);
  } finally {
    cargando.value = false;
  }
};

watch(pagina, cargar);

onMounted(cargar);
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">Cobranzas</h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Períodos emitidos y sin cobrar, del que vence antes al que vence después.
    </p>

    <v-row dense class="mb-2">
      <v-col cols="6" md="3">
        <v-card border flat rounded="lg" class="pa-5">
          <div class="text-caption text-medium-emphasis">Por cobrar</div>
          <div class="text-h6 font-weight-bold">
            {{ money(totales.porCobrar) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card border flat rounded="lg" class="pa-5">
          <div class="text-caption text-medium-emphasis">Vencido</div>
          <div class="text-h6 font-weight-bold text-error">
            {{ money(totales.vencido) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card border flat rounded="lg">
      <div v-if="cargando" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Período</th>
            <th>Vence</th>
            <th class="text-right">Importe</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in periodos" :key="p.id">
            <td>
              <NuxtLink
                :to="`/superadmin/empresas/${p.companyId}`"
                class="text-primary"
              >
                {{ p.companyName }}
              </NuxtLink>
            </td>
            <td>
              {{ String(p.periodStart).slice(0, 10) }}
              <v-chip v-if="p.isProrated" size="x-small" class="ml-1">
                prorrateo
              </v-chip>
            </td>
            <td>
              <span :class="{ 'text-error font-weight-medium': vencido(p) }">
                {{ String(p.expiration).slice(0, 10) }}
              </span>
            </td>
            <td class="text-right font-weight-medium">{{ money(p.amount) }}</td>
            <td class="text-right">
              <v-btn
                size="small"
                variant="text"
                :to="`/superadmin/empresas/${p.companyId}`"
              >
                Gestionar
              </v-btn>
            </td>
          </tr>
          <tr v-if="!periodos.length">
            <td colspan="5" class="text-center text-medium-emphasis py-6">
              No hay períodos pendientes de cobro.
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
