// src/utils/exportToDxf.ts
import { Node, Edge } from '@xyflow/react';
import { DeviceNodeData, CableEdgeData } from '../types/flowTypes';
import { getSmoothStepPath } from '@xyflow/react';

const toDxfY = (y: number, maxY: number) => maxY - y;

const generateOrthoPath = (
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
  sourcePos: any, targetPos: any
): string => {
  const [path] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    borderRadius: 0,
  });
  return path;
};

const parseSvgPathToSegments = (path: string): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const commands = path.match(/[MLC]\s*[\d.]+\s*[\d.]+/g) || [];
  commands.forEach(cmd => {
    const parts = cmd.match(/[\d.]+/g);
    if (parts && parts.length >= 2) {
      points.push({ x: parseFloat(parts[0]), y: parseFloat(parts[1]) });
    }
  });
  return points;
};

const mapColorToAci = (hex: string): number => {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  if (r === 37 && g === 99 && b === 235) return 5;   // #2563eb → синий
  if (r === 239 && g === 68 && b === 68) return 1;   // #ef4444 → красный
  if (r === 16 && g === 185 && b === 129) return 3;  // #10b981 → зелёный
  if (r === 0 && g === 0 && b === 0) return 7;       // чёрный
  if (r === 255 && g === 255 && b === 255) return 7; // белый
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  return brightness > 128 ? 7 : 0;
};

