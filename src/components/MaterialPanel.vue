<script setup lang="ts">
import type { NumericInputField, RawInputs, ValidationErrors } from '../domain/types';

defineProps<{
  inputs: RawInputs;
  errors: ValidationErrors;
}>();

const emit = defineEmits<{
  updateField: [field: NumericInputField, value: string];
}>();

function updateField(field: NumericInputField, event: Event): void {
  emit('updateField', field, (event.target as HTMLInputElement).value);
}
</script>

<template>
  <section class="panel material-panel" aria-labelledby="material-title">
    <div class="panel-heading compact-heading">
      <div>
        <span class="section-kicker">MATERIAL</span>
        <h2 id="material-title">材料许用应力</h2>
      </div>
      <span class="panel-index">02</span>
    </div>
    <p class="panel-description">挤压许用值取轴、轮毂和已填写键材料中的最小值。</p>

    <div class="material-fields">
      <label class="field" :class="{ 'has-error': errors.sigmaPAxle }">
        <span class="field-label">轴 [σp]</span>
        <span class="input-with-unit">
          <input
            :value="inputs.sigmaPAxle" type="number" min="0" step="10"
            :aria-invalid="Boolean(errors.sigmaPAxle)" aria-label="轴许用挤压应力，单位 MPa"
            @input="updateField('sigmaPAxle', $event)"
          />
          <span>MPa</span>
        </span>
        <small v-if="errors.sigmaPAxle" class="field-error">{{ errors.sigmaPAxle }}</small>
      </label>

      <label class="field" :class="{ 'has-error': errors.sigmaPHub }">
        <span class="field-label">轮毂 [σp]</span>
        <span class="input-with-unit">
          <input
            :value="inputs.sigmaPHub" type="number" min="0" step="10"
            :aria-invalid="Boolean(errors.sigmaPHub)" aria-label="轮毂许用挤压应力，单位 MPa"
            @input="updateField('sigmaPHub', $event)"
          />
          <span>MPa</span>
        </span>
        <small v-if="errors.sigmaPHub" class="field-error">{{ errors.sigmaPHub }}</small>
      </label>

      <label class="field" :class="{ 'has-error': errors.sigmaPKey }">
        <span class="field-label">键 [σp] <em>可选</em></span>
        <span class="input-with-unit">
          <input
            :value="inputs.sigmaPKey" type="number" min="0" step="10" placeholder="不参与取值"
            :aria-invalid="Boolean(errors.sigmaPKey)" aria-label="键许用挤压应力，可选，单位 MPa"
            @input="updateField('sigmaPKey', $event)"
          />
          <span>MPa</span>
        </span>
        <small v-if="errors.sigmaPKey" class="field-error">{{ errors.sigmaPKey }}</small>
      </label>

      <label class="field" :class="{ 'has-error': errors.tauAllow }">
        <span class="field-label">键 [τ] <em v-if="!inputs.enableShear">未启用</em></span>
        <span class="input-with-unit">
          <input
            :value="inputs.tauAllow" type="number" min="0" step="10"
            :disabled="!inputs.enableShear" :aria-invalid="Boolean(errors.tauAllow)"
            aria-label="键许用剪切应力，单位 MPa" @input="updateField('tauAllow', $event)"
          />
          <span>MPa</span>
        </span>
        <small v-if="errors.tauAllow" class="field-error">{{ errors.tauAllow }}</small>
      </label>
    </div>
  </section>
</template>
