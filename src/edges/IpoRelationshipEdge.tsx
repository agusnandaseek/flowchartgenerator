import React, { memo, useRef, useState, useLayoutEffect, useCallback } from 'react';
import {
  type EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  useReactFlow,
} from '@xyflow/react';
import { GripVertical } from 'lucide-react';

export interface IpoRelationshipEdgeData {
  connectionId: string;
  color?: string;
  sourceOutputId?: string;
  targetInputId?: string;
  sourceHandle?: string;
  targetHandle?: string;
  labelPosition?: number;
  label?: string;
  onUpdateConnection?: (connId: string, updates: { labelPosition?: number; color?: string; label?: string }) => void;
  onSelectEdge?: (edgeId: string) => void;
}

/**
 * Mencari rasio t (0.05 s/d 0.95) terdekat pada kurva SVG dari koordinat mouse (mouseX, mouseY).
 * Menggunakan kombinasi sampling awal + ternary/golden search untuk kecepatan sub-milidetik (<0.05ms).
 */
function findClosestTOnPath(pathEl: SVGPathElement, mouseX: number, mouseY: number): number {
  const len = pathEl.getTotalLength();
  if (len <= 0) return 0.5;

  const SAMPLES = 50;
  let bestDistSq = Infinity;
  let bestIndex = 0;

  for (let i = 0; i <= SAMPLES; i++) {
    const s = (i / SAMPLES) * len;
    const pt = pathEl.getPointAtLength(s);
    const dSq = (pt.x - mouseX) ** 2 + (pt.y - mouseY) ** 2;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIndex = i;
    }
  }

  // Refine di sekitar bestIndex
  let lowS = Math.max(0, ((bestIndex - 1) / SAMPLES) * len);
  let highS = Math.min(len, ((bestIndex + 1) / SAMPLES) * len);

  for (let iter = 0; iter < 8; iter++) {
    const mid1 = lowS + (highS - lowS) / 3;
    const mid2 = highS - (highS - lowS) / 3;
    const pt1 = pathEl.getPointAtLength(mid1);
    const pt2 = pathEl.getPointAtLength(mid2);
    const d1 = (pt1.x - mouseX) ** 2 + (pt1.y - mouseY) ** 2;
    const d2 = (pt2.x - mouseX) ** 2 + (pt2.y - mouseY) ** 2;
    if (d1 < d2) {
      highS = mid2;
    } else {
      lowS = mid1;
    }
  }

  const finalS = (lowS + highS) / 2;
  const ratio = finalS / len;
  return Math.max(0.05, Math.min(0.95, Number(ratio.toFixed(3))));
}

export const IpoRelationshipEdge: React.FC<EdgeProps> = memo((props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    selected,
    data,
  } = props;

  const edgeData = data as unknown as IpoRelationshipEdgeData | undefined;
  const edgeColor = edgeData?.color || (style?.stroke as string) || '#4f46e5';
  const labelText = edgeData?.label || '';
  const initialPosition = typeof edgeData?.labelPosition === 'number' ? edgeData.labelPosition : 0.5;

  const pathRef = useRef<SVGPathElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragT, setDragT] = useState<number | null>(null);
  const [labelCoords, setLabelCoords] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDragMoved = useRef<boolean>(false);

  const { screenToFlowPosition } = useReactFlow();

  const [edgePath, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const effectiveT = dragT !== null ? dragT : initialPosition;

  // Hitung koordinat label secara presisi pada kurva SVG
  useLayoutEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) {
          const clampedT = Math.max(0.05, Math.min(0.95, effectiveT));
          const pt = pathRef.current.getPointAtLength(clampedT * len);
          setLabelCoords({ x: pt.x, y: pt.y });
          return;
        }
      } catch {
        // fallback jika DOM belum siap
      }
    }
    setLabelCoords({ x: defaultLabelX, y: defaultLabelY });
  }, [edgePath, effectiveT, defaultLabelX, defaultLabelY]);

  const activeLabelX = labelCoords?.x ?? defaultLabelX;
  const activeLabelY = labelCoords?.y ?? defaultLabelY;

  // Pointer drag events untuk menggeser label di sepanjang garis
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    didDragMoved.current = false;
    setIsDragging(true);
    edgeData?.onSelectEdge?.(id);
  }, [edgeData, id]);

  const latestDragTRef = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !pathRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    if (dragStartPos.current) {
      const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
      if (dist > 3) {
        didDragMoved.current = true;
      }
    }

    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newT = findClosestTOnPath(pathRef.current, flowPos.x, flowPos.y);
    latestDragTRef.current = newT;
    setDragT(newT);
  }, [isDragging, screenToFlowPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);

    const finalT = latestDragTRef.current !== null ? latestDragTRef.current : dragT;
    if (finalT !== null && didDragMoved.current && edgeData?.connectionId) {
      edgeData.onUpdateConnection?.(edgeData.connectionId, { labelPosition: finalT });
    }
    latestDragTRef.current = null;
    setDragT(null);
    dragStartPos.current = null;
  }, [isDragging, dragT, edgeData]);

  const handleEdgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    edgeData?.onSelectEdge?.(id);
  }, [edgeData, id]);

  return (
    <>
      {/* 1. Garis Relasi Utama (SVG Path) */}
      <path
        ref={pathRef}
        id={id}
        className="react-flow__edge-path transition-all"
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        style={{
          fill: 'none',
          stroke: edgeColor,
          strokeWidth: selected ? 3.5 : 2,
          filter: selected ? `drop-shadow(0 0 6px ${edgeColor}90)` : undefined,
          ...style,
        }}
      />

      {/* 2. Invisible hit area lebar 24px untuk kemudahan klik garis */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction cursor-pointer"
        style={{ fill: 'none' }}
        onClick={handleEdgeClick}
      />

      {/* 3. Label Badge Draggable yang 100% terkunci di atas garis */}
      {labelText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${activeLabelX}px, ${activeLabelY}px)`,
              pointerEvents: 'all',
              zIndex: isDragging ? 50 : 20,
            }}
            className="nodrag nopan select-none"
          >
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={(e) => {
                e.stopPropagation();
                edgeData?.onSelectEdge?.(id);
              }}
              className={`group flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-shadow ${
                isDragging
                  ? 'cursor-grabbing scale-105 shadow-lg ring-2'
                  : 'cursor-grab hover:scale-105 shadow-xs hover:shadow-md'
              }`}
              style={{
                backgroundColor: '#ffffff',
                color: edgeColor,
                borderColor: selected ? edgeColor : '#cbd5e1',
                borderWidth: selected ? '2px' : '1px',
                borderStyle: 'solid',
                boxShadow: isDragging ? `0 4px 12px ${edgeColor}33` : undefined,
              }}
              title="Klik untuk atur / Geser untuk pindahkan posisi label di sepanjang garis"
            >
              <GripVertical
                className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ color: edgeColor }}
              />
              <span className="truncate max-w-[160px]">{labelText}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

IpoRelationshipEdge.displayName = 'IpoRelationshipEdge';
