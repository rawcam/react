import { FC } from 'react';
import {
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { CableEdgeData } from '../../types/flowTypes';

const CableEdge: FC<any> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
  markerEnd,
  markerStart,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const d = (data || {}) as CableEdgeData;

  const badgeFontSize = d.badgeFontSize ?? 6;
  const badgeTextColor = d.badgeTextColor ?? '#2563eb';
  const badgeBorderColor = d.badgeBorderColor ?? '#2563eb';
  const badgeBorderWidth = d.badgeBorderWidth ?? 1;
  const badgeBorderRadius = d.badgeBorderRadius ?? 12;
  const badgeBackgroundColor = d.badgeBackgroundColor ?? 'var(--bg-panel, white)';
  const edgeStrokeWidth = d.edgeStrokeWidth ?? 2;
  const sourceLabel = d.sourceLabelText || d.sourceLabel?.split(':')[1]?.trim() || '';
  const targetLabel = d.targetLabelText || d.targetLabel?.split(':')[1]?.trim() || '';

  const displayLabel = d.labelText?.trim()
    ? d.labelText
    : d.adapter
      ? `${d.cableType} (${d.adapter})`
      : d.cableType || 'Cable';

  const edgeStyle = {
    stroke: selected ? '#ef4444' : '#2563eb',
    strokeWidth: edgeStrokeWidth,
    ...(style as React.CSSProperties),
  };

  // Функция для получения координат на пути с заданным отступом от начала/конца
  const getPointAtDistanceFromStart = (path: string, distance: number) => {
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);
    tempSvg.appendChild(pathEl);
    const totalLength = pathEl.getTotalLength();
    const point = pathEl.getPointAtLength(Math.min(distance, totalLength));
    return { x: point.x, y: point.y };
  };

  const getPointAtDistanceFromEnd = (path: string, distance: number) => {
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);
    tempSvg.appendChild(pathEl);
    const totalLength = pathEl.getTotalLength();
    const point = pathEl.getPointAtLength(Math.max(0, totalLength - distance));
    return { x: point.x, y: point.y };
  };

  const markerOffset = 15; // фиксированные 15px от ноды
  const sourcePos = getPointAtDistanceFromStart(edgePath, markerOffset);
  const targetPos = getPointAtDistanceFromEnd(edgePath, markerOffset);

  // Стиль для маркировок (компактный)
  const markerStyle: React.CSSProperties = {
    fontSize: badgeFontSize * 0.85,
    padding: '1px 4px',
    background: badgeBackgroundColor,
    border: `${badgeBorderWidth}px solid ${badgeBorderColor}`,
    borderRadius: badgeBorderRadius,
    color: badgeTextColor,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    pointerEvents: 'all',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
  };

  // Стиль для основного бейджа (залитый цветом)
  const mainBadgeStyle: React.CSSProperties = {
    fontSize: badgeFontSize,
    padding: '2px 6px',
    background: badgeTextColor,
    color: 'white',
    border: 'none',
    borderRadius: badgeBorderRadius,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    pointerEvents: 'all',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerEnd={markerEnd} markerStart={markerStart} />
      <EdgeLabelRenderer>
        {sourceLabel && (
          <div
            style={{
              ...markerStyle,
              left: sourcePos.x,
              top: sourcePos.y,
            }}
            className="nodrag nopan"
          >
            {sourceLabel}
          </div>
        )}
        {targetLabel && (
          <div
            style={{
              ...markerStyle,
              left: targetPos.x,
              top: targetPos.y,
            }}
            className="nodrag nopan"
          >
            {targetLabel}
          </div>
        )}
        <div
          style={{
            ...mainBadgeStyle,
            left: labelX,
            top: labelY,
          }}
          className="nodrag nopan"
        >
          {displayLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CableEdge;
