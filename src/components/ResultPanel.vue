<script setup lang="ts">
import { computed } from 'vue';
import { STATUS_META } from '../domain/calculation';
import { formatNumber, newtonMillimeterToNewtonMeter } from '../domain/normalize';
import type { CheckStatus, ConnectionResult, ValidationErrors } from '../domain/types';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{
  result: ConnectionResult | null;
  status: CheckStatus;
  errors: ValidationErrors;
}>();

const errorMessages = computed(() =>
  Object.values(props.errors).filter((message): message is string => Boolean(message)),
);
const sourceText = computed(() => {
  if (!props.result) {
    return '—';
  }
  const labels = { sigmaPAxle: '轴', sigmaPHub: '轮毂', sigmaPKey: '键' };
  return props.result.sigmaPAllowSources.map((source) => labels[source]).join('、');
});
const utilizationWidth = computed(() =>
  props.result ? Math.min(props.result.etaMax / 1.2 * 100, 100) : 0,
);
</script>

<template>
  <section class="panel result-panel" aria-labelledby="result-title">
    <div class="panel-heading result-heading">
      <div>
        <span class="section-kicker">RESULT</span>
        <h2 id="result-title">强度校核结果</h2>
      </div>
      <StatusBadge :status="status" />
    </div>

    <div v-if="errorMessages.length" class="error-summary" role="alert">
      <strong>请修正以下输入，当前展示上次有效结果：</strong>
      <ul>
        <li v-for="message in errorMessages" :key="message">{{ message }}</li>
      </ul>
    </div>

    <template v-if="result">
      <div v-if="result.keyCount === 2" class="double-key-summary">
        <strong>双键 180° · 单键结果</strong>
        <span>Ti = T/φ = {{ formatNumber(newtonMillimeterToNewtonMeter(result.torquePerKey)) }} N·m，φ = {{ formatNumber(result.loadFactor) }}</span>
        <small>默认合计 1.5 倍单键承载的教学简化模型；当前显示每个键的平均应力。</small>
      </div>
      <div class="utilization-block" :style="{ '--status-color': STATUS_META[status].color }">
        <div class="utilization-label">
          <span>综合利用率 ηmax</span>
          <strong>{{ formatNumber(result.etaMax) }}</strong>
        </div>
        <div class="utilization-track" aria-hidden="true">
          <span class="threshold safe-threshold"></span>
          <span class="threshold fail-threshold"></span>
          <span class="utilization-value" :style="{ width: `${utilizationWidth}%` }"></span>
        </div>
        <div class="utilization-scale"><span>0</span><span>0.8</span><span>1.0</span><span>1.2+</span></div>
      </div>

      <div class="result-grid">
        <div class="result-item">
          <span>工作长度 <i>l</i></span><strong>{{ formatNumber(result.l) }} <small>mm</small></strong>
        </div>
        <div class="result-item">
          <span>接触高度 <i>hk</i></span><strong>{{ formatNumber(result.hk) }} <small>mm</small></strong>
        </div>
        <div class="result-item emphasis">
          <span>挤压应力 <i>σp</i></span><strong>{{ formatNumber(result.sigmaP) }} <small>MPa</small></strong>
        </div>
        <div class="result-item">
          <span>许用挤压应力 <i>[σp]</i></span>
          <strong>{{ formatNumber(result.sigmaPAllow) }} <small>MPa</small></strong>
          <small>取最小值：{{ sourceText }}</small>
        </div>
        <div class="result-item">
          <span>挤压利用率 <i>ηp</i></span><strong>{{ formatNumber(result.etaP) }}</strong>
        </div>
        <div class="result-item">
          <span>挤压安全系数 <i>Sp</i></span><strong>{{ formatNumber(result.Sp) }}</strong>
        </div>
        <template v-if="result.tau !== undefined">
          <div class="result-item emphasis shear-result">
            <span>剪切应力 <i>τ</i></span><strong>{{ formatNumber(result.tau) }} <small>MPa</small></strong>
          </div>
          <div class="result-item shear-result">
            <span>剪切利用率 <i>ητ</i></span><strong>{{ formatNumber(result.etaTau) }}</strong>
          </div>
          <div class="result-item shear-result">
            <span>剪切安全系数 <i>Sτ</i></span><strong>{{ formatNumber(result.STau) }}</strong>
          </div>
        </template>
      </div>
      <p class="result-conclusion" :style="{ color: STATUS_META[status].color }">
        {{ STATUS_META[status].conclusion }}
      </p>
    </template>
    <div v-else class="empty-result">
      <strong>暂无可计算结果</strong>
      <span>请完整填写有效参数，系统不会以非法值参与计算。</span>
    </div>
  </section>
</template>
