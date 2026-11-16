import { describe, expect, it } from 'vitest';
import { calculateConnectionStrength } from '../domain/doubleKey';
import { normalizeInputs } from '../domain/normalize';
import { buildPrintableReport } from '../domain/report';
import type { RawInputs } from '../domain/types';

function makeRaw(overrides: Partial<RawInputs> = {}): RawInputs {
  return {
    d: '50', b: '12', h: '10', L: '80', type: 'A', D: '90', Bh: '80',
    t1: '5', t2: '3', T: '500', sigmaPAxle: '120', sigmaPHub: '100',
    sigmaPKey: '', enableShear: true, tauAllow: '60', keyCount: 1, loadFactor: '1.5',
    ...overrides,
  };
}

function makeReport(raw: RawInputs, generatedAt = '2026-11-16 13:30:00'): string {
  const inputs = normalizeInputs(raw);
  return buildPrintableReport({
    inputs,
    result: calculateConnectionStrength(inputs),
    imageDataUrl: 'data:image/png;base64,AAEC',
    generatedAt,
  });
}

describe('M5 可打印校核报告', () => {
  it('包含同一计算结果、输入参数、公式和画布截图', () => {
    const report = makeReport(makeRaw());
    expect(report).toContain('普通平键连接强度校核报告');
    expect(report).toContain('58.82 MPa');
    expect(report).toContain('24.51 MPa');
    expect(report).toContain('l = L − b = 68.00 mm');
    expect(report).toContain('data:image/png;base64,AAEC');
    expect(report).toContain('打印 / 另存 PDF');
    expect(report).not.toContain('NaN');
    expect(report).not.toContain('Infinity');
    expect(report).not.toContain('undefined');
  });

  it('双键报告展示每键转矩与载荷分配假设', () => {
    const report = makeReport(makeRaw({ keyCount: 2, loadFactor: '1.5' }));
    expect(report).toContain('双键 180°');
    expect(report).toContain('Ti = T/φ');
    expect(report).toContain('333333.33 N·mm');
    expect(report).toContain('39.22 MPa');
    expect(report).toContain('16.34 MPa');
    expect(report).toContain('不是精确载荷分布');
  });

  it('转义生成时间中的 HTML，避免报告标记注入', () => {
    const report = makeReport(makeRaw(), '<script>alert("x")</script>');
    expect(report).not.toContain('<script>alert("x")</script>');
    expect(report).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
});
