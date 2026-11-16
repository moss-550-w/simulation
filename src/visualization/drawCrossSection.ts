import type { NormalizedInputs } from '../domain/types';

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CrossSectionModel {
  input: NormalizedInputs;
  box: ViewBox;
  scale: number;
  cx: number;
  cy: number;
  shaftRadius: number;
  hubRadius: number;
  shaftTop: number;
  hubSlotTop: number;
  keyLeft: number;
  keyRight: number;
  keyTop: number;
  keyBottom: number;
  keyWidth: number;
  keyHeight: number;
}

/** 横截面所有方向使用同一比例，仅将毫米几何映射到屏幕坐标。 */
export function createCrossSectionModel(input: NormalizedInputs, box: ViewBox): CrossSectionModel {
  const scale = Math.max(0.1, Math.min(
    (box.width - 142) / input.D,
    (box.height - 112) / input.D,
  ));
  const shaftRadius = input.d * scale / 2;
  const hubRadius = input.D * scale / 2;
  const cx = box.x + box.width / 2 + 5;
  const cy = box.y + box.height / 2 + 12;
  const shaftTop = cy - shaftRadius;
  const keyWidth = input.b * scale;
  const keyHeight = input.h * scale;
  const keyLeft = cx - keyWidth / 2;
  const keyRight = cx + keyWidth / 2;
  const keyBottom = shaftTop + input.t1 * scale;

  return {
    input,
    box,
    scale,
    cx,
    cy,
    shaftRadius,
    hubRadius,
    shaftTop,
    hubSlotTop: shaftTop - input.t2 * scale,
    keyLeft,
    keyRight,
    keyTop: keyBottom - keyHeight,
    keyBottom,
    keyWidth,
    keyHeight,
  };
}
