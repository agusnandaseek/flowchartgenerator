import { memo } from 'react';
import type { EdgeProps } from '@xyflow/react';
import type { StructureEdgeData, StructureCouple } from '../types/structureChart';

interface CoupleSlot {
  t: number;
  side: 1 | -1;
}

function getCoupleSlots(count: number, dx: number): CoupleSlot[] {
  if (count === 0) return [];

  // Right-slanted branch (dx > 30): place all couples on outer/upper side (side = 1)
  if (dx > 30) {
    if (count === 1) return [{ t: 0.52, side: 1 }];
    if (count === 2) return [{ t: 0.38, side: 1 }, { t: 0.64, side: 1 }];
    if (count === 3) return [{ t: 0.30, side: 1 }, { t: 0.50, side: 1 }, { t: 0.70, side: 1 }];
    return Array.from({ length: count }, (_, i) => ({
      t: 0.28 + (i / (count - 1)) * 0.48,
      side: 1 as const,
    }));
  }

  // Left-slanted branch (dx < -30): place all couples on outer/upper side (side = -1)
  if (dx < -30) {
    if (count === 1) return [{ t: 0.52, side: -1 }];
    if (count === 2) return [{ t: 0.38, side: -1 }, { t: 0.64, side: -1 }];
    if (count === 3) return [{ t: 0.30, side: -1 }, { t: 0.50, side: -1 }, { t: 0.70, side: -1 }];
    return Array.from({ length: count }, (_, i) => ({
      t: 0.28 + (i / (count - 1)) * 0.48,
      side: -1 as const,
    }));
  }

  // Vertical branch (|dx| <= 30): alternate left and right with comfortable spacing
  if (count === 1) return [{ t: 0.52, side: 1 }];
  if (count === 2) return [{ t: 0.40, side: -1 }, { t: 0.60, side: 1 }];
  if (count === 3) {
    return [
      { t: 0.34, side: -1 },
      { t: 0.52, side: 1 },
      { t: 0.70, side: -1 },
    ];
  }
  return Array.from({ length: count }, (_, i) => ({
    t: 0.28 + (i / (count - 1)) * 0.48,
    side: (i % 2 === 0 ? -1 : 1) as 1 | -1,
  }));
}

