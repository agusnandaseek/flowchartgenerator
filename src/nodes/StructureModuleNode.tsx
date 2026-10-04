import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StructureModuleData } from '../types/structureChart';

export const StructureModuleNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StructureModuleData;
  const isLibrary = !!nodeData?.isLibrary;

  return (
    <div
      className={`relative min-w-[170px] max-w-[240px] min-h-[54px] px-4 py-2.5 bg-white rounded-none flex items-center justify-center text-center transition-all ${
        selected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-xs'
      } ${
        isLibrary
          ? 'border-2 border-blue-700'
          : 'border-2 border-blue-700'
      }`}
      style={{
        boxShadow: selected ? '0 0 0 2px #6366f1' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Target Handle on Top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1 !pointer-events-none"
      />

      {/* Library Module Inset Double Lines (Left and Right) */}
      {isLibrary && (
        <>
          <div className="absolute top-0 bottom-0 left-[11px] w-[2px] bg-blue-700 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-[11px] w-[2px] bg-blue-700 pointer-events-none" />
        </>
      )}

      {/* Module Title */}
      <div className={`text-xs md:text-sm font-semibold text-slate-900 leading-snug break-words ${isLibrary ? 'px-2' : ''}`}>
        {nodeData?.label || 'Modul'}
      </div>

      {/* Source Handle on Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1 !pointer-events-none"
      />
    </div>
  );
});

StructureModuleNode.displayName = 'StructureModuleNode';
