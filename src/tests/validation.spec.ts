import { describe, expect, it } from 'vitest';
import { hasValidationErrors, validateInputs } from '../domain/validation';
import type { RawInputs } from '../domain/types';

function validRaw(overrides: Partial<RawInputs> = {}): RawInputs {
  return {
    d: '50',
    b: '12',
    h: '10',
    L: '80',
    type: 'A',
    D: '90',
    Bh: '80',
    t1: '5',
    t2: '3',
    T: '500',
    sigmaPAxle: '120',
    sigmaPHub: '100',
    sigmaPKey: '',
    enableShear: false,
    tauAllow: '',
    ...overrides,
  };
}

describe('输入校验', () => {
  it('接受合法输入、空的可选键材料值和 T=0', () => {
    expect(validateInputs(validRaw())).toEqual({});
    expect(validateInputs(validRaw({ T: '0' }))).toEqual({});
  });

  it.each(['d', 'b', 'h', 'L', 'D', 'Bh', 't1', 't2', 'T', 'sigmaPAxle', 'sigmaPHub'] as const)(
    '必填字段 %s 为空时返回字段错误',
    (field) => {
      const errors = validateInputs(validRaw({ [field]: '' }));
      expect(errors[field]).toContain('请填写');
    },
  );

  it.each([
    { field: 'b' as const, value: '-1' },
    { field: 'T' as const, value: '-1' },
    { field: 'd' as const, value: 'abc' },
    { field: 'h' as const, value: 'NaN' },
    { field: 'L' as const, value: 'Infinity' },
  ])('拦截非法数值 $field=$value', ({ field, value }) => {
    expect(validateInputs(validRaw({ [field]: value }))[field]).toBeTruthy();
  });

  it('A 型要求 L>b', () => {
    expect(validateInputs(validRaw({ L: '12' })).L).toContain('L > b');
    expect(validateInputs(validRaw({ L: '11' })).L).toContain('L > b');
  });

  it('C 型要求 L>b/2', () => {
    expect(validateInputs(validRaw({ type: 'C', L: '6' })).L).toContain('L > b/2');
  });

  it('B 型只要求 L>0', () => {
    expect(validateInputs(validRaw({ type: 'B', L: '12' }))).toEqual({});
  });

  it('校验 D>d 和 Bh>=L', () => {
    expect(validateInputs(validRaw({ D: '50' })).D).toContain('D 须大于');
    expect(validateInputs(validRaw({ Bh: '79' })).Bh).toContain('Bh 须大于或等于');
  });

  it('校验槽深为正且小于键高', () => {
    expect(validateInputs(validRaw({ t1: '10' })).t1).toContain('小于键高');
    expect(validateInputs(validRaw({ t2: '10' })).t2).toContain('小于键高');
    expect(validateInputs(validRaw({ t1: '0' })).t1).toContain('大于 0');
  });

  it('可选键材料值填写后须为正数', () => {
    expect(validateInputs(validRaw({ sigmaPKey: '90' }))).toEqual({});
    expect(validateInputs(validRaw({ sigmaPKey: '0' })).sigmaPKey).toBeTruthy();
  });

  it('开启剪切时 tauAllow 必填且大于零', () => {
    expect(validateInputs(validRaw({ enableShear: true })).tauAllow).toContain('请填写');
    expect(validateInputs(validRaw({ enableShear: true, tauAllow: '0' })).tauAllow).toBeTruthy();
    expect(validateInputs(validRaw({ enableShear: true, tauAllow: '60' }))).toEqual({});
  });

  it('错误集合可统一判断是否有效', () => {
    expect(hasValidationErrors({})).toBe(false);
    expect(hasValidationErrors(validateInputs(validRaw({ d: '' })))).toBe(true);
  });
});
