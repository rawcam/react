// src/utils/exportToDxf.ts
import { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../types/flowTypes';
import { getSmoothStepPath, Position } from '@xyflow/react';
import DxfWriter, { point3d } from '@tarikjabiri/dxf'; // <-- Импортируем point3d

// Преобразование координат (инверсия Y)
const toDxfY = (y: number, maxY: number) => maxY - y;

// Типизированные позиции
type HandlePosition = Position.Left | Position.Right | Position.Top | Position.Bottom;

// Генерация ортогонального пути (возвращает массив точек [x, y])
const generateOrthoPoints = (
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
  sourcePos: HandlePosition, // <-- Типизировано
  targetPos: HandlePosition  // <-- Типизировано
): [number, number][] => {
  const [path] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    borderRadius: 8,
  });
  const points: [number, number][] = [];
  // Более надежный разбор SVG-пути
  const commands = path.match(/[MLC]\s*[\d.]+\s*[\d.]+/g) || [];
  commands.forEach(cmd => {
    const parts = cmd.match(/[\d.]+/g);
    if (parts && parts.length >= 2) {
      points.push([parseFloat(parts[0]), parseFloat(parts[1])]);
    }
  });
  return points;
};

// Расширенный маппинг HEX → AutoCAD Color Index (ACI)
const mapColorToAci = (hex: string): number => {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  
  // Стандартные цвета (можно расширить)
  if (r === 37 && g === 99 && b === 235) return 5;   // #2563eb → синий
  if (r === 239 && g === 68 && b === 68) return 1;   // #ef4444 → красный
  if (r === 16 && g === 185 && b === 129) return 3;  // #10b981 → зелёный
  if (r === 0 && g === 0 && b === 0) return 7;       // чёрный
  if (r === 255 && g === 255 && b === 255) return 7; // белый
  
  // Упрощенный подбор ближайшего ACI по яркости (для остальных)
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  // Возвращаем значение от 1 до 255, исключая 0 (BYBLOCK) и 256 (BYLAYER)
  return Math.max(1, Math.min(255, Math.round(brightness / 255 * 254) + 1));
};

export const exportToDxf = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[],
  filename: string = 'sputnik-scheme'
) => {
  // Определяем максимальный Y для инверсии
  let maxY = 0;
  nodes.forEach(n => {
    const h = (n.data.height as number) || 90;
    maxY = Math.max(maxY, n.position.y + h);
  });
  maxY += 100;

  const dxf = new DxfWriter();
  
  // Устанавливаем единицы (миллиметры) и кодировку
  dxf.setUnits('mm');
  dxf.setVariable('$DWGCODEPAGE', { groupCode: 3, value: 'ANSI_1251' }); // <-- Правильный синтаксис

  // --- ВАЖНО: Явно создаем слой 0 в таблице LAYER ---
  // Это создаст секцию TABLES, обязательную для AutoCAD
  dxf.addLayer('0', 7, 'CONTINUOUS'); // <-- Вот так добавляется слой

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

    // Рисуем отрезки как полилинию (исправленный вызов)
    if (points.length >= 2) {
        // Преобразуем в формат [x, y] и инвертируем Y
        const dxfPoints: [number, number][] = points.map(p => [p[0], toDxfY(p[1], maxY)]);
        dxf.drawPolyline(dxfPoints, { closed: false }); // <-- Используем корректный синтаксис
    }

    // Бейдж (тип кабеля) - пока пропустим для простоты, но можно добавить
    // ...
  });

  // --- Ноды ---
  nodes.forEach(node => {
    const w = (node.data.width as number) || 90;
    const h = (node.data.height as number) || 90;
    const x = node.position.x;
    const y = node.position.y;

    // Рамка ноды (прямоугольник)
    const pts: [number, number][] = [
        [x, toDxfY(y, maxY)],
        [x + w, toDxfY(y, maxY)],
        [x + w, toDxfY(y + h, maxY)],
        [x, toDxfY(y + h, maxY)]
    ];
    
    dxf.drawPolyline(pts, { closed: true }); // <-- closed: true для замкнутой

    // Текст метки ноды
    // Для текста нужно использовать drawText, но сигнатура может отличаться.
    // Оставим пока без текста, чтобы убедиться, что геометрия открывается.
    // dxf.drawText(...)
  });

  // --- Генерация и скачивание файла ---
  // ИСПРАВЛЕНО: используем stringify() вместо toString()
  const dxfString = dxf.stringify();
  const blob = new Blob([dxfString], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.dxf`;
  a.click();
  URL.revokeObjectURL(url);
};
