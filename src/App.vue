<script setup lang="ts">
import { useKeySimulation } from './composables/useKeySimulation';
import FormulaPanel from './components/FormulaPanel.vue';
import MaterialPanel from './components/MaterialPanel.vue';
import ParamPanel from './components/ParamPanel.vue';
import ResultPanel from './components/ResultPanel.vue';
import StatusBadge from './components/StatusBadge.vue';

const {
  rawInputs,
  validationErrors,
  displayResult,
  displayInputs,
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
} = useKeySimulation();
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
      </div>
    </header>

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
          <div class="panel canvas-placeholder">
            <div class="panel-heading">
              <div><span class="section-kicker">2D ENGINEERING VIEW</span><h2>双视图工程示意</h2></div>
            </div>
            <div class="placeholder-drawing" aria-hidden="true">
              <span class="placeholder-ring"></span>
              <span class="placeholder-key"></span>
              <span class="placeholder-line"></span>
            </div>
            <p>参数与计算链路已就绪，Konva 双视图将在下一里程碑接入。</p>
          </div>
        </section>
      </div>

      <div class="results-layout">
        <ResultPanel :result="displayResult" :status="status" :errors="validationErrors" />
        <FormulaPanel v-if="showFormulas" :inputs="displayInputs" :result="displayResult" />
      </div>
    </main>

    <footer class="app-footer">
      <span>普通平键静连接 · 长度 mm · 应力 MPa · 界面转矩 N·m</span>
      <strong>本系统采用解析公式校核，不是有限元仿真软件。</strong>
    </footer>
  </div>
</template>
