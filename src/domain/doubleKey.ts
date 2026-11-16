import { calculateKeyStrength } from './calculation';
import type { ConnectionResult, NormalizedInputs } from './types';

export const DEFAULT_LOAD_FACTOR = 1.5;

export function calculateDoubleKeyStrength(input: NormalizedInputs): ConnectionResult {
  const loadFactor = input.loadFactor ?? DEFAULT_LOAD_FACTOR;
  const torquePerKey = input.T / loadFactor;
  const result = calculateKeyStrength({ ...input, T: torquePerKey });
  return {
    ...result,
    keyCount: 2,
    loadFactor,
    torquePerKey,
  };
}

export function calculateConnectionStrength(input: NormalizedInputs): ConnectionResult {
  if (input.keyCount === 2) {
    return calculateDoubleKeyStrength(input);
  }
  return {
    ...calculateKeyStrength(input),
    keyCount: 1,
    loadFactor: 1,
    torquePerKey: input.T,
  };
}
