import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types/flowchart';

export const TerminatorNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as FlowNodeData;
  const isStart = nodeData.subType === 'start' || /mulai|start|begin/i.test(nodeData.label);

  const bg = isStart ? '#ecfdf5' : '#fff1f2';
  const border = selected ? '#2563eb' : isStart ? '#10b981' : '#f43f5e';
  const textColor = isStart ? '#064e3b' : '#881337';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center px-4 py-1.5 rounded-full transition-all duration-150 shadow-2xs box-border"
      style={{
        backgroundColor: bg,
        border: selected ? '2px solid #2563eb' : `1.5px solid ${border}`,
        boxShadow: selected ? '0 0 0 2px rgba(37,99,235,0.3)' : undefined,
      }}
    >
      {/* Primary Top Handle (Target - Default) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />

      {/* Primary Bottom Handle (Source - Default) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />

      {/* Top Source Handle */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white opacity-0 hover:opacity-100"
      />

      {/* Bottom Target Handle */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white opacity-0 hover:opacity-100"
      />

      {/* Left Handles (Target & Source) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white opacity-70 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white opacity-70 hover:opacity-100"
      />

      {/* Right Handles (Source & Target) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white opacity-70 hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white opacity-70 hover:opacity-100"
      />

      <div
        className="text-center font-bold text-[11px] leading-snug break-words whitespace-pre-wrap select-none pointer-events-none w-full"
        style={{ color: textColor }}
      >
        {nodeData.label}
      </div>
    </div>
  );
});

TerminatorNode.displayName = 'TerminatorNode';
