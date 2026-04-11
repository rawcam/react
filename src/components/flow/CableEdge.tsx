import { FC } from 'react';
import {
  getSmoothStepPath,
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { CableEdgeData } from '../../types/flowTypes';

const CableEdge: FC<EdgeProps<CableEdgeData>> = ({
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

  const badgeFontSize = data?.badgeFontSize ?? 10;
  const badgeTextColor = data?.badgeTextColor ?? '#2563eb';
  const badgeBorderColor = data?.badgeBorderColor ?? '#2563eb';
  const badgeBorderWidth = data?.badgeBorderWidth ?? 1;
  const badgeBorderRadius = data?.badgeBorderRadius ?? 12;
  const badgeBackgroundColor = data?.badgeBackgroundColor ?? 'var(--bg-panel, white)';

  const displayLabel = data?.labelText?.trim()
    ? data.labelText
    : data?.adapter
      ? `${data.cableType} (${data.adapter})`
      : data?.cableType || 'Cable';

  const edgeStyle = {
    stroke: selected ? '#ef4444' : '#2563eb',
    strokeWidth: 2,
    ...(style as React.CSSProperties),
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerEnd={markerEnd} markerStart={markerStart} />
      <EdgeLabelRenderer>
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
      </EdgeLabelRenderer>
    </>
  );
};

export default CableEdge;
