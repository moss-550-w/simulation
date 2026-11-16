import Konva from 'konva';
import type { ViewBox } from '../drawCrossSection';

export interface CanvasInteraction {
  reset: () => void;
  zoomBy: (factor: number) => void;
}

export function drawInteractionGuides(layer: Konva.Layer, views: ViewBox[]): void {
  layer.find('.view-guide').forEach((node) => node.destroy());
  views.forEach((view) => {
    const guide = new Konva.Text({
      x: view.x + 14,
      y: view.y + view.height - 22,
      text: '滚轮缩放 · 拖动平移 · 悬停查看构件',
      fontSize: 9,
      fill: '#93a2ab',
      listening: false,
      name: 'view-guide',
    });
    layer.add(guide);
  });
  layer.batchDraw();
}

export function setupInteraction(stage: Konva.Stage, layer: Konva.Layer): CanvasInteraction {
  const tooltip = new Konva.Label({ visible: false, listening: false, name: 'canvas-tooltip' });
  tooltip.add(new Konva.Tag({
    fill: '#122a3d', opacity: 0.94, cornerRadius: 3,
    shadowColor: '#000', shadowBlur: 5, shadowOpacity: 0.16, shadowOffsetY: 2,
  }));
  tooltip.add(new Konva.Text({ text: '', padding: 7, fontSize: 11, fill: '#ffffff', lineHeight: 1.35 }));
  layer.add(tooltip);
  stage.draggable(true);

  function hideTooltip(): void {
    tooltip.hide();
    layer.batchDraw();
  }

  function zoomAt(pointer: { x: number; y: number }, nextScale: number): void {
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const scale = Math.max(0.65, Math.min(3.5, nextScale));
    stage.scale({ x: scale, y: scale });
    stage.position({
      x: pointer.x - mousePointTo.x * scale,
      y: pointer.y - mousePointTo.y * scale,
    });
    hideTooltip();
    stage.batchDraw();
  }

  stage.on('wheel', (event) => {
    event.evt.preventDefault();
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }
    zoomAt(pointer, stage.scaleX() * (event.evt.deltaY > 0 ? 0.92 : 1.08));
  });

  stage.on('mousemove', () => {
    const pointer = stage.getPointerPosition();
    if (!pointer || stage.isDragging()) {
      hideTooltip();
      return;
    }
    let node: Konva.Node | null = stage.getIntersection(pointer);
    let hint: string | undefined;
    while (node && node !== stage) {
      const value = node.getAttr('hint');
      if (typeof value === 'string') {
        hint = value;
        break;
      }
      node = node.getParent();
    }
    if (!hint) {
      hideTooltip();
      stage.container().style.cursor = 'grab';
      return;
    }
    const position = stage.getAbsoluteTransform().copy().invert().point(pointer);
    tooltip.position({ x: position.x + 13, y: position.y + 13 });
    tooltip.getText().text(hint);
    tooltip.show();
    tooltip.moveToTop();
    stage.container().style.cursor = 'help';
    layer.batchDraw();
  });
  stage.on('mouseleave dragstart', hideTooltip);
  stage.on('dragend', () => stage.batchDraw());

  return {
    reset() {
      stage.position({ x: 0, y: 0 });
      stage.scale({ x: 1, y: 1 });
      hideTooltip();
      stage.batchDraw();
    },
    zoomBy(factor: number) {
      zoomAt({ x: stage.width() / 2, y: stage.height() / 2 }, stage.scaleX() * factor);
    },
  };
}
