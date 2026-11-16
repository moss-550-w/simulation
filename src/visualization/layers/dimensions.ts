import Konva from 'konva';
import { formatNumber } from '../../domain/normalize';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

const DIMENSION_COLOR = '#496674';
const EXTENSION_COLOR = '#9aabb4';

function addLabel(layer: Konva.Layer, text: string, x: number, y: number, fontSize = 10): void {
  const label = new Konva.Label({ x, y, listening: false });
  label.add(new Konva.Tag({ fill: '#ffffff', opacity: 0.9, cornerRadius: 2 }));
  label.add(new Konva.Text({
    text, fontSize, fill: DIMENSION_COLOR, fontStyle: 'bold', padding: 3, fontFamily: 'Consolas, Microsoft YaHei',
  }));
  layer.add(label);
  label.offsetX(label.width() / 2);
  label.offsetY(label.height() / 2);
}

function horizontalDimension(
  layer: Konva.Layer,
  left: number,
  right: number,
  y: number,
  sourceY: number,
  text: string,
  labelY = y - 8,
): void {
  layer.add(new Konva.Line({
    points: [left, sourceY, left, y], stroke: EXTENSION_COLOR, strokeWidth: 0.8, listening: false,
  }));
  layer.add(new Konva.Line({
    points: [right, sourceY, right, y], stroke: EXTENSION_COLOR, strokeWidth: 0.8, listening: false,
  }));
  layer.add(new Konva.Arrow({
    points: [left, y, right, y], stroke: DIMENSION_COLOR, fill: DIMENSION_COLOR,
    strokeWidth: 0.9, pointerLength: 5, pointerWidth: 5, pointerAtBeginning: true, listening: false,
  }));
  addLabel(layer, text, (left + right) / 2, labelY);
}

function verticalDimension(
  layer: Konva.Layer,
  x: number,
  top: number,
  bottom: number,
  sourceX: number,
  text: string,
  labelX = x,
): void {
  layer.add(new Konva.Line({
    points: [sourceX, top, x, top], stroke: EXTENSION_COLOR, strokeWidth: 0.8, listening: false,
  }));
  layer.add(new Konva.Line({
    points: [sourceX, bottom, x, bottom], stroke: EXTENSION_COLOR, strokeWidth: 0.8, listening: false,
  }));
  layer.add(new Konva.Arrow({
    points: [x, top, x, bottom], stroke: DIMENSION_COLOR, fill: DIMENSION_COLOR,
    strokeWidth: 0.9, pointerLength: 5, pointerWidth: 5, pointerAtBeginning: true, listening: false,
  }));
  addLabel(layer, text, labelX, (top + bottom) / 2, 9);
}

function drawCrossDimensions(layer: Konva.Layer, model: CrossSectionModel): void {
  verticalDimension(
    layer,
    model.cx - model.hubRadius - 27,
    model.cy - model.hubRadius,
    model.cy + model.hubRadius,
    model.cx,
    `D=${formatNumber(model.input.D)}`,
  );
  horizontalDimension(
    layer,
    model.cx - model.shaftRadius,
    model.cx + model.shaftRadius,
    model.cy,
    model.cy,
    `d=${formatNumber(model.input.d)}`,
    model.cy + 15,
  );
  horizontalDimension(
    layer,
    model.keyLeft,
    model.keyRight,
    model.keyTop - 13,
    model.keyTop,
    `b=${formatNumber(model.input.b)}`,
  );
  verticalDimension(layer, model.keyRight + 72, model.keyTop, model.keyBottom, model.keyRight, 'h');
  verticalDimension(layer, model.keyRight + 46, model.shaftTop, model.keyBottom, model.keyRight, 't₁');
  verticalDimension(layer, model.keyRight + 20, model.hubSlotTop, model.shaftTop, model.keyRight, 't₂');
}

function drawLongitudinalDimensions(layer: Konva.Layer, model: LongitudinalSectionModel): void {
  horizontalDimension(
    layer,
    model.hubLeft,
    model.hubRight,
    model.hubTop - 18,
    model.hubTop,
    `Bh = ${formatNumber(model.input.Bh)} mm`,
  );
  horizontalDimension(
    layer,
    model.keyLeft,
    model.keyRight,
    model.hubBottom + 24,
    model.keyBottom,
    `L = ${formatNumber(model.input.L)} mm`,
  );
  horizontalDimension(
    layer,
    model.workingLeft,
    model.workingRight,
    model.hubBottom + 52,
    model.keyBottom,
    `l = ${formatNumber(model.result.l)} mm`,
  );
}

export function drawDimensions(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
  visible: boolean,
): void {
  layer.destroyChildren();
  if (visible) {
    drawCrossDimensions(layer, cross);
    drawLongitudinalDimensions(layer, longitudinal);
  }
  layer.batchDraw();
}
