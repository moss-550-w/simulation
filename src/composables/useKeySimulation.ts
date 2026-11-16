import { computed, reactive, ref, watch } from 'vue';
import { calculateKeyStrength } from '../domain/calculation';
import { normalizeInputs, parseFiniteNumber } from '../domain/normalize';
import { findStandardKey } from '../domain/standardKeys';
import { hasValidationErrors, validateInputs } from '../domain/validation';
import type {
  CheckStatus,
  KeyResult,
  KeyType,
  NormalizedInputs,
  NumericInputField,
  RawInputs,
} from '../domain/types';

export type DimensionMode = 'standard' | 'custom';
export type ViewOption = 'showFormulas' | 'showDimensions';

export const DEFAULT_RAW_INPUTS: Readonly<RawInputs> = {
  d: '50',
  b: '14',
  h: '9',
  L: '80',
  type: 'A',
  D: '90',
  Bh: '100',
  t1: '5.5',
  t2: '3.8',
  T: '500',
  sigmaPAxle: '120',
  sigmaPHub: '100',
  sigmaPKey: '',
  enableShear: true,
  tauAllow: '60',
};

function defaultInputs(): RawInputs {
  return { ...DEFAULT_RAW_INPUTS };
}

export function useKeySimulation() {
  const rawInputs = reactive<RawInputs>(defaultInputs());
  const dimensionMode = ref<DimensionMode>('standard');
  const showFormulas = ref(true);
  const showDimensions = ref(true);

  const validationErrors = computed(() => validateInputs(rawInputs));
  const isValid = computed(() => !hasValidationErrors(validationErrors.value));
  const normalizedInputs = computed<NormalizedInputs | null>(() =>
    isValid.value ? normalizeInputs(rawInputs) : null,
  );
  const calculatedResult = computed<KeyResult | null>(() =>
    normalizedInputs.value ? calculateKeyStrength(normalizedInputs.value) : null,
  );

  const lastValidResult = ref<KeyResult | null>(null);
  const lastValidInputs = ref<NormalizedInputs | null>(null);
  watch(calculatedResult, (result) => {
    if (result && normalizedInputs.value) {
      lastValidResult.value = result;
      lastValidInputs.value = normalizedInputs.value;
    }
  }, { immediate: true });

  const status = computed<CheckStatus>(() =>
    isValid.value ? calculatedResult.value?.status ?? 'invalid' : 'invalid',
  );
  const displayResult = computed<KeyResult | null>(() => {
    if (calculatedResult.value) {
      return calculatedResult.value;
    }
    return lastValidResult.value
      ? { ...lastValidResult.value, status: 'invalid' }
      : null;
  });
  const displayInputs = computed(() => normalizedInputs.value ?? lastValidInputs.value);
  const canvasResult = computed(() => calculatedResult.value ?? lastValidResult.value);

  const recommendedKey = computed(() => {
    const diameter = parseFiniteNumber(rawInputs.d);
    return diameter !== null && diameter > 0 ? findStandardKey(diameter) : null;
  });

  function applyRecommendedKey(): void {
    const recommendation = recommendedKey.value;
    if (!recommendation) {
      return;
    }
    rawInputs.b = String(recommendation.b);
    rawInputs.h = String(recommendation.h);
    rawInputs.t1 = String(recommendation.t1);
    rawInputs.t2 = String(recommendation.t2);
  }

  watch(() => rawInputs.d, () => {
    if (dimensionMode.value === 'standard') {
      applyRecommendedKey();
    }
  });

  function updateNumericField(field: NumericInputField, value: string): void {
    rawInputs[field] = value;
  }

  function setKeyType(type: KeyType): void {
    rawInputs.type = type;
  }

  function setEnableShear(enabled: boolean): void {
    rawInputs.enableShear = enabled;
  }

  function setDimensionMode(mode: DimensionMode): void {
    dimensionMode.value = mode;
    if (mode === 'standard') {
      applyRecommendedKey();
    }
  }

  function setViewOption(option: ViewOption, value: boolean): void {
    if (option === 'showFormulas') {
      showFormulas.value = value;
    } else {
      showDimensions.value = value;
    }
  }

  function loadRawInputs(inputs: RawInputs): void {
    dimensionMode.value = 'custom';
    Object.assign(rawInputs, defaultInputs(), inputs);
  }

  return {
    rawInputs,
    validationErrors,
    isValid,
    normalizedInputs,
    calculatedResult,
    lastValidResult,
    lastValidInputs,
    displayResult,
    displayInputs,
    canvasResult,
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
  };
}
