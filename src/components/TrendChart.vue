<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '../domain/normalize';
import type { TrendPoint } from '../domain/types';

const props = defineProps<{
  title: string;
  points: TrendPoint[];
  xUnit: string;
  color: string;
}>();

const chart = computed(() => {
  if (props.points.length === 0) {
    return null;
  }
  const left = 45;
  const right = 304;
  const top = 14;
  const bottom = 112;
  const xValues = props.points.map((point) => point.x);
  const yValues = props.points.map((point) => point.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMax = Math.max(...yValues, 0.01) * 1.08;
  const xRange = Math.max(xMax - xMin, 1);
  const coordinates = props.points.map((point) => ({
    x: left + (point.x - xMin) / xRange * (right - left),
    y: bottom - point.y / yMax * (bottom - top),
  }));
  return {
    line: coordinates.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '),
    area: `M ${left} ${bottom} L ${coordinates.map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' L ')} L ${right} ${bottom} Z`,
    last: coordinates[coordinates.length - 1],
    xMin,
    xMax,
    yMax,
  };
});
</script>

<template>
  <figure class="trend-chart">
    <figcaption>{{ title }}</figcaption>
    <svg v-if="chart" viewBox="0 0 320 145" role="img" :aria-label="`${title}，横轴单位 ${xUnit}，纵轴挤压应力 MPa`">
      <line v-for="y in [28, 56, 84, 112]" :key="y" x1="45" :y1="y" x2="304" :y2="y" class="trend-grid" />
      <line x1="45" y1="14" x2="45" y2="112" class="trend-axis" />
      <line x1="45" y1="112" x2="304" y2="112" class="trend-axis" />
      <path :d="chart.area" :fill="color" opacity="0.09" />
      <polyline :points="chart.line" fill="none" :stroke="color" stroke-width="2.2" stroke-linejoin="round" />
      <circle v-if="chart.last" :cx="chart.last.x" :cy="chart.last.y" r="3.5" :fill="color" />
      <text x="40" y="116" text-anchor="end">0</text>
      <text x="40" y="18" text-anchor="end">{{ formatNumber(chart.yMax, 0) }}</text>
      <text x="45" y="128" text-anchor="middle">{{ formatNumber(chart.xMin, 0) }}</text>
      <text x="304" y="128" text-anchor="middle">{{ formatNumber(chart.xMax, 0) }}</text>
      <text x="174" y="142" text-anchor="middle" class="trend-unit">{{ xUnit }}</text>
      <text x="304" y="9" text-anchor="end" class="trend-unit">σp / MPa</text>
    </svg>
    <p v-else class="trend-empty">暂无可显示趋势</p>
  </figure>
</template>
