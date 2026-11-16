import { describe, expect, it } from 'vitest';
import { calculateKeyStrength } from '../domain/calculation';
import { TEXTBOOK_EXAMPLE } from '../domain/examples';
import { newtonMeterToNewtonMillimeter, normalizeInputs } from '../domain/normalize';
import type { NormalizedInputs, RawInputs } from '../domain/types';

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
    enableShear: false,
    tauAllow: 60,
    ...overrides,
  };
}

describe('单位归一化', () => {
  it('将界面转矩从 N·m 转为 N·mm', () => {
    expect(newtonMeterToNewtonMillimeter(500)).toBe(500000);
  });

  it('保留空的可选材料值，不转换为零或 NaN', () => {
    const raw: RawInputs = {
      d: '50', b: '12', h: '10', L: '80', type: 'A', D: '90', Bh: '80',
      t1: '5', t2: '3', T: '500', sigmaPAxle: '120', sigmaPHub: '100',
      sigmaPKey: '', enableShear: false, tauAllow: '',
    };
    const normalized = normalizeInputs(raw);
    expect(normalized.T).toBe(500000);
    expect(normalized.sigmaPKey).toBeUndefined();
    expect(normalized.tauAllow).toBeUndefined();
  });
});

describe('平键强度计算', () => {
  it('与设计文档数值基准一致，误差小于 0.1%', () => {
    const result = calculateKeyStrength(makeInput());
    const expectedSigmaP = 58.8235294117647;
    const relativeError = Math.abs(result.sigmaP - expectedSigmaP) / expectedSigmaP;

    expect(result.l).toBe(68);
    expect(result.hk).toBe(5);
    expect(relativeError).toBeLessThan(0.001);
    expect(result.sigmaPAllow).toBe(100);
    expect(result.etaP).toBeCloseTo(0.5882352941, 9);
    expect(result.Sp).toBeCloseTo(1.7, 9);
    expect(result.status).toBe('safe');
  });

  it('内置教材例题与标准答案的误差小于 0.1%', () => {
    const result = calculateKeyStrength(normalizeInputs(TEXTBOOK_EXAMPLE.inputs));
    const expected = TEXTBOOK_EXAMPLE.expected;
    expect(result.l).toBe(expected.l);
    expect(result.hk).toBe(expected.hk);
    expect(Math.abs(result.sigmaP - expected.sigmaP) / expected.sigmaP).toBeLessThan(0.001);
    expect(Math.abs((result.tau ?? 0) - expected.tau) / expected.tau).toBeLessThan(0.001);
    expect(Math.abs(result.etaP - expected.etaP) / expected.etaP).toBeLessThan(0.001);
    expect(result.Sp).toBeCloseTo(expected.Sp, 9);
  });

  it('T=0 时返回 noLoad，安全系数为 null', () => {
    const result = calculateKeyStrength(makeInput({ T: 0, enableShear: true }));
    expect(result.sigmaP).toBe(0);
    expect(result.tau).toBe(0);
    expect(result.etaMax).toBe(0);
    expect(result.Sp).toBeNull();
    expect(result.STau).toBeNull();
    expect(result.status).toBe('noLoad');
  });

  it.each([
    { axle: 80, hub: 100, key: 90, expected: 80, sources: ['sigmaPAxle'] },
    { axle: 120, hub: 80, key: 90, expected: 80, sources: ['sigmaPHub'] },
    { axle: 120, hub: 100, key: 80, expected: 80, sources: ['sigmaPKey'] },
  ])('从轴、毂、键中取最小许用挤压应力', ({ axle, hub, key, expected, sources }) => {
    const result = calculateKeyStrength(makeInput({
      sigmaPAxle: axle,
      sigmaPHub: hub,
      sigmaPKey: key,
    }));
    expect(result.sigmaPAllow).toBe(expected);
    expect(result.sigmaPAllowSources).toEqual(sources);
  });

  it('键材料值缺省时忽略，并列最小值保留全部来源', () => {
    const withoutKey = calculateKeyStrength(makeInput({ sigmaPKey: undefined }));
    expect(withoutKey.sigmaPAllow).toBe(100);

    const tied = calculateKeyStrength(makeInput({ sigmaPKey: 100 }));
    expect(tied.sigmaPAllowSources).toEqual(['sigmaPHub', 'sigmaPKey']);
  });

  it('剪切关闭时不输出剪切结果', () => {
    const result = calculateKeyStrength(makeInput({ enableShear: false }));
    expect(result.tau).toBeUndefined();
    expect(result.etaTau).toBeUndefined();
    expect(result.etaMax).toBe(result.etaP);
  });

  it('剪切开启时计算并参与综合判定', () => {
    const result = calculateKeyStrength(makeInput({ enableShear: true, tauAllow: 60 }));
    expect(result.tau).toBeCloseTo(24.5098039216, 9);
    expect(result.etaTau).toBeCloseTo(0.408496732, 9);
    expect(result.STau).toBeCloseTo(2.448, 9);
    expect(result.etaMax).toBe(result.etaP);
  });

  it('剪切利用率高于挤压时控制综合状态', () => {
    const result = calculateKeyStrength(makeInput({ enableShear: true, tauAllow: 20 }));
    expect(result.etaTau).toBeGreaterThan(result.etaP);
    expect(result.etaMax).toBe(result.etaTau);
    expect(result.status).toBe('fail');
  });

  it.each([
    { eta: 0.8, status: 'safe' },
    { eta: 0.8001, status: 'warning' },
    { eta: 1, status: 'warning' },
    { eta: 1.0001, status: 'fail' },
  ])('利用率 $eta 时状态为 $status', ({ eta, status }) => {
    const base = makeInput();
    const baseResult = calculateKeyStrength(base);
    const result = calculateKeyStrength(makeInput({ T: base.T * eta / baseResult.etaP }));
    expect(result.etaP).toBeCloseTo(eta, 9);
    expect(result.status).toBe(status);
  });
});
