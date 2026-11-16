import Konva from 'konva';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

export function drawShaft(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
): void {
  layer.destroyChildren();
  const shaft = new Konva.Circle({
    x: cross.cx,
    y: cross.cy,
    radius: cross.shaftRadius,
    fill: '#d7e3e9',
    stroke: '#456979',
    strokeWidth: 1.4,
  });
  shaft.setAttr('hint', `轴：直径 d = ${cross.input.d} mm`);
  layer.add(shaft);
  const slotHeight = Math.max(1, cross.keyBottom - cross.shaftTop + 0.5);
  const createSlot = (y: number): Konva.Rect => new Konva.Rect({
    x: cross.keyLeft,
    y,
    width: cross.keyWidth,
    height: slotHeight,
    fill: '#f9fbfc',
    stroke: '#567786',
    strokeWidth: 1,
    listening: false,
  });
  layer.add(createSlot(cross.shaftTop - 0.5));
  if (cross.input.keyCount === 2) {
    layer.add(createSlot(2 * cross.cy - cross.keyBottom));
  }
  layer.add(new Konva.Line({
    points: [cross.cx - cross.shaftRadius - 10, cross.cy, cross.cx + cross.shaftRadius + 10, cross.cy],
    stroke: '#8ca1ac', strokeWidth: 0.8, dash: [10, 3, 2, 3], listening: false,
  }));
  layer.add(new Konva.Line({
    points: [cross.cx, cross.cy - cross.shaftRadius - 10, cross.cx, cross.cy + cross.shaftRadius + 10],
    stroke: '#8ca1ac', strokeWidth: 0.8, dash: [10, 3, 2, 3], listening: false,
  }));

  const shaftBody = new Konva.Rect({
    x: longitudinal.hubLeft - 9,
    y: longitudinal.shaftTop,
    width: longitudinal.hubRight - longitudinal.hubLeft + 18,
    height: longitudinal.shaftBottom - longitudinal.shaftTop,
    fill: '#d7e3e9',
    stroke: '#456979',
    strokeWidth: 1.2,
  });
  shaftBody.setAttr('hint', '轴的纵向示意轮廓');
  layer.add(shaftBody);
  layer.add(new Konva.Rect({
    x: longitudinal.keyLeft,
    y: longitudinal.shaftTop,
    width: longitudinal.keyRight - longitudinal.keyLeft,
    height: Math.max(1, longitudinal.keyBottom - longitudinal.shaftTop),
    fill: '#f9fbfc',
    stroke: '#567786',
    strokeWidth: 1,
    listening: false,
  }));
  layer.add(new Konva.Line({
    points: [longitudinal.hubLeft - 15, longitudinal.centerY, longitudinal.hubRight + 15, longitudinal.centerY],
    stroke: '#8ca1ac', strokeWidth: 0.8, dash: [12, 4, 2, 4], listening: false,
  }));
  layer.batchDraw();
}
