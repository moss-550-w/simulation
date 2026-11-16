import { computed, reactive, ref, watch } from 'vue';
import { calculateConnectionStrength } from '../domain/doubleKey';
import { TEXTBOOK_EXAMPLE } from '../domain/examples';
import { parseInputPayload, serializeInputPayload } from '../domain/inputTransfer';
import { getWorkingLength } from '../domain/keyTypes';
import {
  newtonMeterToNewtonMillimeter,
  newtonMillimeterToNewtonMeter,
  normalizeInputs,
  parseFiniteNumber,
} from '../domain/normalize';
import { findStandardKey } from '../domain/standardKeys';
import { hasValidationErrors, validateInputs } from '../domain/validation';
import type {
  CheckStatus,
  ConnectionResult,
  KeyCount,
  KeyType,
  NormalizedInputs,
  NumericInputField,
  RawInputs,
  TrendPoint,
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
  keyCount: 1,
  loadFactor: '1.5',
};

const STORAGE_KEY = 'key-strength-checker:inputs:v1';
const TREND_SAMPLE_COUNT = 24;

function defaultInputs(): RawInputs {
  return { ...DEFAULT_RAW_INPUTS };
}

function initialInputs(): RawInputs {
  if (typeof window === 'undefined') {
    return defaultInputs();
  }
  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = parseInputPayload(cached);
      if (parsed.success) {
        return parsed.inputs;
      }
    }
  } catch {
    // 本地存储不可用或数据损坏时使用安全默认参数。
  }
  return defaultInputs();
}

function sampleTorqueTrend(input: NormalizedInputs): TrendPoint[] {
  const currentTorque = newtonMillimeterToNewtonMeter(input.T);
  const maximum = Math.max(100, currentTorque * 1.5);
  return Array.from({ length: TREND_SAMPLE_COUNT + 1 }, (_, index) => {
    const torque = maximum * index / TREND_SAMPLE_COUNT;
    const sample = { ...input, T: newtonMeterToNewtonMillimeter(torque) };
    return { x: torque, y: calculateConnectionStrength(sample).sigmaP };
  });
}

function sampleLengthTrend(input: NormalizedInputs): TrendPoint[] {
  const minimum = Math.min(input.L, Math.max(input.L * 0.35, input.b * 0.25));
  const maximum = Math.min(input.Bh, Math.max(input.L * 1.5, input.L + input.b));
  const range = Math.max(1, maximum - minimum);
  const points: TrendPoint[] = [];
  for (let index = 0; index <= TREND_SAMPLE_COUNT; index += 1) {
    const length = minimum + range * index / TREND_SAMPLE_COUNT;
    if (length > input.Bh || getWorkingLength(input.type, length, input.b) <= 0) {
      continue;
    }
    const sample = { ...input, L: length };
    points.push({ x: length, y: calculateConnectionStrength(sample).sigmaP });
  }
  return points;
}

export function useKeySimulation() {
  const rawInputs = reactive<RawInputs>(initialInputs());
  const dimensionMode = ref<DimensionMode>('standard');
  const exampleActive = ref(false);
  const showFormulas = ref(true);
  const showDimensions = ref(true);

  const validationErrors = computed(() => validateInputs(rawInputs));
  const isValid = computed(() => !hasValidationErrors(validationErrors.value));
  const normalizedInputs = computed<NormalizedInputs | null>(() =>
    isValid.value ? normalizeInputs(rawInputs) : null,
  );
  const calculatedResult = computed<ConnectionResult | null>(() =>
    normalizedInputs.value ? calculateConnectionStrength(normalizedInputs.value) : null,
  );

  const lastValidResult = ref<ConnectionResult | null>(null);
  const lastValidInputs = ref<NormalizedInputs | null>(null);
  watch(calculatedResult, (result) => {
    if (result && normalizedInputs.value) {
      lastValidResult.value = result;
      lastValidInputs.value = normalizedInputs.value;
      try {
        window.localStorage.setItem(STORAGE_KEY, serializeInputPayload(rawInputs));
      } catch {
        // 隐私模式或存储配额不影响校核功能。
      }
    }
  }, { immediate: true });

  const status = computed<CheckStatus>(() =>
    isValid.value ? calculatedResult.value?.status ?? 'invalid' : 'invalid',
  );
  const displayResult = computed<ConnectionResult | null>(() => {
    if (calculatedResult.value) {
      return calculatedResult.value;
    }
    return lastValidResult.value
      ? { ...lastValidResult.value, status: 'invalid' }
      : null;
  });
  const displayInputs = computed(() => normalizedInputs.value ?? lastValidInputs.value);
  const canvasResult = computed(() => calculatedResult.value ?? lastValidResult.value);
  const torqueTrend = computed(() => displayInputs.value ? sampleTorqueTrend(displayInputs.value) : []);
  const lengthTrend = computed(() => displayInputs.value ? sampleLengthTrend(displayInputs.value) : []);

  const recommendedKey = computed(() => {
    const diameter = parseFiniteNumber(rawInputs.d);
    return diameter !== null && diameter > 0 ? findStandardKey(diameter) : null;
  });

  function applyRecommendedKey(): void {
    exampleActive.value = false;
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
    exampleActive.value = false;
    rawInputs[field] = value;
  }

  function setKeyType(type: KeyType): void {
    exampleActive.value = false;
    rawInputs.type = type;
  }

  function setEnableShear(enabled: boolean): void {
    exampleActive.value = false;
    rawInputs.enableShear = enabled;
  }

  function setKeyCount(keyCount: KeyCount): void {
    exampleActive.value = false;
    rawInputs.keyCount = keyCount;
    if (keyCount === 2 && !rawInputs.loadFactor) {
      rawInputs.loadFactor = '1.5';
    }
  }

  function setDimensionMode(mode: DimensionMode): void {
    exampleActive.value = false;
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
    exampleActive.value = false;
    dimensionMode.value = 'custom';
    Object.assign(rawInputs, defaultInputs(), inputs);
  }

  function loadTextbookExample(): void {
    loadRawInputs(TEXTBOOK_EXAMPLE.inputs);
    exampleActive.value = true;
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
    setKeyCount,
    setDimensionMode,
    setViewOption,
    applyRecommendedKey,
    loadRawInputs,
    loadTextbookExample,
  };
}
