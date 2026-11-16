<script setup lang="ts">
import { ref } from 'vue';
import { useKeySimulation } from './composables/useKeySimulation';
import FormulaPanel from './components/FormulaPanel.vue';
import MaterialPanel from './components/MaterialPanel.vue';
import ParamPanel from './components/ParamPanel.vue';
import ResultPanel from './components/ResultPanel.vue';
import SimulationCanvas from './components/SimulationCanvas.vue';
import StatusBadge from './components/StatusBadge.vue';
import TeachingPanel from './components/TeachingPanel.vue';
import { parseInputPayload, serializeInputPayload } from './domain/inputTransfer';

const {
  rawInputs,
  validationErrors,
  displayResult,
  displayInputs,
  canvasResult,
  torqueTrend,
  lengthTrend,
  exampleActive,
  status,
  recommendedKey,
  dimensionMode,
  showFormulas,
  showDimensions,
  updateNumericField,
  setKeyType,
  setEnableShear,
  setDimensionMode,
  setViewOption,
  applyRecommendedKey,
  loadRawInputs,
  loadTextbookExample,
} = useKeySimulation();

const canvasRef = ref<InstanceType<typeof SimulationCanvas> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null);

function downloadLink(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

function exportCanvas(): void {
  const dataUrl = canvasRef.value?.exportPng();
  if (!dataUrl) {
    notice.value = { type: 'error', text: '当前没有可导出的有效画布。' };
    return;
  }
  downloadLink(dataUrl, '平键双视图工程示意.png');
  notice.value = { type: 'success', text: '画布 PNG 已导出。' };
}

function exportInputs(): void {
  const blob = new Blob([serializeInputPayload(rawInputs)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadLink(url, '平键校核参数.json');
  URL.revokeObjectURL(url);
  notice.value = { type: 'success', text: '当前参数已保存为 JSON 文件。' };
}

async function importInputs(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  if (file.size > 1024 * 1024) {
    notice.value = { type: 'error', text: 'JSON 文件过大，请选择本系统导出的参数文件。' };
    input.value = '';
    return;
  }
  try {
    const parsed = parseInputPayload(await file.text());
    if (!parsed.success) {
      notice.value = { type: 'error', text: parsed.message };
    } else {
      loadRawInputs(parsed.inputs);
      notice.value = { type: 'success', text: '参数恢复成功，已重新完成校核。' };
    }
  } catch {
    notice.value = { type: 'error', text: '文件读取失败，请重新选择本地 JSON 文件。' };
  } finally {
    input.value = '';
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true"><span>K</span><small>2D</small></div>
        <div>
          <h1>普通平键连接强度校核</h1>
          <p>挤压 / 剪切解析校核与二维工程示意可视化系统</p>
        </div>
      </div>
      <div class="header-status">
        <span class="method-tag">解析解校核工具</span>
        <StatusBadge :status="status" compact />
        <div class="export-actions" aria-label="导出与恢复">
          <button type="button" @click="exportCanvas">导出 PNG</button>
          <button type="button" @click="exportInputs">保存 JSON</button>
          <button type="button" @click="fileInput?.click()">恢复 JSON</button>
          <input ref="fileInput" class="visually-hidden-file" type="file" accept=".json,application/json" tabindex="-1" aria-label="选择参数 JSON 文件" @change="importInputs" />
        </div>
      </div>
    </header>

    <div v-if="notice" class="app-notice" :class="`notice-${notice.type}`" role="status">
      <span>{{ notice.text }}</span>
      <button type="button" aria-label="关闭提示" @click="notice = null">×</button>
    </div>

    <main class="app-main">
      <div class="workspace">
        <aside class="sidebar" aria-label="参数输入">
          <ParamPanel
            :inputs="rawInputs"
            :errors="validationErrors"
            :recommended="recommendedKey"
            :dimension-mode="dimensionMode"
            :show-formulas="showFormulas"
            :show-dimensions="showDimensions"
            @update-field="updateNumericField"
            @update-type="setKeyType"
            @update-shear="setEnableShear"
            @update-mode="setDimensionMode"
            @update-option="setViewOption"
            @apply-recommendation="applyRecommendedKey"
          />
          <MaterialPanel
            :inputs="rawInputs"
            :errors="validationErrors"
            @update-field="updateNumericField"
          />
        </aside>

        <section class="visual-column" aria-label="工程视图">
          <SimulationCanvas
            ref="canvasRef"
            :inputs="displayInputs"
            :result="canvasResult"
            :status="status"
            :show-dimensions="showDimensions"
          />
        </section>
      </div>

      <div class="results-layout">
        <ResultPanel :result="displayResult" :status="status" :errors="validationErrors" />
        <FormulaPanel v-if="showFormulas" :inputs="displayInputs" :result="displayResult" />
        <TeachingPanel
          :result="displayResult"
          :torque-trend="torqueTrend"
          :length-trend="lengthTrend"
          :example-active="exampleActive"
          @load-example="loadTextbookExample"
        />
      </div>
    </main>

    <footer class="app-footer">
      <span>普通平键静连接 · 长度 mm · 应力 MPa · 界面转矩 N·m · 最近有效参数仅保存在本机</span>
      <strong>本系统采用解析公式校核，不是有限元仿真软件。</strong>
    </footer>
  </div>
</template>
