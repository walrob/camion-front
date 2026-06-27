<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "vuetify";
import type { Series } from "~/types/stats";
import { formatDateSmallLocal } from "~/composables/functions";

const theme = useTheme();
const { success, primary, error } = theme.current.value.colors;

const props = defineProps({
  series: {
    type: Array as () => Series[],
    required: true,
  },
  days: {
    type: Array as () => string[],
    required: true,
  },
  title: {
    type: String,
    default: "Total de pedidos (últ. 15 días)",
  },
});

const chartOptions = computed(() => {
  return {
    series: props.series,
    chartOptions: {
      grid: {
        borderColor: "rgba(0,0,0,0.1)",
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: "50%" },
      },
      colors: [error, primary, success],
      chart: {
        type: "bar",
        height: 370,
        offsetX: -15,
        toolbar: { show: true },
        foreColor: "#adb0bb",
        fontFamily: "inherit",
        sparkline: { enabled: false },
      },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      legend: { show: false },
      xaxis: {
        type: "category",
        categories: props.days.map((x) => formatDateSmallLocal(x)),
        labels: {
          style: { cssClass: "grey--text lighten-2--text fill-color" },
        },
      },
      yaxis: {
        show: true,
        min: 0,
        // tickAmount: 4,
        labels: {
          style: {
            cssClass: "grey--text lighten-2--text fill-color",
          },
          formatter: (val: number) => Math.round(val).toString(),
        },
      },
      stroke: {
        show: true,
        width: 3,
        lineCap: "butt",
        colors: ["transparent"],
      },
      tooltip: { theme: "light" },

      responsive: [
        {
          breakpoint: 600,
          options: {
            plotOptions: {
              bar: {
                borderRadius: 3,
              },
            },
          },
        },
      ],
    },
  };
});
</script>

<template>
  <v-card elevation="10">
    <v-card-item>
      <div class="d-sm-flex align-center justify-space-between pt-sm-2">
        <v-card-title class="text-h5">{{ title }}</v-card-title>
      </div>
      <div class="mt-6">
        <apexchart
          type="bar"
          height="370px"
          :options="chartOptions.chartOptions"
          :series="chartOptions.series"
        >
        </apexchart>
      </div>
    </v-card-item>
  </v-card>
</template>
