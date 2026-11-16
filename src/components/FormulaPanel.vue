<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '../domain/normalize';
import type { KeyResult, NormalizedInputs } from '../domain/types';

const props = defineProps<{
  inputs: NormalizedInputs | null;
  result: KeyResult | null;
}>();

const lengthExpression = computed(() => {
  if (!props.inputs) {
    return '—';
  }
  switch (props.inputs.type) {
    case 'A':
      return `L − b = ${formatNumber(props.inputs.L)} − ${formatNumber(props.inputs.b)}`;
    case 'B':
      return `L = ${formatNumber(props.inputs.L)}`;
    case 'C':
      return `L − b/2 = ${formatNumber(props.inputs.L)} − ${formatNumber(props.inputs.b)}/2`;
  }
});
</script>

<template>
  <section class="panel formula-panel" aria-labelledby="formula-title">
    <div class="panel-heading compact-heading">
      <div>
        <span class="section-kicker">PROCESS</span>
        <h2 id="formula-title">公式代入过程</h2>
      </div>
      <span class="formula-note">解析解 · 两位小数</span>
    </div>

    <div v-if="inputs && result" class="formula-grid">
      <div class="formula-step">
        <span class="step-number">1</span>
        <div><strong>工作长度</strong><p>l = {{ lengthExpression }} = <b>{{ formatNumber(result.l) }} mm</b></p></div>
      </div>
      <div class="formula-step">
        <span class="step-number">2</span>
        <div><strong>接触高度</strong><p>hk = h/2 = {{ formatNumber(inputs.h) }}/2 = <b>{{ formatNumber(result.hk) }} mm</b></p></div>
      </div>
      <div class="formula-step wide-step">
        <span class="step-number">3</span>
        <div>
          <strong>挤压应力（T 已换算为 N·mm）</strong>
          <p>σp = 2T/(d·hk·l)</p>
          <p>= 2 × {{ formatNumber(inputs.T) }} / ({{ formatNumber(inputs.d) }} × {{ formatNumber(result.hk) }} × {{ formatNumber(result.l) }})</p>
          <p>= <b>{{ formatNumber(result.sigmaP) }} MPa</b></p>
        </div>
      </div>
      <div class="formula-step">
        <span class="step-number">4</span>
        <div><strong>挤压利用率与安全系数</strong>
          <p>ηp = {{ formatNumber(result.sigmaP) }}/{{ formatNumber(result.sigmaPAllow) }} = <b>{{ formatNumber(result.etaP) }}</b></p>
          <p>Sp = <b>{{ formatNumber(result.Sp) }}</b></p>
        </div>
      </div>
      <div v-if="result.tau !== undefined" class="formula-step wide-step">
        <span class="step-number">5</span>
        <div><strong>剪切校核</strong>
          <p>τ = 2T/(d·b·l) = 2 × {{ formatNumber(inputs.T) }} / ({{ formatNumber(inputs.d) }} × {{ formatNumber(inputs.b) }} × {{ formatNumber(result.l) }})</p>
          <p>= <b>{{ formatNumber(result.tau) }} MPa</b>，ητ = <b>{{ formatNumber(result.etaTau) }}</b>，Sτ = <b>{{ formatNumber(result.STau) }}</b></p>
        </div>
      </div>
    </div>
    <div v-else class="empty-result">填写有效参数后显示数值代入过程。</div>
  </section>
</template>
