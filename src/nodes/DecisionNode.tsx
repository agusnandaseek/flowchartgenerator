import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types/flowchart';

export const DecisionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as FlowNodeData;

  const fillColor = '#fffbeb';
  const strokeColor = selected ? '#d97706' : '#f59e0b';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center px-6 py-3 transition-all duration-150 box-border"
      style={{ filter: selected ? 'drop-shadow(0 2px 4px rgba(217,119,6,0.25))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))' }}
    >
      {/* Background SVG Diamond with explicit SVG fill & stroke for flawless PNG export */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={selected ? 2.5 : 1.8}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Primary Top Handle (Target - Default) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-amber-600 transition-colors z-10"
      />

      {/* Primary Bottom Handle (Source - 'Ya' / True path - Default) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white hover:!bg-emerald-600 transition-colors z-10"
      />

      {/* Right Source Handle ('Tidak' / False path) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-rose-500 !border-2 !border-white hover:!bg-rose-600 transition-colors z-10"
      />

      {/* Left Source Handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />

      {/* Top Source Handle */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white z-10 opacity-0 hover:opacity-100"
      />

      {/* Bottom Target Handle */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white z-10 opacity-0 hover:opacity-100"
      />

      {/* Left Target Handle (Main target for loop-backs) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />

      {/* Right Target Handle */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />

      {/* Text Container */}
      <div
        className="relative z-0 text-center font-mono text-[11px] leading-tight break-words whitespace-pre-wrap select-none pointer-events-none w-full"
        style={{ color: '#451a03' }}
      >
        {nodeData.label}
      </div>
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
