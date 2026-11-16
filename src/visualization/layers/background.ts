import Konva from 'konva';
import type { ViewBox } from '../drawCrossSection';

export function drawBackground(layer: Konva.Layer, views: ViewBox[], stacked: boolean): void {
  layer.destroyChildren();
  const width = Math.max(...views.map((view) => view.x + view.width));
  const height = Math.max(...views.map((view) => view.y + view.height));

  layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: '#f8fafb', listening: false }));
  for (let x = 0; x <= width; x += 24) {
    layer.add(new Konva.Line({
      points: [x, 0, x, height], stroke: '#dfe6ea', strokeWidth: 0.5, opacity: 0.52, listening: false,
    }));
  }
  for (let y = 0; y <= height; y += 24) {
    layer.add(new Konva.Line({
      points: [0, y, width, y], stroke: '#dfe6ea', strokeWidth: 0.5, opacity: 0.52, listening: false,
    }));
  }

  views.forEach((view, index) => {
    layer.add(new Konva.Rect({
      x: view.x,
      y: view.y,
      width: view.width,
      height: view.height,
      fill: '#ffffff',
      stroke: '#d3dfe5',
      strokeWidth: 1,
      listening: false,
    }));
    layer.add(new Konva.Text({
      x: view.x + 16,
      y: view.y + 13,
      text: index === 0 ? '01  横截面  ·  等比例' : '02  纵剖面 / 端部示意',
      fontSize: 12,
      fontStyle: 'bold',
      fill: '#2e5367',
      listening: false,
    }));
    layer.add(new Konva.Text({
      x: view.x + 16,
      y: view.y + 32,
      text: index === 0 ? 'CROSS SECTION / mm' : '纵向示意比例 / mm',
      fontSize: 9,
      fill: '#82939e',
      listening: false,
    }));
  });

  if (!stacked && views[1]) {
    layer.add(new Konva.Line({
      points: [views[1].x - 7, views[1].y + 8, views[1].x - 7, views[1].y + views[1].height - 8],
      stroke: '#bacbd4',
      strokeWidth: 1,
      listening: false,
    }));
  }
  layer.batchDraw();
}
