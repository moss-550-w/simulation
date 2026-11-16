import Konva from 'konva';
import { formatNumber } from '../../domain/normalize';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

const FORCE_COLOR = '#d86c20';

function addTorqueArrow(layer: Konva.Layer, model: CrossSectionModel): void {
  const radius = Math.max(25, model.shaftRadius * 0.72);
  const start = Math.PI * 0.8;
  const end = Math.PI * 2.15;
  const noLoad = model.input.T === 0;
  const color = noLoad ? '#82939e' : '#285f77';
  layer.add(new Konva.Shape({
    stroke: color,
    strokeWidth: 2,
    opacity: noLoad ? 0.55 : 0.95,
    sceneFunc(context) {
      context.beginPath();
      context.arc(model.cx, model.cy, radius, start, end, false);
      context.stroke();
    },
    listening: false,
  }));
  const endX = model.cx + radius * Math.cos(end);
  const endY = model.cy + radius * Math.sin(end);
  const tangentX = -Math.sin(end);
  const tangentY = Math.cos(end);
  const normalX = -tangentY;
  const normalY = tangentX;
  layer.add(new Konva.Shape({
    fill: color,
    opacity: noLoad ? 0.55 : 0.95,
    sceneFunc(context) {
      context.beginPath();
      context.moveTo(endX + tangentX * 10, endY + tangentY * 10);
      context.lineTo(endX - tangentX * 2 + normalX * 5, endY - tangentY * 2 + normalY * 5);
      context.lineTo(endX - tangentX * 2 - normalX * 5, endY - tangentY * 2 - normalY * 5);
      context.closePath();
      context.fill();
    },
    listening: false,
  }));
  layer.add(new Konva.Text({
    x: model.cx - model.shaftRadius,
    y: model.cy + model.shaftRadius * 0.48,
    width: model.shaftRadius * 2,
    align: 'center',
    text: `T = ${formatNumber(model.input.T / 1000)} N·m`,
    fontSize: 11,
    fontStyle: 'bold',
    fill: color,
    listening: false,
  }));
}

export function drawForce(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
): void {
  layer.destroyChildren();
  addTorqueArrow(layer, cross);
  const y = Math.max(cross.keyTop, cross.hubSlotTop) + Math.max(4, (cross.shaftTop - cross.keyTop) / 2);
  const opacity = cross.input.T === 0 ? 0.3 : 0.95;
  const forceYValues = cross.input.keyCount === 2 ? [y, 2 * cross.cy - y] : [y];
  forceYValues.forEach((forceY) => {
    layer.add(new Konva.Arrow({
      points: [cross.keyLeft - 32, forceY, cross.keyLeft - 4, forceY],
      stroke: FORCE_COLOR, fill: FORCE_COLOR, strokeWidth: 1.7, pointerLength: 7, pointerWidth: 7, opacity, listening: false,
    }));
    layer.add(new Konva.Arrow({
      points: [cross.keyRight + 32, forceY, cross.keyRight + 4, forceY],
      stroke: FORCE_COLOR, fill: FORCE_COLOR, strokeWidth: 1.7, pointerLength: 7, pointerWidth: 7, opacity, listening: false,
    }));
    layer.add(new Konva.Text({
      x: cross.keyLeft - 49, y: forceY - 16, text: 'F', fontFamily: 'Georgia', fontSize: 13, fill: FORCE_COLOR, opacity, listening: false,
    }));
    layer.add(new Konva.Text({
      x: cross.keyRight + 39, y: forceY - 16, text: 'F', fontFamily: 'Georgia', fontSize: 13, fill: FORCE_COLOR, opacity, listening: false,
    }));
  });

  if (cross.input.T > 0) {
    layer.add(new Konva.Arrow({
      points: [longitudinal.centerX, longitudinal.keyTop - 36, longitudinal.centerX, longitudinal.keyTop - 5],
      stroke: FORCE_COLOR, fill: FORCE_COLOR, strokeWidth: 1.6, pointerLength: 7, pointerWidth: 7, listening: false,
    }));
    layer.add(new Konva.Text({
      x: longitudinal.centerX + 7, y: longitudinal.keyTop - 34, text: '挤压接触', fontSize: 9, fill: FORCE_COLOR, listening: false,
    }));
  }
  layer.batchDraw();
}
