import Konva from 'konva';
import type { CrossSectionModel } from '../drawCrossSection';
import type { LongitudinalSectionModel } from '../drawLongitudinalSection';

export function drawHub(
  layer: Konva.Layer,
  cross: CrossSectionModel,
  longitudinal: LongitudinalSectionModel,
): void {
  layer.destroyChildren();
  const ring = new Konva.Shape({
    fill: '#e7edf0',
    stroke: '#607d8b',
    strokeWidth: 1.3,
    sceneFunc(context) {
      context.beginPath();
      context.arc(cross.cx, cross.cy, cross.hubRadius, 0, Math.PI * 2, false);
      context.arc(cross.cx, cross.cy, cross.shaftRadius, 0, Math.PI * 2, true);
      context.rect(
        cross.keyLeft - 1,
        cross.hubSlotTop,
        cross.keyWidth + 2,
        Math.max(1, cross.shaftTop - cross.hubSlotTop + 1),
      );
      context.fill('evenodd');
      context.stroke();
    },
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