const generateDxfString = (
  nodes: Node<DeviceNodeData>[],
  edges: Edge<CableEdgeData>[]
): string => {
  const lines: string[] = [];
  let maxY = 0;
  nodes.forEach(n => {
    const h = (n.data.height as number) || 90;
    maxY = Math.max(maxY, n.position.y + h);
  });
  maxY += 100;

  // HEADER
  lines.push('0', 'SECTION', '2', 'HEADER');
  lines.push('9', '$ACADVER', '1', 'AC1021');
  lines.push('9', '$INSUNITS', '70', '4');
  lines.push('0', 'ENDSEC');

  // TABLES
  lines.push('0', 'SECTION', '2', 'TABLES');
  // VPORT
  lines.push('0', 'TABLE', '2', 'VPORT', '70', '1');
  lines.push('0', 'VPORT', '2', '*ACTIVE', '70', '0', '10', '0.0', '20', '0.0', '11', '1.0', '21', '1.0');
  lines.push('0', 'ENDTAB');
  // LTYPE
  lines.push('0', 'TABLE', '2', 'LTYPE', '70', '1');
  lines.push('0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0');
  lines.push('0', 'ENDTAB');
  // LAYER
  lines.push('0', 'TABLE', '2', 'LAYER', '70', '1');
  lines.push('0', 'LAYER', '2', '0', '70', '0', '62', '7', '6', 'CONTINUOUS');
  lines.push('0', 'ENDTAB');
  // STYLE
  lines.push('0', 'TABLE', '2', 'STYLE', '70', '1');
  lines.push('0', 'STYLE', '2', 'STANDARD', '70', '0', '40', '0.0', '41', '1.0', '50', '0.0', '71', '0', '42', '2.5', '3', 'txt', '4', '');
  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  // BLOCKS (пустая секция)
  lines.push('0', 'SECTION', '2', 'BLOCKS', '0', 'ENDSEC');

  // ENTITIES
  lines.push('0', 'SECTION', '2', 'ENTITIES');

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
      const maxRows = Math.max(sourceNode.data.inputs.length, sourceNode.data.outputs.length);
      const rowHeight = 22;
      const offsetY = (idx + 0.5) * rowHeight + 40;
      sourceY = sourceNode.position.y + offsetY;
      sourceX = sourceNode.position.x + ((sourceNode.data.width as number) || 90);
    } else {
      sourceX = sourceNode.position.x + ((sourceNode.data.width as number) || 90) / 2;
      sourceY = sourceNode.position.y + ((sourceNode.data.height as number) || 90) / 2;
    }

    if (targetInterface) {
      const idx = [...targetNode.data.inputs, ...targetNode.data.outputs].findIndex(i => i.id === targetHandleId);
      const maxRows = Math.max(targetNode.data.inputs.length, targetNode.data.outputs.length);
      const rowHeight = 22;
      const offsetY = (idx + 0.5) * rowHeight + 40;
      targetY = targetNode.position.y + offsetY;
      targetX = targetNode.position.x;
    } else {
      targetX = targetNode.position.x + ((targetNode.data.width as number) || 90) / 2;
      targetY = targetNode.position.y + ((targetNode.data.height as number) || 90) / 2;
    }

    const path = generateOrthoPath(
      sourceX, sourceY, targetX, targetY,
      sourceInterface ? 'right' : 'bottom',
      targetInterface ? 'left' : 'bottom'
    );
    const segments = parseSvgPathToSegments(path);

    const colorAci = mapColorToAci(edge.data?.edgeStrokeColor || '#2563eb');
    const width = edge.data?.edgeStrokeWidth || 2;

    for (let i = 0; i < segments.length - 1; i++) {
      const p1 = segments[i];
      const p2 = segments[i+1];
      lines.push('0', 'LINE', '8', '0');
      lines.push('10', p1.x.toFixed(4), '20', toDxfY(p1.y, maxY).toFixed(4), '30', '0.0');
      lines.push('11', p2.x.toFixed(4), '21', toDxfY(p2.y, maxY).toFixed(4), '31', '0.0');
      lines.push('62', colorAci.toString());
      lines.push('370', (width / 10).toFixed(1));
    }

    const labelPos = segments[Math.floor(segments.length / 2)];
    if (labelPos) {
      const text = edge.data?.labelText || edge.data?.cableType || 'Cable';
      lines.push('0', 'TEXT', '8', '0');
      lines.push('10', (labelPos.x + 5).toFixed(4), '20', toDxfY(labelPos.y - 10, maxY).toFixed(4), '30', '0.0');
      lines.push('40', '8.0');
      lines.push('1', text);
      lines.push('62', mapColorToAci(edge.data?.badgeTextColor || '#2563eb').toString());
    }
  });

  // --- Ноды ---
  nodes.forEach(node => {
    const w = (node.data.width as number) || 90;
    const h = (node.data.height as number) || 90;
    const x = node.position.x;
    const y = node.position.y;

    const pts = [[x,y], [x+w,y], [x+w,y+h], [x,y+h]];
    lines.push('0', 'POLYLINE', '8', '0', '66', '1', '70', '1');
    pts.forEach(([px, py]) => {
      lines.push('0', 'VERTEX', '8', '0');
      lines.push('10', px.toFixed(4), '20', toDxfY(py, maxY).toFixed(4), '30', '0.0');
    });
    lines.push('0', 'SEQEND', '8', '0');
    lines.push('62', mapColorToAci(node.data.color || '#2563eb').toString());
    lines.push('370', ((node.data.borderWidth || 1) / 10).toFixed(1));

    // Текст
    lines.push('0', 'TEXT', '8', '0');
    lines.push('10', (x + 5).toFixed(4), '20', toDxfY(y + 15, maxY).toFixed(4), '30', '0.0');
    lines.push('40', '10.0');
    lines.push('1', node.data.label);
    lines.push('62', '7');

    // Хендлы
    const rowHeight = 22;
    const maxRows = Math.max(node.data.inputs.length, node.data.outputs.length);
    node.data.inputs.forEach((_, idx) => {
      const offsetY = y + 40 + (idx + 0.5) * rowHeight;
      lines.push('0', 'CIRCLE', '8', '0');
      lines.push('10', (x - 8).toFixed(4), '20', toDxfY(offsetY, maxY).toFixed(4), '30', '0.0');
      lines.push('40', '3.0');
      lines.push('62', mapColorToAci(node.data.color || '#2563eb').toString());
    });
    node.data.outputs.forEach((_, idx) => {
      const offsetY = y + 40 + (idx + 0.5) * rowHeight;
      lines.push('0', 'CIRCLE', '8', '0');
      lines.push('10', (x + w + 8).toFixed(4), '20', toDxfY(offsetY, maxY).toFixed(4), '30', '0.0');
      lines.push('40', '3.0');
      lines.push('62', mapColorToAci(node.data.color || '#2563eb').toString());
    });
  });

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');

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
