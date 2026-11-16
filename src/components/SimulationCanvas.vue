<script setup lang="ts">
import Konva from 'konva';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { STATUS_META } from '../domain/calculation';
import type { CheckStatus, KeyResult, NormalizedInputs } from '../domain/types';
import { createCrossSectionModel, type ViewBox } from '../visualization/drawCrossSection';
import { createLongitudinalSectionModel } from '../visualization/drawLongitudinalSection';
import { drawBackground } from '../visualization/layers/background';
import { drawContact } from '../visualization/layers/contact';
import { drawDimensions } from '../visualization/layers/dimensions';
import { drawForce } from '../visualization/layers/force';
import { drawHub } from '../visualization/layers/hub';
import { drawInteractionGuides, setupInteraction, type CanvasInteraction } from '../visualization/layers/interaction';
import { drawKey } from '../visualization/layers/key';
import { drawShaft } from '../visualization/layers/shaft';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{
  inputs: NormalizedInputs | null;
  result: KeyResult | null;
  status: CheckStatus;
  showDimensions: boolean;
}>();

const stageHost = ref<HTMLDivElement | null>(null);
const stacked = ref(false);
let stage: Konva.Stage | null = null;
let resizeObserver: ResizeObserver | null = null;
let frameId: number | null = null;
let interaction: CanvasInteraction | null = null;
let currentViews: ViewBox[] = [];
const layers: Konva.Layer[] = [];

const canvasLabel = computed(() => {
  if (!props.inputs || !props.result) {
    return '平键双视图工程示意，暂无有效参数';
  }
  return `平键横截面与纵剖面工程示意，${STATUS_META[props.status].conclusion}，工作长度 ${props.result.l.toFixed(2)} 毫米`;
});

function calculateViews(width: number, height: number): ViewBox[] {
  const margin = 12;
  const gap = 12;
  if (stacked.value) {
    const viewHeight = (height - margin * 2 - gap) / 2;
    return [
      { x: margin, y: margin, width: width - margin * 2, height: viewHeight },
      { x: margin, y: margin + viewHeight + gap, width: width - margin * 2, height: viewHeight },
    ];
  }
  const contentWidth = width - margin * 2 - gap;
  const crossWidth = contentWidth * 0.45;
  return [
    { x: margin, y: margin, width: crossWidth, height: height - margin * 2 },
    { x: margin + crossWidth + gap, y: margin, width: contentWidth - crossWidth, height: height - margin * 2 },
  ];
}

function clearDrawingLayers(): void {
  layers.slice(1).forEach((layer) => {
    layer.destroyChildren();
    layer.batchDraw();
  });
}

function render(): void {
  frameId = null;
  if (!stage || !stageHost.value) {
    return;
  }
  currentViews = calculateViews(stage.width(), stage.height());
  drawBackground(layers[0], currentViews, stacked.value);
  if (!props.inputs || !props.result) {
    clearDrawingLayers();
    return;
  }
  const cross = createCrossSectionModel(props.inputs, currentViews[0]);
  const longitudinal = createLongitudinalSectionModel(props.inputs, props.result, currentViews[1]);
  drawHub(layers[1], cross, longitudinal);
  drawShaft(layers[2], cross, longitudinal);
  drawKey(layers[3], cross, longitudinal);
  drawContact(layers[4], cross, longitudinal);
  drawForce(layers[5], cross, longitudinal);
  drawDimensions(layers[6], cross, longitudinal, props.showDimensions);
  drawInteractionGuides(layers[7], currentViews);
}

function scheduleRender(): void {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }
  frameId = requestAnimationFrame(render);
}

function resizeStage(): void {
  if (!stage || !stageHost.value) {
    return;
  }
  const width = Math.max(280, stageHost.value.clientWidth);
  const shouldStack = width < 720;
  if (stacked.value !== shouldStack) {
    stacked.value = shouldStack;
    void nextTick(resizeStage);
    return;
  }
  Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  stage.size({ width, height: stageHost.value.clientHeight });
  scheduleRender();
}

function resetView(): void {
  interaction?.reset();
}

function exportPng(): string | null {
  if (!stage || !props.inputs || !props.result) {
    return null;
  }
  return stage.toDataURL({
    mimeType: 'image/png',
    pixelRatio: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
  });
}

defineExpose({ exportPng, resetView });

watch(
  () => [props.inputs, props.result, props.status, props.showDimensions],
  scheduleRender,
  { deep: true, flush: 'post' },
);

onMounted(() => {
  if (!stageHost.value) {
    return;
  }
  Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  stage = new Konva.Stage({
    container: stageHost.value,
    width: stageHost.value.clientWidth,
    height: stageHost.value.clientHeight,
  });
  for (let index = 0; index < 8; index += 1) {
    const layer = new Konva.Layer({ name: `engineering-layer-${index}` });
    layers.push(layer);
    stage.add(layer);
  }
  interaction = setupInteraction(stage, layers[7]);
  resizeObserver = new ResizeObserver(resizeStage);
  resizeObserver.observe(stageHost.value);
  resizeStage();
});

onBeforeUnmount(() => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }
  resizeObserver?.disconnect();
  stage?.destroy();
  stage = null;
  layers.length = 0;
});
</script>

<template>
  <section class="panel simulation-panel" aria-labelledby="canvas-title">
    <div class="panel-heading canvas-heading">
      <div>
        <span class="section-kicker">2D ENGINEERING VIEW</span>
        <h2 id="canvas-title">双视图工程示意</h2>
      </div>
      <div class="canvas-header-actions">
        <StatusBadge :status="status" compact />
        <div class="canvas-toolbar" aria-label="画布视图控制">
          <button type="button" title="放大" aria-label="放大画布" @click="interaction?.zoomBy(1.2)">＋</button>
          <button type="button" title="缩小" aria-label="缩小画布" @click="interaction?.zoomBy(1 / 1.2)">−</button>
          <button type="button" class="reset-view" @click="resetView">重置视图</button>
        </div>
      </div>
    </div>

    <div class="canvas-stage-wrap" :class="{ stacked }">
      <div
        ref="stageHost"
        class="canvas-stage"
        role="img"
        :aria-label="canvasLabel"
      ></div>
      <div v-if="status === 'invalid'" class="canvas-mask" role="alert">
        <strong>参数无效</strong>
        <span>{{ inputs && result ? '当前显示上次有效图形，请检查输入' : '请完整填写有效参数后生成工程示意' }}</span>
      </div>
      <div v-else-if="!inputs || !result" class="canvas-mask empty-canvas">
        <strong>等待有效参数</strong>
        <span>双视图不会使用非法数值绘制</span>
      </div>
    </div>

    <div class="canvas-legend" aria-label="图例">
      <span><i class="legend-key" :style="{ background: STATUS_META[result?.status ?? status].color }"></i>键体 / 当前状态</span>
      <span><i class="legend-contact"></i>挤压接触面</span>
      <span v-if="inputs?.enableShear"><i class="legend-shear"></i>剪切面虚线</span>
      <span class="legend-note">结构示意，不代表应力分布</span>
    </div>
  </section>
</template>
