import type { KeyType } from './types';

export function getWorkingLength(type: KeyType, L: number, b: number): number {
  switch (type) {
    case 'A':
      return L - b;
    case 'B':
      return L;
    case 'C':
      return L - b / 2;
  }
}

export function getKeyTypeName(type: KeyType): string {
  switch (type) {
    case 'A':
      return 'A 型圆头';
    case 'B':
      return 'B 型方头';
    case 'C':
      return 'C 型单圆头';
  }
}
