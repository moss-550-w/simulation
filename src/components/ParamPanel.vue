<script setup lang="ts">
import type { DimensionMode, ViewOption } from '../composables/useKeySimulation';
import type {
  KeyType,
  NumericInputField,
  RawInputs,
  StandardKeySize,
  ValidationErrors,
} from '../domain/types';

interface FieldDefinition {
  key: NumericInputField;
  label: string;
  unit: string;
  step?: string;
}

defineProps<{
  inputs: RawInputs;
  errors: ValidationErrors;
  recommended: StandardKeySize | null;
  dimensionMode: DimensionMode;
  showFormulas: boolean;
  showDimensions: boolean;
}>();

const emit = defineEmits<{
  updateField: [field: NumericInputField, value: string];
  updateType: [type: KeyType];
  updateShear: [enabled: boolean];
  updateMode: [mode: DimensionMode];
  updateOption: [option: ViewOption, value: boolean];
  applyRecommendation: [];
}>();

const geometryFields: FieldDefinition[] = [
  { key: 'd', label: '轴径 d', unit: 'mm' },
  { key: 'D', label: '轮毂外径 D', unit: 'mm' },
  { key: 'Bh', label: '轮毂长度 Bh', unit: 'mm' },
  { key: 'L', label: '键总长 L', unit: 'mm' },
  { key: 'b', label: '键宽 b', unit: 'mm' },
  { key: 'h', label: '键高 h', unit: 'mm' },
  { key: 't1', label: '轴槽深 t1', unit: 'mm', step: '0.1' },
  { key: 't2', label: '轮毂槽深 t2', unit: 'mm', step: '0.1' },
];

function updateField(field: NumericInputField, event: Event): void {
  emit('updateField', field, (event.target as HTMLInputElement).value);
}

function updateType(event: Event): void {
  emit('updateType', (event.target as HTMLSelectElement).value as KeyType);
}
</script>

<template>
  <section class="panel param-panel" aria-labelledby="param-title">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">INPUT</span>
        <h2 id="param-title">校核参数</h2>
      </div>
      <span class="panel-index">01</span>
    </div>

    <details class="control-group" open>
      <summary>结构参数 <span>几何与装配</span></summary>
      <div class="group-content">
        <label class="field full-field">
          <span class="field-label">键型</span>
          <select :value="inputs.type" @change="updateType">
            <option value="A">A 型圆头（l = L − b）</option>
            <option value="B">B 型方头（l = L）</option>
            <option value="C">C 型单圆头（l = L − b/2）</option>
          </select>
        </label>

        <div class="mode-switch" aria-label="尺寸输入模式">
          <button
            type="button"
            :class="{ active: dimensionMode === 'standard' }"
            @click="emit('updateMode', 'standard')"
          >标准推荐</button>
          <button
            type="button"
            :class="{ active: dimensionMode === 'custom' }"
            @click="emit('updateMode', 'custom')"
          >自定义</button>
        </div>

        <div v-if="recommended" class="recommendation">
          <div>
            <span>GB/T 1096 教学简化表</span>
            <strong>b {{ recommended.b }} × h {{ recommended.h }} mm</strong>
            <small>t1 {{ recommended.t1 }} / t2 {{ recommended.t2 }} mm</small>
          </div>
          <button type="button" class="text-button" @click="emit('applyRecommendation')">应用</button>
        </div>
        <p v-else class="inline-hint">当前轴径超出教学推荐表，请使用自定义尺寸。</p>
        <p class="source-note">按 GB/T 1096 常用范围推荐，教学用简化表。</p>

        <div class="field-grid">
          <label
            v-for="field in geometryFields"
            :key="field.key"
            class="field"
            :class="{ 'has-error': errors[field.key] }"
          >
            <span class="field-label">{{ field.label }}</span>
            <span class="input-with-unit">
              <input
                :value="inputs[field.key]"
                type="number"
                inputmode="decimal"
                min="0"
                :step="field.step ?? '1'"
                :aria-invalid="Boolean(errors[field.key])"
                :aria-label="`${field.label}，单位 ${field.unit}`"
                @input="updateField(field.key, $event)"
              />
              <span>{{ field.unit }}</span>
            </span>
            <small v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</small>
          </label>
        </div>
        <p v-if="dimensionMode === 'custom'" class="inline-hint">
          自定义尺寸不强制符合常用标准，仍执行几何与强度校验。
        </p>
      </div>
    </details>

    <details class="control-group" open>
      <summary>载荷参数 <span>静连接转矩</span></summary>
      <div class="group-content">
        <label class="field full-field" :class="{ 'has-error': errors.T }">
          <span class="field-label">传递转矩 T</span>
          <span class="input-with-unit">
            <input
              :value="inputs.T"
              type="number"
              inputmode="decimal"
              min="0"
              step="10"
              :aria-invalid="Boolean(errors.T)"
              aria-label="传递转矩 T，单位牛米"
              @input="updateField('T', $event)"
            />
            <span>N·m</span>
          </span>
          <small v-if="errors.T" class="field-error">{{ errors.T }}</small>
          <small v-else class="field-help">输入 0 可查看无载荷状态；内部自动换算为 N·mm。</small>
        </label>
      </div>
    </details>

    <details class="control-group" open>
      <summary>校核选项 <span>计算与视图</span></summary>
      <div class="group-content option-list">
        <label class="check-row">
          <input
            :checked="inputs.enableShear"
            type="checkbox"
            @change="emit('updateShear', ($event.target as HTMLInputElement).checked)"
          />
          <span><strong>同时校核剪切强度</strong><small>综合利用率取挤压与剪切较大值</small></span>
        </label>
        <label class="check-row">
          <input
            :checked="showFormulas"
            type="checkbox"
            @change="emit('updateOption', 'showFormulas', ($event.target as HTMLInputElement).checked)"
          />
          <span><strong>显示公式代入过程</strong><small>展示当前有效参数的数值代入</small></span>
        </label>
        <label class="check-row">
          <input
            :checked="showDimensions"
            type="checkbox"
            @change="emit('updateOption', 'showDimensions', ($event.target as HTMLInputElement).checked)"
          />
          <span><strong>显示尺寸与受力标注</strong><small>切换画布工程标注图层</small></span>
        </label>
      </div>
    </details>
  </section>
</template>
