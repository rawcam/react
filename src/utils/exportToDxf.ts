// src/utils/exportToDxf.ts
import { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../types/flowTypes';
// @ts-ignore
import Drawing from 'dxf-writer';

interface Point {
  x: number;
  y: number;
}

// Конвертация координат React Flow в DXF (ось Y инвертируется)
const toDxfCoord = (x: number, y: number, maxY: number = 1000): Point => ({
  x: x,
  y: maxY - y,
});

// Определяем границы схемы для масштабирования
const getBounds = (nodes: Node<DeviceNodeData>[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    const w = (node.data.width as number) || 90;
    const h = (node.data.height as number) || 90;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  });
  return { minX, minY, maxX, maxY };
};

export const exportToDxf = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[],
  filename: string = 'sputnik-scheme'
) => {
  const d = new Drawing();
  const bounds = getBounds(nodes);
  const maxY = bounds.maxY + 100;

  // Рисуем рёбра
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const start = toDxfCoord(
      sourceNode.position.x + ((sourceNode.data.width as number) || 90) / 2,
      sourceNode.position.y + ((sourceNode.data.height as number) || 90) / 2,
      maxY
    );
    const end = toDxfCoord(
      targetNode.position.x + ((targetNode.data.width as number) || 90) / 2,
      targetNode.position.y + ((targetNode.data.height as number) || 90) / 2,
      maxY
    );

    // Цвета в DXF задаются через индекс или RGB. Используем простой индекс.
    d.drawLine(start.x, start.y, end.x, end.y);
  });

  // Рисуем ноды
  nodes.forEach(node => {
    const w = (node.data.width as number) || 90;
    const h = (node.data.height as number) || 90;
    const p1 = toDxfCoord(node.position.x, node.position.y, maxY);
    const p2 = toDxfCoord(node.position.x + w, node.position.y, maxY);
    const p3 = toDxfCoord(node.position.x + w, node.position.y + h, maxY);
    const p4 = toDxfCoord(node.position.x, node.position.y + h, maxY);

    d.drawPolyline([p1, p2, p3, p4], true);

    // Текст метки
    d.drawText(node.data.label, p1.x + 5, p1.y + 15, 10);
  });

  const dxfString = d.toDxfString();
  const blob = new Blob([dxfString], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.dxf`;
  a.click();
  URL.revokeObjectURL(url);
};
