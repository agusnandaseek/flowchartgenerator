import React, { memo } from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
  Position,
} from '@xyflow/react';

export interface JunctionArrow {
  x: number;
  y: number;
  angle: number;
  color?: string;
}

export const FlowchartEdge: React.FC<EdgeProps> = memo((props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    label,
    labelStyle,
    labelShowBg = true,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius = 3,
    style,
    markerEnd,
    markerStart,
    interactionWidth,
    data,
    type,
  } = props;

  const isStraight = type === 'straight';
  const borderRadius = type === 'step' ? 0 : 5;

  const [edgePath, labelX, labelY] = isStraight
    ? getStraightPath({ sourceX, sourceY, targetX, targetY })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius,
      });

  const junctionArrows = (data?.junctionArrows as JunctionArrow[]) || [];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        labelX={labelX}
        labelY={labelY}
        label={label}
        labelStyle={labelStyle}
        labelShowBg={labelShowBg}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
      />
      {junctionArrows.map((arrow, idx) => {
        const arrowColor = arrow.color || (style?.stroke as string) || '#64748b';
        return (
          <g
            key={`junction-arrow-${id}-${idx}`}
            transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angle})`}
            style={{ pointerEvents: 'none' }}
          >
            <polygon
              points="0,0 -10,-4.5 -8,0 -10,4.5"
              fill={arrowColor}
              stroke={arrowColor}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </>
  );
});

FlowchartEdge.displayName = 'FlowchartEdge';
