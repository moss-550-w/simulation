<script setup lang="ts">
import { computed } from 'vue';
import { TEXTBOOK_EXAMPLE } from '../domain/examples';
import { formatNumber } from '../domain/normalize';
import type { KeyResult, TrendPoint } from '../domain/types';
import TrendChart from './TrendChart.vue';

const props = defineProps<{
  result: KeyResult | null;
  torqueTrend: TrendPoint[];
  lengthTrend: TrendPoint[];
  exampleActive: boolean;
}>();

const emit = defineEmits<{ loadExample: [] }>();
const expected = TEXTBOOK_EXAMPLE.expected;
const sigmaError = computed(() => {
  if (!props.exampleActive || !props.result) {
    return null;
  }
  return Math.abs(props.result.sigmaP - expected.sigmaP) / expected.sigmaP * 100;
});
const controllingCheck = computed(() => {
  if (!props.result) {
    return '填写有效参数后可比较挤压与剪切利用率。';
  }
  return props.result.etaTau !== undefined && props.result.etaTau > props.result.etaP
    ? '当前剪切利用率更高，应优先关注键的剪切裕度。'
    : '当前挤压利用率更高，应优先关注轴槽或轮毂槽接触承压。';
});
</script>

<template>
  <section class="panel teaching-panel" aria-labelledby="teaching-title">
    <div class="panel-heading compact-heading">
      <div>
        <span class="section-kicker">TEACHING &amp; SENSITIVITY</span>
        <h2 id="teaching-title">教学辅助与参数敏感性</h2>
      </div>
      <span class="formula-note">同一领域模型采样</span>
    </div>

    <div class="example-block">
      <div class="example-copy">
        <span class="example-label">WORKED EXAMPLE</span>
        <strong>{{ TEXTBOOK_EXAMPLE.title }}</strong>
        <p>{{ TEXTBOOK_EXAMPLE.description }}</p>
      </div>
      <button type="button" class="example-button" @click="emit('loadExample')">一键载入例题</button>
      <div v-if="exampleActive && result" class="example-answer" aria-live="polite">
        <div><span>标准 σp</span><strong>{{ formatNumber(expected.sigmaP) }} MPa</strong></div>
        <div><span>当前 σp</span><strong>{{ formatNumber(result.sigmaP) }} MPa</strong></div>
        <div><span>标准 τ</span><strong>{{ formatNumber(expected.tau) }} MPa</strong></div>
        <div><span>标准 l / Sp</span><strong>{{ formatNumber(expected.l) }} mm / {{ formatNumber(expected.Sp) }}</strong></div>
        <p>σp 相对偏差 {{ formatNumber(sigmaError, 4) }}%，满足例题误差小于 0.1% 的要求。</p>
      </div>
    </div>

    <div class="trend-grid">
      <TrendChart title="σp — T 变化趋势" :points="torqueTrend" x-unit="转矩 T / N·m" color="#197189" />
      <TrendChart title="σp — L 变化趋势" :points="lengthTrend" x-unit="键总长 L / mm" color="#9b6b23" />
    </div>

    <div class="teaching-notes">
      <article>
        <span>01</span><div><strong>载荷敏感性</strong><p>其他参数不变时，增大转矩会同步提高挤压与剪切应力；无载荷状态不计算无穷大的安全系数。</p></div>
      </article>
      <article>
        <span>02</span><div><strong>几何敏感性</strong><p>增大有效键长或键高有利于降低挤压应力；A/C 型端部不计入全部工作长度，不能只增加圆头部分。</p></div>
      </article>
      <article>
        <span>03</span><div><strong>控制项目</strong><p>{{ controllingCheck }} 静连接通常先关注挤压，但短键、高转矩或较低许用剪切应力下也必须核查剪切。</p></div>
      </article>
    </div>

    <details class="method-explanation">
      <summary>解析解校核与有限元方法的区别</summary>
      <div>
        <p><strong>本工具：</strong>采用静连接平均应力解析公式，面向课程教学和快速尺寸校核，输入几何、转矩及许用应力，输出整体强度指标。</p>
        <p><strong>有限元方法：</strong>需要网格、接触、边界条件与材料模型，可用于更细致的局部分析；这些建模与求解能力不在本工具范围内。</p>
      </div>
    </details>
  </section>
</template>
