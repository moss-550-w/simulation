import { describe, expect, it } from 'vitest';
import { calculateKeyStrength } from '../domain/calculation';
import { calculateConnectionStrength, calculateDoubleKeyStrength } from '../domain/doubleKey';
import type { NormalizedInputs } from '../domain/types';

function makeInput(overrides: Partial<NormalizedInputs> = {}): NormalizedInputs {
  return {
    d: 50,
    b: 12,
    h: 10,
    L: 80,
    type: 'A',
    D: 90,
    Bh: 80,
    t1: 5,
    t2: 3,
    T: 500000,
    sigmaPAxle: 120,
    sigmaPHub: 100,
    enableShear: true,
    tauAllow: 60,
    keyCount: 2,
    loadFactor: 1.5,
    ...overrides,
  };
}

describe('M5 双键 180° 载荷分配扩展', () => {
  it('默认按合计 1.5 倍单键承载，每键承担 T/1.5', () => {
    const single = calculateKeyStrength(makeInput({ keyCount: 1 }));
    const double = calculateDoubleKeyStrength(makeInput({ loadFactor: undefined }));
    expect(double.torquePerKey).toBeCloseTo(500000 / 1.5, 9);
    expect(double.sigmaP).toBeCloseTo(single.sigmaP / 1.5, 9);
    expect(double.tau).toBeCloseTo((single.tau ?? 0) / 1.5, 9);
    expect(double.l).toBe(single.l);
    expect(double.sigmaPAllow).toBe(single.sigmaPAllow);
  });

  it.each([1, 1.25, 2])('支持可配置载荷分配系数 φ=%s', (loadFactor) => {
    const single = calculateKeyStrength(makeInput({ keyCount: 1 }));
    const double = calculateDoubleKeyStrength(makeInput({ loadFactor }));
    expect(double.sigmaP).toBeCloseTo(single.sigmaP / loadFactor, 9);
    expect(double.etaP).toBeCloseTo(single.etaP / loadFactor, 9);
    expect(double.Sp).toBeCloseTo((single.Sp ?? 0) * loadFactor, 9);
  });

  it('双键无载荷仍为 noLoad，安全系数为 null', () => {
    const result = calculateDoubleKeyStrength(makeInput({ T: 0 }));
    expect(result.status).toBe('noLoad');
    expect(result.torquePerKey).toBe(0);
    expect(result.Sp).toBeNull();
    expect(result.STau).toBeNull();
  });

  it('统一入口保持单键结果不变并补充连接元数据', () => {
    const input = makeInput({ keyCount: 1 });
    const single = calculateKeyStrength(input);
    const connection = calculateConnectionStrength(input);
    expect(connection).toMatchObject(single);
    expect(connection.keyCount).toBe(1);
    expect(connection.loadFactor).toBe(1);
    expect(connection.torquePerKey).toBe(input.T);
  });

  it('统一入口只在 keyCount=2 时进入双键扩展', () => {
    const input = makeInput({ keyCount: 2, loadFactor: 2 });
    const result = calculateConnectionStrength(input);
    expect(result.keyCount).toBe(2);
    expect(result.torquePerKey).toBe(input.T / 2);
    expect(result.sigmaP).toBeCloseTo(calculateKeyStrength(input).sigmaP / 2, 9);
  });
});
