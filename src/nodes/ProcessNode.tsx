import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../types/flowchart';

export const ProcessNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as FlowNodeData;

  return (
    <div
      className="relative w-full h-full flex items-center justify-center px-4 py-2 rounded-none transition-all duration-150 shadow-2xs box-border text-center"
      style={{
        backgroundColor: '#eef2ff',
        border: selected ? '2px solid #4338ca' : '1.5px solid #6366f1',
        borderRadius: '0px',
        boxShadow: selected ? '0 0 0 2px rgba(99,102,241,0.3)' : undefined,
      }}
    >
      {/* Primary Top Handle (Target - Default) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-indigo-600 transition-colors"
      />

      {/* Primary Bottom Handle (Source - Default) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-indigo-600 transition-colors"
      />

      {/* Top Source Handle (for upward loop returns) */}
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
        className="text-center font-mono text-[11px] leading-snug break-words whitespace-pre-wrap select-none pointer-events-none w-full"
        style={{ color: '#1e1b4b' }}
      >
        {nodeData.label}
      </div>
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';
