import type { StandardKeySize } from './types';

export const STANDARD_KEY_TABLE: StandardKeySize[] = [
  { minDiameterExclusive: 6, maxDiameterInclusive: 8, b: 2, h: 2, t1: 1.2, t2: 1.0 },
  { minDiameterExclusive: 8, maxDiameterInclusive: 10, b: 3, h: 3, t1: 1.8, t2: 1.4 },
  { minDiameterExclusive: 10, maxDiameterInclusive: 12, b: 4, h: 4, t1: 2.5, t2: 1.8 },
  { minDiameterExclusive: 12, maxDiameterInclusive: 17, b: 5, h: 5, t1: 3.0, t2: 2.3 },
  { minDiameterExclusive: 17, maxDiameterInclusive: 22, b: 6, h: 6, t1: 3.5, t2: 2.8 },
  { minDiameterExclusive: 22, maxDiameterInclusive: 30, b: 8, h: 7, t1: 4.0, t2: 3.3 },
  { minDiameterExclusive: 30, maxDiameterInclusive: 38, b: 10, h: 8, t1: 5.0, t2: 3.3 },
  { minDiameterExclusive: 38, maxDiameterInclusive: 44, b: 12, h: 8, t1: 5.0, t2: 3.3 },
  { minDiameterExclusive: 44, maxDiameterInclusive: 50, b: 14, h: 9, t1: 5.5, t2: 3.8 },
  { minDiameterExclusive: 50, maxDiameterInclusive: 58, b: 16, h: 10, t1: 6.0, t2: 4.3 },
  { minDiameterExclusive: 58, maxDiameterInclusive: 65, b: 18, h: 11, t1: 7.0, t2: 4.4 },
  { minDiameterExclusive: 65, maxDiameterInclusive: 75, b: 20, h: 12, t1: 7.5, t2: 4.9 },
  { minDiameterExclusive: 75, maxDiameterInclusive: 85, b: 22, h: 14, t1: 9.0, t2: 5.4 },
  { minDiameterExclusive: 85, maxDiameterInclusive: 95, b: 25, h: 14, t1: 9.0, t2: 5.4 },
  { minDiameterExclusive: 95, maxDiameterInclusive: 110, b: 28, h: 16, t1: 10.0, t2: 6.4 },
  { minDiameterExclusive: 110, maxDiameterInclusive: 130, b: 32, h: 18, t1: 11.0, t2: 7.4 },
  { minDiameterExclusive: 130, maxDiameterInclusive: 150, b: 36, h: 20, t1: 12.0, t2: 8.4 },
  { minDiameterExclusive: 150, maxDiameterInclusive: 170, b: 40, h: 22, t1: 13.0, t2: 9.4 },
  { minDiameterExclusive: 170, maxDiameterInclusive: 200, b: 45, h: 25, t1: 15.0, t2: 10.4 },
];

export function findStandardKey(diameter: number): StandardKeySize | null {
  if (!Number.isFinite(diameter)) {
    return null;
  }
  return STANDARD_KEY_TABLE.find(
    (item) => diameter > item.minDiameterExclusive && diameter <= item.maxDiameterInclusive,
  ) ?? null;
}
