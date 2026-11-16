import type { NormalizedInputs, RawInputs } from './types';

export function formatNumber(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : value.toFixed(digits);
}

export function newtonMeterToNewtonMillimeter(value: number): number {
  return value * 1000;
}

export function newtonMillimeterToNewtonMeter(value: number): number {
  return value / 1000;
}

export function parseFiniteNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeInputs(raw: RawInputs): NormalizedInputs {
  const sigmaPKey = parseFiniteNumber(raw.sigmaPKey);
  const tauAllow = parseFiniteNumber(raw.tauAllow);

  return {
    d: Number(raw.d),
    b: Number(raw.b),
    h: Number(raw.h),
    L: Number(raw.L),
    type: raw.type,
    D: Number(raw.D),
    Bh: Number(raw.Bh),
    t1: Number(raw.t1),
    t2: Number(raw.t2),
    T: newtonMeterToNewtonMillimeter(Number(raw.T)),
    sigmaPAxle: Number(raw.sigmaPAxle),
    sigmaPHub: Number(raw.sigmaPHub),
    ...(sigmaPKey === null ? {} : { sigmaPKey }),
    enableShear: raw.enableShear,
    ...(raw.enableShear && tauAllow !== null ? { tauAllow } : {}),
    keyCount: raw.keyCount ?? 1,
    loadFactor: parseFiniteNumber(raw.loadFactor) ?? 1.5,
  };
}
