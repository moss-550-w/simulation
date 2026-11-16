import Konva from 'konva';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

export function drawHub(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
): void {
  layer.destroyChildren();
  const circlePath = (radius: number): string => [
    `M ${cross.cx - radius} ${cross.cy}`,
    `A ${radius} ${radius} 0 1 0 ${cross.cx + radius} ${cross.cy}`,
    `A ${radius} ${radius} 0 1 0 ${cross.cx - radius} ${cross.cy}`,
    'Z',
  ].join(' ');
  const slotPath = (top: number, bottom: number): string =>
    `M ${cross.keyLeft - 1} ${top} H ${cross.keyRight + 1} V ${bottom} H ${cross.keyLeft - 1} Z`;
  const secondSlotPath = cross.input.keyCount === 2
    ? slotPath(2 * cross.cy - cross.shaftTop - 1, 2 * cross.cy - cross.hubSlotTop)
    : '';
  const ring = new Konva.Path({
    data: `${circlePath(cross.hubRadius)} ${circlePath(cross.shaftRadius)} ${slotPath(cross.hubSlotTop, cross.shaftTop + 1)} ${secondSlotPath}`,
    fill: '#e7edf0',
    fillRule: 'evenodd',
    stroke: '#607d8b',
    strokeWidth: 1.3,
  });
  ring.setAttr('hint', `轮毂：外径 D = ${cross.input.D} mm，长度 Bh = ${cross.input.Bh} mm`);
  layer.add(ring);

  const hubBody = new Konva.Rect({
    x: longitudinal.hubLeft,
    y: longitudinal.hubTop,
    width: longitudinal.hubRight - longitudinal.hubLeft,
    height: longitudinal.hubBottom - longitudinal.hubTop,
    fill: '#e7edf0',
    stroke: '#607d8b',
    strokeWidth: 1.3,
  });
  hubBody.setAttr('hint', '轮毂纵向轮廓');
  layer.add(hubBody);
  layer.batchDraw();
}
