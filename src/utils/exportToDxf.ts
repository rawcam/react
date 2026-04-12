// src/utils/exportToDxf.ts
import { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../types/flowTypes';

// Простая ручная генерация DXF (формат R12, совместим со всеми CAD)
const generateDxfString = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[]
): string => {
  const lines: string[] = [];

  // Заголовок DXF
  lines.push('0');
  lines.push('SECTION');
  lines.push('2');
  lines.push('ENTITIES');

  // Находим максимальный Y для инверсии оси
  let maxY = 0;
  nodes.forEach((node) => {
    const h = (node.data.height as number) || 90;
    maxY = Math.max(maxY, node.position.y + h);
  });
  maxY += 100;

  const toDxfY = (y: number) => maxY - y;

  // --- Рёбра (линии) ---
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const x1 = sourceNode.position.x + ((sourceNode.data.width as number) || 90) / 2;
    const y1 = sourceNode.position.y + ((sourceNode.data.height as number) || 90) / 2;
    const x2 = targetNode.position.x + ((targetNode.data.width as number) || 90) / 2;
    const y2 = targetNode.position.y + ((targetNode.data.height as number) || 90) / 2;

    lines.push('0');
    lines.push('LINE');
    lines.push('8'); // Слой 0
    lines.push('0');
    lines.push('10');
    lines.push(x1.toFixed(4));
    lines.push('20');
    lines.push(toDxfY(y1).toFixed(4));
    lines.push('30');
    lines.push('0.0');
    lines.push('11');
    lines.push(x2.toFixed(4));
    lines.push('21');
    lines.push(toDxfY(y2).toFixed(4));
    lines.push('31');
    lines.push('0.0');
  });

  // --- Ноды (прямоугольники и текст) ---
  nodes.forEach((node) => {
    const w = (node.data.width as number) || 90;
    const h = (node.data.height as number) || 90;
    const x = node.position.x;
    const y = node.position.y;

    const pts = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];

    // Полилиния (замкнутая)
    lines.push('0');
    lines.push('POLYLINE');
    lines.push('8');
    lines.push('0');
    lines.push('66');
    lines.push('1');
    lines.push('70');
    lines.push('1'); // замкнутая

    pts.forEach(([px, py]) => {
      lines.push('0');
      lines.push('VERTEX');
      lines.push('8');
      lines.push('0');
      lines.push('10');
      lines.push(px.toFixed(4));
      lines.push('20');
      lines.push(toDxfY(py).toFixed(4));
      lines.push('30');
      lines.push('0.0');
    });

    lines.push('0');
    lines.push('SEQEND');
    lines.push('8');
    lines.push('0');

    // Текст метки
    const textX = x + 5;
    const textY = y + 15;
    lines.push('0');
    lines.push('TEXT');
    lines.push('8');
    lines.push('0');
    lines.push('10');
    lines.push(textX.toFixed(4));
    lines.push('20');
    lines.push(toDxfY(textY).toFixed(4));
    lines.push('30');
    lines.push('0.0');
    lines.push('40');
    lines.push('10.0'); // высота текста
    lines.push('1');
    lines.push(node.data.label);
  });

  // Завершение
  lines.push('0');
  lines.push('ENDSEC');
  lines.push('0');
  lines.push('EOF');

  return lines.join('\n');
};

export const exportToDxf = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[],
  filename: string = 'sputnik-scheme'
) => {
  const dxfString = generateDxfString(nodes, edges);
  const blob = new Blob([dxfString], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.dxf`;
  a.click();
  URL.revokeObjectURL(url);
};
