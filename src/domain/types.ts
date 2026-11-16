export type KeyType = 'A' | 'B' | 'C';

export type CheckStatus = 'safe' | 'warning' | 'fail' | 'noLoad' | 'invalid';

export type NumericInputField =
  | 'd'
  | 'b'
  | 'h'
  | 'L'
  | 'D'
  | 'Bh'
  | 't1'
  | 't2'
  | 'T'
  | 'sigmaPAxle'
  | 'sigmaPHub'
  | 'sigmaPKey'
  | 'tauAllow';

export interface RawInputs {
  d: string;
  b: string;
  h: string;
  L: string;
  type: KeyType;
  D: string;
  Bh: string;
  t1: string;
  t2: string;
  T: string;
  sigmaPAxle: string;
  sigmaPHub: string;
  sigmaPKey?: string;
  enableShear: boolean;
  tauAllow?: string;
}

export interface NormalizedInputs {
  d: number;
  b: number;
  h: number;
  L: number;
  type: KeyType;
  D: number;
  Bh: number;
  t1: number;
  t2: number;
  T: number;
  sigmaPAxle: number;
  sigmaPHub: number;
  sigmaPKey?: number;
  enableShear: boolean;
  tauAllow?: number;
}

export type ValidationErrors = Partial<Record<NumericInputField, string>>;

export type AllowSource = 'sigmaPAxle' | 'sigmaPHub' | 'sigmaPKey';

export interface KeyResult {
  l: number;
  hk: number;
  sigmaP: number;
  sigmaPAllow: number;
  sigmaPAllowSources: AllowSource[];
  etaP: number;
  Sp: number | null;
  tau?: number;
  etaTau?: number;
  STau?: number | null;
  etaMax: number;
  status: CheckStatus;
}

export interface StandardKeySize {
  minDiameterExclusive: number;
  maxDiameterInclusive: number;
  b: number;
  h: number;
  t1: number;
  t2: number;
}
