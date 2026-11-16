import { describe, expect, it } from 'vitest';
import { getKeyTypeName, getWorkingLength } from '../domain/keyTypes';
import { findStandardKey } from '../domain/standardKeys';

describe('A/B/C 型工作长度策略', () => {
  it('A 型圆头 l=L-b', () => {
    expect(getWorkingLength('A', 80, 12)).toBe(68);
  });

  it('B 型方头 l=L', () => {
    expect(getWorkingLength('B', 80, 12)).toBe(80);
  });

  it('C 型单圆头 l=L-b/2', () => {
    expect(getWorkingLength('C', 80, 12)).toBe(74);
  });

  it('保留非正结果供校验层拦截', () => {
    expect(getWorkingLength('A', 12, 12)).toBe(0);
    expect(getWorkingLength('C', 6, 12)).toBe(0);
  });

  it('提供中文键型名称', () => {
    expect(getKeyTypeName('A')).toContain('圆头');
    expect(getKeyTypeName('B')).toContain('方头');
    expect(getKeyTypeName('C')).toContain('单圆头');
  });
});

describe('标准键教学简化表', () => {
  it('按轴径区间推荐尺寸', () => {
    expect(findStandardKey(50)).toMatchObject({ b: 14, h: 9, t1: 5.5, t2: 3.8 });
    expect(findStandardKey(50.1)).toMatchObject({ b: 16, h: 10 });
  });

  it('边界采用下开上闭区间', () => {
    expect(findStandardKey(44)).toMatchObject({ b: 12 });
    expect(findStandardKey(44.01)).toMatchObject({ b: 14 });
  });

  it('超出教学表范围时返回 null', () => {
    expect(findStandardKey(6)).toBeNull();
    expect(findStandardKey(201)).toBeNull();
    expect(findStandardKey(Number.NaN)).toBeNull();
  });
});
