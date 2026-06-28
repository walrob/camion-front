<script setup lang="ts">
import { ref, onMounted } from "vue";

const emit = defineEmits<{ (e: "change", hasContent: boolean): void }>();

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let drawing = false;
let dirty = false;

const resize = () => {
  const c = canvas.value;
  if (!c) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  c.width = rect.width * ratio;
  c.height = rect.height * ratio;
  ctx = c.getContext("2d");
  if (ctx) {
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  }
};

const pos = (e: PointerEvent) => {
  const rect = canvas.value!.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const start = (e: PointerEvent) => {
  drawing = true;
  const { x, y } = pos(e);
  ctx?.beginPath();
  ctx?.moveTo(x, y);
};
const move = (e: PointerEvent) => {
  if (!drawing || !ctx) return;
  const { x, y } = pos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  if (!dirty) {
    dirty = true;
    emit("change", true);
  }
};
const end = () => {
  drawing = false;
};

const clear = () => {
  const c = canvas.value;
  if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
  dirty = false;
  emit("change", false);
};

const toBlob = (): Promise<Blob | null> =>
  new Promise((resolve) => {
    if (!canvas.value) return resolve(null);
    canvas.value.toBlob((b) => resolve(b), "image/png");
  });

const isDirty = () => dirty;

defineExpose({ clear, toBlob, isDirty });

onMounted(resize);
</script>

<template>
  <div>
    <canvas
      ref="canvas"
      class="signature-canvas"
      @pointerdown="start"
      @pointermove="move"
      @pointerup="end"
      @pointerleave="end"
    />
    <div class="d-flex justify-end mt-1">
      <v-btn size="x-small" variant="text" prepend-icon="mdi-eraser" @click="clear">
        Borrar
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.signature-canvas {
  width: 100%;
  height: 160px;
  border: 1px dashed #999;
  border-radius: 8px;
  touch-action: none;
  background: #fff;
}
</style>
