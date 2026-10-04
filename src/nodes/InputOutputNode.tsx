import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types/flowchart';

export const InputOutputNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as FlowNodeData;
  const isInput = nodeData.subType === 'input' || /masukkan|baca|input|read/i.test(nodeData.label);

  const fillColor = isInput ? '#ecfeff' : '#f0f9ff';
  const strokeColor = selected ? '#2563eb' : isInput ? '#06b6d4' : '#0ea5e9';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center px-6 py-2 transition-all duration-150 box-border"
      style={{ filter: selected ? 'drop-shadow(0 2px 4px rgba(37,99,235,0.25))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))' }}
    >
      {/* Background SVG Parallelogram with explicit fill & stroke attributes for reliable export */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points="12,2 98,2 88,98 2,98"
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
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-cyan-600 transition-colors z-10"
      />

      {/* Primary Bottom Handle (Source - Default) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-cyan-600 transition-colors z-10"
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

      {/* Left Handles (Target & Source) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />

      {/* Right Handles (Source & Target) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white z-10 opacity-70 hover:opacity-100"
      />

      {/* Text Container */}
      <div
        className="relative z-0 text-center font-mono text-[11px] leading-snug break-words whitespace-pre-wrap select-none pointer-events-none w-full"
        style={{ color: '#083344' }}
      >
        {nodeData.label}
      </div>
    </div>
  );
});

InputOutputNode.displayName = 'InputOutputNode';
