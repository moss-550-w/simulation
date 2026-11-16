import type { KeyResult, NormalizedInputs } from '../domain/types';
import type { ViewBox } from './drawCrossSection';

export interface LongitudinalSectionModel {
  input: NormalizedInputs;
  result: KeyResult;
  box: ViewBox;
  scaleX: number;
  scaleY: number;
  centerX: number;
  centerY: number;
  hubLeft: number;
  hubRight: number;
  hubTop: number;
  hubBottom: number;
  shaftTop: number;
  shaftBottom: number;
  keyLeft: number;
  keyRight: number;
  keyTop: number;
  keyBottom: number;
  keyHeight: number;
  workingLeft: number;
  workingRight: number;
}

/** 纵向与横向分别适配空间；工作长度直接取领域计算结果。 */
export function createLongitudinalSectionModel(
  input: NormalizedInputs,
  result: KeyResult,
  box: ViewBox,
): LongitudinalSectionModel {
  const scaleX = Math.max(0.1, (box.width - 90) / input.Bh);
  const scaleY = Math.max(0.1, Math.min(scaleX * 1.35, (box.height - 178) / input.D));
  const hubWidth = input.Bh * scaleX;
  const hubHeight = input.D * scaleY;
  const hubLeft = box.x + (box.width - hubWidth) / 2;
  const hubRight = hubLeft + hubWidth;
  const centerX = (hubLeft + hubRight) / 2;
  const hubTop = box.y + 65;
  const hubBottom = hubTop + hubHeight;
  const centerY = (hubTop + hubBottom) / 2;
  const shaftTop = centerY - input.d * scaleY / 2;
  const shaftBottom = centerY + input.d * scaleY / 2;
  const keyLeft = centerX - input.L * scaleX / 2;
  const keyRight = centerX + input.L * scaleX / 2;
  const keyBottom = shaftTop + input.t1 * scaleY;
  const keyHeight = Math.max(7, input.h * scaleY);
  const keyTop = keyBottom - keyHeight;
  const endInset = input.type === 'B' ? 0 : input.b * scaleX / 2;
  const workingLeft = input.type === 'B' ? keyLeft : keyLeft + endInset;
  const workingRight = input.type === 'A' ? keyRight - endInset : keyRight;

  return {
    input,
    result,
    box,
    scaleX,
    scaleY,
    centerX,
    centerY,
    hubLeft,
    hubRight,
    hubTop,
    hubBottom,
    shaftTop,
    shaftBottom,
    keyLeft,
    keyRight,
    keyTop,
    keyBottom,
    keyHeight,
    workingLeft,
    workingRight,
  };
}
