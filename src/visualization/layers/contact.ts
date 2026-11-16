import Konva from 'konva';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

const CONTACT_COLOR = '#e47b24';

export function drawContact(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
): void {
  layer.destroyChildren();
  const contactPairs = [
    { top: cross.keyTop, bottom: cross.shaftTop },
    ...(cross.input.keyCount === 2
      ? [{ top: 2 * cross.cy - cross.shaftTop, bottom: 2 * cross.cy - cross.keyTop }]
      : []),
  ];
  contactPairs.forEach(({ top, bottom }) => {
    [cross.keyLeft, cross.keyRight].forEach((x) => {
      layer.add(new Konva.Line({
        points: [x, top, x, bottom],
        stroke: CONTACT_COLOR,
        strokeWidth: 4,
        opacity: 0.9,
        listening: false,
      }));
    });
  });

  [longitudinal.keyTop, longitudinal.keyBottom].forEach((y) => {
    layer.add(new Konva.Line({
      points: [longitudinal.workingLeft, y, longitudinal.workingRight, y],
      stroke: CONTACT_COLOR,
      strokeWidth: 3,
      listening: false,
    }));
  });

  if (cross.input.enableShear) {
    layer.add(new Konva.Line({
      points: [longitudinal.workingLeft, longitudinal.keyBottom + 6, longitudinal.workingRight, longitudinal.keyBottom + 6],
      stroke: '#694d8d',
      strokeWidth: 1.8,
      dash: [8, 5],
      listening: false,
    }));
    layer.add(new Konva.Text({
      x: longitudinal.workingLeft,
      y: longitudinal.keyBottom + 9,
      text: '剪切面（虚线示意）',
      fontSize: 9,
      fill: '#694d8d',
      listening: false,
    }));
  }

  if (longitudinal.result.status === 'fail') {
    const x = Math.min(longitudinal.workingRight + 13, longitudinal.hubRight - 10);
    const y = longitudinal.keyTop - 11;
    layer.add(new Konva.Circle({ x, y, radius: 9, fill: '#c43d3d', listening: false }));
    layer.add(new Konva.Text({
      x: x - 5, y: y - 7, width: 10, align: 'center', text: '!', fontSize: 13, fontStyle: 'bold', fill: '#fff', listening: false,
    }));
  }
  layer.batchDraw();
}
