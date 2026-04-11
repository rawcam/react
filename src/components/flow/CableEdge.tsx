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

  const badgeFontSize = d.badgeFontSize ?? 10;
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

  // Вычисляем позиции для меток у концов (приблизительно)
  const sourceLabelX = sourceX + (targetX - sourceX) * 0.1;
  const sourceLabelY = sourceY + (targetY - sourceY) * 0.1;
  const targetLabelX = sourceX + (targetX - sourceX) * 0.9;
  const targetLabelY = sourceY + (targetY - sourceY) * 0.9;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerEnd={markerEnd} markerStart={markerStart} />
      <EdgeLabelRenderer>
        {/* Основной бейдж */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: badgeFontSize,
            fontWeight: 500,
            color: badgeTextColor,
            background: badgeBackgroundColor,
            border: `${badgeBorderWidth}px solid ${badgeBorderColor}`,
            borderRadius: badgeBorderRadius,
            padding: '2px 8px',
            pointerEvents: 'all',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          {displayLabel}
        </div>

        {/* Метка у источника */}
        {sourceLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceLabelX}px,${sourceLabelY}px)`,
              fontSize: badgeFontSize * 0.9,
              fontWeight: 500,
              color: badgeTextColor,
              background: badgeBackgroundColor,
              border: `${badgeBorderWidth}px solid ${badgeBorderColor}`,
              borderRadius: badgeBorderRadius,
              padding: '2px 6px',
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              zIndex: 10,
            }}
            className="nodrag nopan"
          >
            {sourceLabel}
          </div>
        )}

        {/* Метка у приёмника */}
        {targetLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${targetLabelX}px,${targetLabelY}px)`,
              fontSize: badgeFontSize * 0.9,
              fontWeight: 500,
              color: badgeTextColor,
              background: badgeBackgroundColor,
              border: `${badgeBorderWidth}px solid ${badgeBorderColor}`,
              borderRadius: badgeBorderRadius,
              padding: '2px 6px',
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              zIndex: 10,
            }}
            className="nodrag nopan"
          >
            {targetLabel}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CableEdge;
