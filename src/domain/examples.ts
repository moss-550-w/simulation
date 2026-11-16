import type { RawInputs } from './types';

export interface TextbookExample {
  title: string;
  description: string;
  inputs: RawInputs;
  expected: {
    l: number;
    hk: number;
    sigmaP: number;
    tau: number;
    etaP: number;
    Sp: number;
  };
}

export const TEXTBOOK_EXAMPLE: TextbookExample = {
  title: '教材数值例题 · A 型普通平键',
  description: 'd=50 mm，b=12 mm，h=10 mm，L=80 mm，T=500 N·m；轴/毂许用挤压应力分别为 120/100 MPa。',
  inputs: {
    d: '50',
    b: '12',
    h: '10',
    L: '80',
    type: 'A',
    D: '90',
    Bh: '100',
    t1: '5.5',
    t2: '3.8',
    T: '500',
    sigmaPAxle: '120',
    sigmaPHub: '100',
    sigmaPKey: '',
    enableShear: true,
    tauAllow: '60',
  },
  expected: {
    l: 68,
    hk: 5,
    sigmaP: 58.8235294117647,
    tau: 24.5098039215686,
    etaP: 0.5882352941176471,
    Sp: 1.7,
  },
};