export const StructureEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    selected,
  }: EdgeProps) => {
    const edgeData = data as unknown as StructureEdgeData;
    const isConditional = !!edgeData?.isConditional;
    const isLoop = !!edgeData?.isLoop;
    const couples: StructureCouple[] = edgeData?.couples || [];
    const childIndex = typeof edgeData?.childIndex === 'number' ? edgeData.childIndex : 0;
    const siblingCount = typeof edgeData?.siblingCount === 'number' ? edgeData.siblingCount : 1;
    const sourceWidth = typeof edgeData?.sourceWidth === 'number' ? edgeData.sourceWidth : 180;

    const condGroupId = edgeData?.condGroupId;
    const groupStartIndex = edgeData?.groupStartIndex;
    const groupEndIndex = edgeData?.groupEndIndex;
    const isGroupLeader = edgeData?.isGroupLeader ?? true;

    // Distribute branch start points along parent module's bottom border
    // If edges belong to a condition group, they share the single apex diamond
    let startX = sourceX;
    if (condGroupId && typeof groupStartIndex === 'number' && typeof groupEndIndex === 'number') {
      const margin = 26;
      const usableWidth = Math.max(50, sourceWidth - margin * 2);
      const step = siblingCount > 1 ? usableWidth / (siblingCount - 1) : 0;
      const offsetStart = -usableWidth / 2 + groupStartIndex * step;
      const offsetEnd = -usableWidth / 2 + groupEndIndex * step;
      const groupOffset = (offsetStart + offsetEnd) / 2;
      startX = Math.round(sourceX + groupOffset);
    } else if (siblingCount > 1) {
      const margin = 26; // Keep 26px margin from left and right edges of parent module
      const usableWidth = Math.max(50, sourceWidth - margin * 2);
      const step = usableWidth / (siblingCount - 1);
      const offset = -usableWidth / 2 + childIndex * step;
      startX = Math.round(sourceX + offset);
    }

    // If conditional, the diamond sits at (startX, sourceY)
    // and the calling line starts from the bottom tip of the diamond
    const diamondHeight = 16;
    const lineStartX = startX;
    const lineStartY = isConditional ? sourceY + diamondHeight : sourceY;
    const lineEndX = targetX;
    const lineEndY = targetY;

    // Geometry calculations along calling line
    const dx = lineEndX - lineStartX;
    const dy = lineEndY - lineStartY;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Base normal vector: for lines pointing downward (uy >= 0),
    // (uy, -ux) points toward screen East / Right (+X direction)
    const baseEastX = uy >= 0 ? uy : -uy;
    const baseEastY = uy >= 0 ? -ux : ux;

    // Main connection line path: straight line connecting parent to child
    const path = `M ${lineStartX} ${lineStartY} L ${lineEndX} ${lineEndY}`;

    // Loop position (around 28% down the line)
    const loopT = 0.28;
    const loopX = lineStartX + dx * loopT;
    const loopY = lineStartY + dy * loopT;

    // Couple slots distribution
    const slots = getCoupleSlots(couples.length, dx);

    // Only render diamond if conditional, and for grouped conditions only the group leader renders it
    const shouldRenderDiamond = isConditional && (!condGroupId || isGroupLeader);

    return (
      <g className="react-flow__edge">
        {/* Main calling line */}
        <path
          id={id}
          className="react-flow__edge-path"
          d={path}
          stroke={selected ? '#2563eb' : '#1d4ed8'}
          strokeWidth={selected ? 2.5 : 2}
          fill="none"
        />

        {/* 1. Conditional Line: Solid Diamond at parent bottom junction */}
        {shouldRenderDiamond && (
          <polygon
            points={`
              ${startX},${sourceY} 
              ${startX + 8},${sourceY + 8} 
              ${startX},${sourceY + 16} 
              ${startX - 8},${sourceY + 8}
            `}
            fill="#1d4ed8"
            stroke="#1d4ed8"
            strokeWidth={1}
            className="filter drop-shadow-xs"
          />
        )}

        {/* 2. Loop Symbol: Curved Arrow looping around the line */}
        {isLoop && (
          <g transform={`translate(${loopX}, ${loopY}) rotate(${angleDeg})`}>
            {/* Curved semi-loop arc looping across line */}
            <path
              d="M 6 -14 C 18 -12, 16 14, 0 15 C -14 16, -14 -4, 2 -8"
              fill="none"
              stroke="#1d4ed8"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Arrowhead pointing along the loop */}
            <polygon
              points="2,-8 -4,-13 -2,-5"
              fill="#1d4ed8"
            />
          </g>
        )}

        {/* 3. Data Couples & Control Couples */}
        {couples.map((couple, index) => {
          const slot = slots[index] || { t: 0.5, side: 1 };
          
          // Center point along calling line at t
          const centerPosX = lineStartX + dx * slot.t;
          const centerPosY = lineStartY + dy * slot.t;

          // Normal direction vector for this couple:
          // side = 1 -> screen East / Right
          // side = -1 -> screen West / Left
          const perpX = baseEastX * slot.side;
          const perpY = baseEastY * slot.side;

          // 1) Position Arrow parallel to calling line
          const dArrow = 24;
          const arrowCenterX = centerPosX + perpX * dArrow;
          const arrowCenterY = centerPosY + perpY * dArrow;

          const shaftLength = 26;
          const isDown = couple.direction === 'down'; // IN (down towards child) vs OUT (up towards parent)
          const dirSign = isDown ? 1 : -1;

          // Tail and Head coordinates for arrow
          const tailX = arrowCenterX - (ux * (shaftLength / 2)) * dirSign;
          const tailY = arrowCenterY - (uy * (shaftLength / 2)) * dirSign;
          const headX = arrowCenterX + (ux * (shaftLength / 2)) * dirSign;
          const headY = arrowCenterY + (uy * (shaftLength / 2)) * dirSign;

          // Arrowhead points
          const arrowAngle = Math.atan2(headY - tailY, headX - tailX);
          const arrowLen = 6;
          const p1x = headX - arrowLen * Math.cos(arrowAngle - Math.PI / 6);
          const p1y = headY - arrowLen * Math.sin(arrowAngle - Math.PI / 6);
          const p2x = headX - arrowLen * Math.cos(arrowAngle + Math.PI / 6);
          const p2y = headY - arrowLen * Math.sin(arrowAngle + Math.PI / 6);

          const isData = couple.type === 'data';

          // 2) Position Label strictly outward from the arrow (further away from calling line)
          const dText = dArrow + 14;
          const textPosX = centerPosX + perpX * dText;
          const textPosY = centerPosY + perpY * dText;

          // Determine optimal textAnchor and dominantBaseline based on perpendicular direction
          let anchor: 'start' | 'end' | 'middle' = 'start';
          let baseline: 'central' | 'hanging' | 'auto' = 'central';

          if (perpX > 0.15) {
            anchor = 'start';
          } else if (perpX < -0.15) {
            anchor = 'end';
          } else {
            anchor = 'middle';
            baseline = perpY > 0 ? 'hanging' : 'auto';
          }

          return (
            <g key={couple.id || index} className="select-none">
              {/* Couple Shaft Line */}
              <line
                x1={tailX}
                y1={tailY}
                x2={headX}
                y2={headY}
                stroke="#1d4ed8"
                strokeWidth={1.75}
              />

              {/* Arrowhead */}
              <polygon
                points={`${headX},${headY} ${p1x},${p1y} ${p2x},${p2y}`}
                fill="#1d4ed8"
              />

              {/* Tail Circle: Hollow/Empty for Data (○), Solid/Filled for Control (●) */}
              <circle
                cx={tailX}
                cy={tailY}
                r={4.5}
                fill={isData ? '#ffffff' : '#1d4ed8'}
                stroke="#1d4ed8"
                strokeWidth={2}
              />

              {/* Couple Label Text with High-Contrast White Halo */}
              <text
                x={textPosX}
                y={textPosY}
                textAnchor={anchor}
                dominantBaseline={baseline}
                fill="#0f172a"
                fontSize={10.5}
                fontWeight={600}
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{
                  paintOrder: 'stroke fill',
                  stroke: '#ffffff',
                  strokeWidth: '5px',
                  strokeLinejoin: 'round',
                }}
              >
                {couple.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }
);

StructureEdge.displayName = 'StructureEdge';

