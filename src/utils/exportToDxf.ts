// src/utils/exportToDxf.ts
import { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../types/flowTypes';
import { getSmoothStepPath, Position } from '@xyflow/react';
import { DxfWriter } from 'dxf'; // <-- Именованный импорт

// Преобразование координат (инверсия Y)
const toDxfY = (y: number, maxY: number) => maxY - y;

type HandlePosition = Position.Left | Position.Right | Position.Top | Position.Bottom;

// Генерация ортогонального пути (возвращает массив точек [x, y])
const generateOrthoPoints = (
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
  sourcePos: HandlePosition,
  targetPos: HandlePosition
): [number, number][] => {
  const [path] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    borderRadius: 8,
  });
  const points: [number, number][] = [];
  const commands = path.match(/[MLC]\s*[\d.]+\s*[\d.]+/g) || [];
  commands.forEach(cmd => {
    const parts = cmd.match(/[\d.]+/g);
    if (parts && parts.length >= 2) {
      points.push([parseFloat(parts[0]), parseFloat(parts[1])]);
    }
  });
  return points;
};

// Маппинг HEX → AutoCAD Color Index (ACI)
const mapColorToAci = (hex: string): number => {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  
  if (r === 37 && g === 99 && b === 235) return 5;
  if (r === 239 && g === 68 && b === 68) return 1;
  if (r === 16 && g === 185 && b === 129) return 3;
  if (r === 0 && g === 0 && b === 0) return 7;
  if (r === 255 && g === 255 && b === 255) return 7;
  
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  return Math.max(1, Math.min(255, Math.round(brightness / 255 * 254) + 1));
};

export const exportToDxf = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[],
  filename: string = 'sputnik-scheme'
) => {
  try {
    // Определяем максимальный Y для инверсии
    let maxY = 0;
    nodes.forEach(n => {
      const h = (n.data.height as number) || 90;
      maxY = Math.max(maxY, n.position.y + h);
    });
    maxY += 100;

    const dxf = new DxfWriter();
    
    // Устанавливаем единицы и кодировку
    dxf.setUnits('mm');
    // В библиотеке dxf setVariable принимает имя и значение
    dxf.setVariable('$DWGCODEPAGE', 'ANSI_1251');

    // Добавляем слой по умолчанию
    dxf.addLayer('0', 7, 'CONTINUOUS');

    // --- Рёбра ---
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const sourceHandleId = edge.sourceHandle;
      const targetHandleId = edge.targetHandle;

      let sourceX = sourceNode.position.x;
      let sourceY = sourceNode.position.y;
      let targetX = targetNode.position.x;
      let targetY = targetNode.position.y;

      const sourceInterface = sourceHandleId
        ? [...sourceNode.data.inputs, ...sourceNode.data.outputs].find(i => i.id === sourceHandleId)
        : null;
      const targetInterface = targetHandleId
        ? [...targetNode.data.inputs, ...targetNode.data.outputs].find(i => i.id === targetHandleId)
        : null;

      if (sourceInterface) {
        const idx = [...sourceNode.data.inputs, ...sourceNode.data.outputs].findIndex(i => i.id === sourceHandleId);
        const rowHeight = sourceNode.data.rowHeight || 22;
        const offsetY = (idx + 0.5) * rowHeight + 40;
        sourceY = sourceNode.position.y + offsetY;
        sourceX = sourceNode.position.x + ((sourceNode.data.width as number) || 90);
      } else {
        sourceX = sourceNode.position.x + ((sourceNode.data.width as number) || 90) / 2;
        sourceY = sourceNode.position.y + ((sourceNode.data.height as number) || 90) / 2;
      }

      if (targetInterface) {
        const idx = [...targetNode.data.inputs, ...targetNode.data.outputs].findIndex(i => i.id === targetHandleId);
        const rowHeight = targetNode.data.rowHeight || 22;
        const offsetY = (idx + 0.5) * rowHeight + 40;
        targetY = targetNode.position.y + offsetY;
        targetX = targetNode.position.x;
      } else {
        targetX = targetNode.position.x + ((targetNode.data.width as number) || 90) / 2;
        targetY = targetNode.position.y + ((targetNode.data.height as number) || 90) / 2;
      }

      const points = generateOrthoPoints(
        sourceX, sourceY, targetX, targetY,
        sourceInterface ? Position.Right : Position.Bottom,
        targetInterface ? Position.Left : Position.Bottom
      );

      const colorAci = mapColorToAci(edge.data?.edgeStrokeColor || '#2563eb');
      const width = edge.data?.edgeStrokeWidth || 2;

      if (points.length >= 2) {
        const dxfPoints = points.map(p => ({ x: p[0], y: toDxfY(p[1], maxY) }));
        dxf.drawPolyline(dxfPoints, { color: colorAci, lineweight: width / 10 });
      } else {
        console.warn('Пропущено ребро без точек пути:', edge.id);
      }

      // Бейдж (тип кабеля) — по желанию
      if (!edge.data?.hideMainBadge && points.length > 0) {
        const midIdx = Math.floor(points.length / 2);
        const [midX, midY] = points[midIdx];
        const text = edge.data?.labelText || edge.data?.cableType || 'Cable';
        dxf.drawText(midX + 5, toDxfY(midY - 10, maxY), 8, text, {
          color: mapColorToAci(edge.data?.badgeTextColor || '#2563eb'),
        });
      }
    });

    // --- Ноды ---
    nodes.forEach(node => {
      const w = (node.data.width as number) || 90;
      const h = (node.data.height as number) || 90;
      const x = node.position.x;
      const y = node.position.y;

      // Рамка ноды
      const pts = [
        { x, y: toDxfY(y, maxY) },
        { x: x + w, y: toDxfY(y, maxY) },
        { x: x + w, y: toDxfY(y + h, maxY) },
        { x, y: toDxfY(y + h, maxY) },
      ];
      dxf.drawPolyline(pts, {
        color: mapColorToAci(node.data.color || '#2563eb'),
        lineweight: (node.data.borderWidth || 1) / 10,
        close: true,
      });

      // Текст метки ноды
      dxf.drawText(x + 5, toDxfY(y + 15, maxY), 10, node.data.label, {
        color: 7,
      });

      // Хендлы
      const rowHeight = node.data.rowHeight || 22;
      node.data.inputs.forEach((_, idx) => {
        const offsetY = y + 40 + (idx + 0.5) * rowHeight;
        dxf.drawCircle(x - 8, toDxfY(offsetY, maxY), 3, {
          color: mapColorToAci(node.data.color || '#2563eb'),
        });
      });
      node.data.outputs.forEach((_, idx) => {
        const offsetY = y + 40 + (idx + 0.5) * rowHeight;
        dxf.drawCircle(x + w + 8, toDxfY(offsetY, maxY), 3, {
          color: mapColorToAci(node.data.color || '#2563eb'),
        });
      });
    });

    const dxfString = dxf.toString();
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ DXF успешно сгенерирован');
  } catch (error) {
    console.error('❌ Ошибка в exportToDxf:', error);
    alert('Ошибка при создании DXF: ' + (error as Error).message);
  }
};
