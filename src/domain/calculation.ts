import { getWorkingLength } from './keyTypes';
import type { AllowSource, CheckStatus, KeyResult, NormalizedInputs } from './types';

export const STATUS_META: Record<CheckStatus, {
  label: string;
  conclusion: string;
  color: string;
  icon: string;
}> = {
  safe: { label: '合格', conclusion: '强度满足，裕度充足', color: '#197189', icon: '合' },
  warning: { label: '裕度偏低', conclusion: '强度满足，裕度偏低', color: '#b57b0b', icon: '警' },
  fail: { label: '失效', conclusion: '强度不足，存在失效风险', color: '#c43d3d', icon: '失' },
  noLoad: { label: '无载荷', conclusion: '无载荷，暂不判定失效', color: '#64748b', icon: '零' },
  invalid: { label: '参数无效', conclusion: '参数无效，请检查输入', color: '#a34b55', icon: '!' },
};

export function calculateKeyStrength(input: NormalizedInputs): KeyResult {
  const l = getWorkingLength(input.type, input.L, input.b);
  const hk = input.h / 2;
  const sigmaP = (2 * input.T) / (input.d * hk * l);

  const allowable = [
    { source: 'sigmaPAxle' as const, value: input.sigmaPAxle },
    { source: 'sigmaPHub' as const, value: input.sigmaPHub },
    ...(input.sigmaPKey === undefined
      ? []
      : [{ source: 'sigmaPKey' as const, value: input.sigmaPKey }]),
  ];
  const sigmaPAllow = Math.min(...allowable.map((item) => item.value));
  const sigmaPAllowSources: AllowSource[] = allowable
    .filter((item) => item.value === sigmaPAllow)
    .map((item) => item.source);

  const etaP = sigmaP / sigmaPAllow;
  const Sp = etaP > 0 ? 1 / etaP : null;

  let tau: number | undefined;
  let etaTau: number | undefined;
  let STau: number | null | undefined;
  if (input.enableShear && input.tauAllow !== undefined) {
    tau = (2 * input.T) / (input.d * input.b * l);
    etaTau = tau / input.tauAllow;
    STau = etaTau > 0 ? 1 / etaTau : null;
  }

  const etaMax = Math.max(etaP, etaTau ?? 0);
  const status = input.T === 0 || etaMax === 0
    ? 'noLoad'
    : etaMax > 1
      ? 'fail'
      : etaMax > 0.8
        ? 'warning'
        : 'safe';

  return {
    l,
    hk,
    sigmaP,
    sigmaPAllow,
    sigmaPAllowSources,
    etaP,
    Sp,
    ...(tau === undefined ? {} : { tau, etaTau, STau }),
    etaMax,
    status,
  };
}
