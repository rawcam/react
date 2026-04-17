// src/components/flow/CableEdge.tsx
import { FC } from 'react';
import {
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
} from '@xyflow/react';
import { CableEdgeData } from '../../types/flowTypes';

const CableEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
  markerStart,
}) => {
  const d = (data || {}) as CableEdgeData;
  const borderRadius = d.edgeBorderRadius ?? 8;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius,
  });

  // Основной бейдж
  const badgeFontSize = d.badgeFontSize ?? 6;
  const badgeTextColor = d.badgeTextColor ?? '#2563eb';
  const badgeBorderRadius = d.badgeBorderRadius ?? 12;

  // Маркировки
  const markerFontSize = d.markerFontSize ?? 5;
  const markerTextColor = d.markerTextColor ?? '#2563eb';
  const markerBorderColor = d.markerBorderColor ?? '#2563eb';
  const markerBorderWidth = d.markerBorderWidth ?? 1;
  const markerBorderRadius = d.markerBorderRadius ?? 8;
  const markerBackgroundColor = d.markerBackgroundColor ?? '#ffffff';

  const sourceLabel = d.sourceLabelText || d.sourceLabel?.split(':')[1]?.trim() || '';
  const targetLabel = d.targetLabelText || d.targetLabel?.split(':')[1]?.trim() || '';

  const displayLabel = d.labelText?.trim()
    ? d.labelText
    : d.adapter
      ? `${d.cableType} (${d.adapter})`
      : d.cableType || 'Cable';

  const hideMainBadge = d.hideMainBadge ?? false;
  const hideMarkers = d.hideMarkers ?? false;

  const edgeStyle = {
    ...(style as React.CSSProperties),
  };

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

  const markerOffset = 15;
  const sourcePos = getPointAtDistanceFromStart(edgePath, markerOffset);
  const targetPos = getPointAtDistanceFromEnd(edgePath, markerOffset);

  const markerStyle: React.CSSProperties = {
    fontSize: markerFontSize,
    padding: '1px 4px',
    background: markerBackgroundColor,
    border: `${markerBorderWidth}px solid ${markerBorderColor}`,
    borderRadius: markerBorderRadius,
    color: markerTextColor,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    pointerEvents: 'all',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      <EdgeLabelRenderer>
        {!hideMarkers && sourceLabel && (
          <div style={{ ...markerStyle, left: sourcePos.x, top: sourcePos.y }} className="nodrag nopan">
            {sourceLabel}
          </div>
        )}
        {!hideMarkers && targetLabel && (
          <div style={{ ...markerStyle, left: targetPos.x, top: targetPos.y }} className="nodrag nopan">
            {targetLabel}
          </div>
        )}
        {!hideMainBadge && (
          <div style={{ ...mainBadgeStyle, left: labelX, top: labelY }} className="nodrag nopan">
            {displayLabel}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CableEdge;
