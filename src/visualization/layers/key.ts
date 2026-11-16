import Konva from 'konva';
import { STATUS_META } from '../../domain/calculation';
import { getKeyTypeName } from '../../domain/keyTypes';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

function createLongitudinalKey(model: LongitudinalSectionModel, color: string): Konva.Shape {
  const { keyLeft: left, keyRight: right, keyTop: top, keyBottom: bottom, keyHeight, input } = model;
  const radius = Math.min(keyHeight / 2, (right - left) / 2);
  return new Konva.Shape({
    fill: color,
    stroke: '#294b5b',
    strokeWidth: 1.4,
    opacity: 0.9,
    sceneFunc(context) {
      context.beginPath();
      if (input.type === 'B') {
        context.rect(left, top, right - left, keyHeight);
      } else if (input.type === 'A') {
        context.moveTo(left + radius, top);
        context.lineTo(right - radius, top);
        context.arc(right - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, false);
        context.lineTo(left + radius, bottom);
        context.arc(left + radius, top + radius, radius, Math.PI / 2, Math.PI * 1.5, false);
        context.closePath();
      } else {
        context.moveTo(left + radius, top);
        context.lineTo(right, top);
        context.lineTo(right, bottom);
        context.lineTo(left + radius, bottom);
        context.arc(left + radius, top + radius, radius, Math.PI / 2, Math.PI * 1.5, false);
        context.closePath();
      }
      context.fill();
      context.stroke();
    },
  });
}

export function drawKey(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
): void {
  layer.destroyChildren();
  const color = STATUS_META[longitudinal.result.status].color;
  const crossKey = new Konva.Rect({
    x: cross.keyLeft,
    y: cross.keyTop,
    width: cross.keyWidth,
    height: cross.keyHeight,
    fill: color,
    stroke: '#294b5b',
    strokeWidth: 1.4,
    opacity: 0.9,
  });
  crossKey.setAttr('hint', `${getKeyTypeName(cross.input.type)}：b = ${cross.input.b} mm，h = ${cross.input.h} mm`);
  layer.add(crossKey);
  if (cross.input.keyCount === 2) {
    const secondKey = new Konva.Rect({
      x: cross.keyLeft,
      y: 2 * cross.cy - cross.keyTop - cross.keyHeight,
      width: cross.keyWidth,
      height: cross.keyHeight,
      fill: color,
      stroke: '#294b5b',
      strokeWidth: 1.4,
      opacity: 0.9,
    });
    secondKey.setAttr('hint', '第二键：与上方键呈 180° 布置，按相同单键平均应力校核');
    layer.add(secondKey);
    layer.add(new Konva.Text({
      x: cross.keyRight + 8,
      y: 2 * cross.cy - cross.keyTop - cross.keyHeight / 2 - 6,
      text: '180°',
      fontSize: 9,
      fill: '#355b6c',
      listening: false,
    }));
  }

  const longitudinalKey = createLongitudinalKey(longitudinal, color);
  longitudinalKey.setAttr('hint', `${getKeyTypeName(cross.input.type)}，工作长度 l = ${longitudinal.result.l.toFixed(2)} mm`);
  layer.add(longitudinalKey);
  layer.add(new Konva.Text({
    x: longitudinal.keyLeft,
    y: longitudinal.keyTop - 19,
    width: longitudinal.keyRight - longitudinal.keyLeft,
    align: 'center',
    text: `${cross.input.type} 型普通平键${cross.input.keyCount === 2 ? '（双键之一）' : ''}`,
    fontSize: 10,
    fontStyle: 'bold',
    fill: '#355b6c',
    listening: false,
  }));
  layer.batchDraw();
}
