import { hasValidationErrors, validateInputs } from './validation';
import type { RawInputs } from './types';

export const INPUT_TRANSFER_VERSION = 1;
export const INPUT_TRANSFER_KIND = 'plain-key-strength-inputs';

export type InputParseResult =
  | { success: true; inputs: RawInputs }
  | { success: false; message: string };

const REQUIRED_FIELDS = [
  'd', 'b', 'h', 'L', 'D', 'Bh', 't1', 't2', 'T', 'sigmaPAxle', 'sigmaPHub',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseRawInputsValue(value: unknown): RawInputs | null {
  if (!isRecord(value) || !['A', 'B', 'C'].includes(String(value.type))) {
    return null;
  }
  if (typeof value.enableShear !== 'boolean') {
    return null;
  }
  if (value.keyCount !== undefined && value.keyCount !== 1 && value.keyCount !== 2) {
    return null;
  }
  if (value.loadFactor !== undefined && typeof value.loadFactor !== 'string') {
    return null;
  }
  const values: Partial<RawInputs> = {
    type: value.type as RawInputs['type'],
    enableShear: value.enableShear,
    ...(value.keyCount === undefined ? {} : { keyCount: value.keyCount }),
    ...(value.loadFactor === undefined ? {} : { loadFactor: value.loadFactor }),
  };
  for (const field of REQUIRED_FIELDS) {
    if (typeof value[field] !== 'string') {
      return null;
    }
    values[field] = value[field];
  }
  for (const field of ['sigmaPKey', 'tauAllow'] as const) {
    if (value[field] !== undefined && typeof value[field] !== 'string') {
      return null;
    }
    values[field] = typeof value[field] === 'string' ? value[field] : '';
  }
  const inputs = values as RawInputs;
  return hasValidationErrors(validateInputs(inputs)) ? null : inputs;
}

export function serializeInputPayload(inputs: RawInputs): string {
  return JSON.stringify({
    version: INPUT_TRANSFER_VERSION,
    kind: INPUT_TRANSFER_KIND,
    inputs: { ...inputs },
  }, null, 2);
}

export function parseInputPayload(text: string): InputParseResult {
  try {
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload) || payload.version !== INPUT_TRANSFER_VERSION || payload.kind !== INPUT_TRANSFER_KIND) {
      return { success: false, message: '文件版本或数据类型不受支持，请选择本系统导出的 JSON 文件。' };
    }
    const inputs = parseRawInputsValue(payload.inputs);
    if (!inputs) {
      return { success: false, message: '参数字段缺失、类型错误或不符合几何与强度校核约束。' };
    }
    return { success: true, inputs };
  } catch {
    return { success: false, message: '无法解析 JSON 文件，请检查文件内容是否完整。' };
  }
}
