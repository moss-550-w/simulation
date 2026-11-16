import { parseFiniteNumber } from './normalize';
import type { NumericInputField, RawInputs, ValidationErrors } from './types';

const FIELD_LABELS: Record<NumericInputField, string> = {
  d: '轴径 d',
  b: '键宽 b',
  h: '键高 h',
  L: '键总长 L',
  D: '轮毂外径 D',
  Bh: '轮毂长度 Bh',
  t1: '轴槽深 t1',
  t2: '轮毂槽深 t2',
  T: '传递转矩 T',
  sigmaPAxle: '轴许用挤压应力',
  sigmaPHub: '轮毂许用挤压应力',
  sigmaPKey: '键许用挤压应力',
  tauAllow: '键许用剪切应力',
  loadFactor: '双键载荷分配系数 φ',
};

export function validateInputs(raw: RawInputs): ValidationErrors {
  const errors: ValidationErrors = {};
  const values: Partial<Record<NumericInputField, number>> = {};

  const validateNumber = (
    field: NumericInputField,
    options: { optional?: boolean; allowZero?: boolean } = {},
  ): void => {
    const rawValue = raw[field];
    const trimmed = rawValue?.trim() ?? '';
    if (trimmed === '') {
      if (!options.optional) {
        errors[field] = `请填写${FIELD_LABELS[field]}`;
      }
      return;
    }

    const value = parseFiniteNumber(trimmed);
    if (value === null) {
      errors[field] = `${FIELD_LABELS[field]}须为有效数字`;
      return;
    }
    values[field] = value;

    const invalid = options.allowZero ? value < 0 : value <= 0;
    if (invalid) {
      errors[field] = options.allowZero
        ? `${FIELD_LABELS[field]}须大于或等于 0`
        : `${FIELD_LABELS[field]}须大于 0`;
    }
  };

  validateNumber('d');
  validateNumber('b');
  validateNumber('h');
  validateNumber('L');
  validateNumber('D');
  validateNumber('Bh');
  validateNumber('t1');
  validateNumber('t2');
  validateNumber('T', { allowZero: true });
  validateNumber('sigmaPAxle');
  validateNumber('sigmaPHub');
  validateNumber('sigmaPKey', { optional: true });
  validateNumber('tauAllow', { optional: !raw.enableShear });
  validateNumber('loadFactor', { optional: raw.keyCount !== 2 });

  const { d, b, h, L, D, Bh, t1, t2, loadFactor } = values;
  if (raw.keyCount === 2 && loadFactor !== undefined && (loadFactor < 1 || loadFactor > 2)) {
    errors.loadFactor = '双键载荷分配系数 φ 须在 1–2 之间';
  }
  if (d !== undefined && b !== undefined && h !== undefined && L !== undefined
    && d > 0 && b > 0 && h > 0 && L > 0) {
    if (raw.type === 'A' && L <= b) {
      errors.L = 'A 型圆头键要求 L > b，以保证工作长度大于 0';
    }
    if (raw.type === 'C' && L <= b / 2) {
      errors.L = 'C 型单圆头键要求 L > b/2，以保证工作长度大于 0';
    }
    if (t1 !== undefined && t1 >= h) {
      errors.t1 = '轴槽深 t1 须小于键高 h';
    }
    if (t2 !== undefined && t2 >= h) {
      errors.t2 = '轮毂槽深 t2 须小于键高 h';
    }
  }
  if (d !== undefined && D !== undefined && d > 0 && D <= d) {
    errors.D = '轮毂外径 D 须大于轴径 d';
  }
  if (L !== undefined && Bh !== undefined && L > 0 && Bh < L) {
    errors.Bh = '轮毂长度 Bh 须大于或等于键总长 L';
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
