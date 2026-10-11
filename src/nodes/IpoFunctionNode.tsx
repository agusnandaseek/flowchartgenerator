import { memo, useMemo, useEffect } from 'react';
import { Handle, Position, useNodeConnections, useUpdateNodeInternals } from '@xyflow/react';
import { Layers, Database, User } from 'lucide-react';
import type { IpoFunction } from '../types/ipoChart';

interface IpoFunctionNodeProps {
  id?: string;
  data: {
    fn: IpoFunction;
    hasErrors?: boolean;
    errorCount?: number;
    connectedHandles?: string[];
  };
  selected?: boolean;
}

export const IpoFunctionNode = memo(({ id, data, selected }: IpoFunctionNodeProps) => {
  const { fn, hasErrors } = data;
  const roleText = fn.role?.trim();
  const updateNodeInternals = useUpdateNodeInternals();

  // Deteksi handle yang aktif terhubung ke garis
  const nodeConnections = useNodeConnections();
  const connectedHandleSet = useMemo(() => {
    const set = new Set<string>(data.connectedHandles || []);
    if (Array.isArray(nodeConnections)) {
      for (const c of nodeConnections) {
        if (c.source === id && c.sourceHandle) set.add(c.sourceHandle);
        if (c.target === id && c.targetHandle) set.add(c.targetHandle);
      }
    }
    return set;
  }, [data.connectedHandles, nodeConnections, id]);

  useEffect(() => {
    if (id) updateNodeInternals(id);
  }, [id, fn.type, fn.inputs.length, fn.outputs.length, connectedHandleSet, updateNodeInternals]);

  const isConnected = (handleId: string) => connectedHandleSet.has(handleId);

  // Render 3D Cylinder Database Node (Harmonious Light Academic Style)
  if (fn.type === 'database') {
    const strokeColor = selected ? '#6d28d9' : hasErrors ? '#f59e0b' : '#8b5cf6';
    const strokeWidth = selected ? 2.5 : 2;

    return (
      <div
        className={`relative w-[230px] h-[168px] select-none transition-all ${
          selected ? 'scale-[1.02] drop-shadow-lg' : 'drop-shadow-sm hover:drop-shadow-md'
        }`}
      >
        {/* Top Target & Source Handles (for arrows going down into or up out of cylinder top rim) */}
        {(['left', 'center', 'right'] as const).map((slot) => {
          const leftPct = slot === 'left' ? '25%' : slot === 'center' ? '50%' : '75%';
          const targetId = slot === 'center' ? 'target-top' : `target-top-${slot}`;
          const sourceId = slot === 'center' ? 'source-top' : `source-top-${slot}`;
          return (
            <div key={`top-${slot}`}>
              <Handle
                type="target"
                position={Position.Top}
                id={targetId}
                style={{ left: leftPct, top: 6 }}
                className={`transition-all ${
                  isConnected(targetId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
              <Handle
                type="source"
                position={Position.Top}
                id={sourceId}
                style={{ left: leftPct, top: 6 }}
                className={`transition-all ${
                  isConnected(sourceId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
            </div>
          );
        })}

        {/* Left Target & Source Handles (Top, Center, Bottom) */}
        {(['top', 'center', 'bottom'] as const).map((slot) => {
          const topPos = slot === 'top' ? 'calc(50% - 36px)' : slot === 'center' ? '50%' : 'calc(50% + 36px)';
          const targetId = slot === 'center' ? 'target-left' : `target-left-${slot}`;
          const sourceId = slot === 'center' ? 'source-left' : `source-left-${slot}`;
          return (
            <div key={`left-${slot}`}>
              <Handle
                type="target"
                position={Position.Left}
                id={targetId}
                style={{ top: topPos, left: 6 }}
                className={`transition-all ${
                  isConnected(targetId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
              <Handle
                type="source"
                position={Position.Left}
                id={sourceId}
                style={{ top: topPos, left: 6 }}
                className={`transition-all ${
                  isConnected(sourceId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
            </div>
          );
        })}

        {/* Right Target & Source Handles (Top, Center, Bottom) */}
        {(['top', 'center', 'bottom'] as const).map((slot) => {
          const topPos = slot === 'top' ? 'calc(50% - 36px)' : slot === 'center' ? '50%' : 'calc(50% + 36px)';
          const targetId = slot === 'center' ? 'target-right' : `target-right-${slot}`;
          const sourceId = slot === 'center' ? 'source-right' : `source-right-${slot}`;
          return (
            <div key={`right-${slot}`}>
              <Handle
                type="target"
                position={Position.Right}
                id={targetId}
                style={{ top: topPos, right: 6 }}
                className={`transition-all ${
                  isConnected(targetId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
              <Handle
                type="source"
                position={Position.Right}
                id={sourceId}
                style={{ top: topPos, right: 6 }}
                className={`transition-all ${
                  isConnected(sourceId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
            </div>
          );
        })}

        {/* 3D Cylinder SVG Shape - Tall Side Walls for Spacious Dual I/O Connections */}
        <svg
          viewBox="0 0 230 168"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={`dbBodyGrad-${id || 'default'}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5f3ff" />
              <stop offset="28%" stopColor="#ffffff" />
              <stop offset="72%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ede9fe" />
            </linearGradient>
            <linearGradient id={`dbTopGrad-${id || 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5f3ff" />
              <stop offset="100%" stopColor="#ede9fe" />
            </linearGradient>
          </defs>

          {/* Cylinder Body (Tall vertical walls from y=22 to y=138) */}
          <path
            d="M 10 22 L 10 138 A 105 18 0 0 0 220 138 L 220 22 Z"
            fill={`url(#dbBodyGrad-${id || 'default'})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Subtle Platter Curves for 3D Multi-Disk Database Look */}
          <path
            d="M 10 52 A 105 15 0 0 0 220 52"
            fill="none"
            stroke="#ddd6fe"
            strokeWidth="1.25"
          />
          <path
            d="M 10 108 A 105 15 0 0 0 220 108"
            fill="none"
            stroke="#ede9fe"
            strokeWidth="1.25"
          />

          {/* Cylinder Top Ellipse Lid */}
          <ellipse
            cx="115"
            cy="22"
            rx="105"
            ry="15"
            fill={`url(#dbTopGrad-${id || 'default'})`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />

          {/* Inner Rim Accent on Top Lid */}
          <ellipse
            cx="115"
            cy="22"
            rx="88"
            ry="10"
            fill="none"
            stroke="#c4b5fd"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Centered Database Label & Optional Role */}
        <div className="absolute inset-0 top-[38px] bottom-[16px] px-5 flex flex-col items-center justify-center text-center pointer-events-none gap-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100/90 border border-violet-200 text-[9px] font-bold text-violet-700 uppercase tracking-wider">
            <Database className="w-2.5 h-2.5 text-violet-600 shrink-0" />
            <span>Database</span>
          </div>
          <span
            className="font-sans font-bold text-xs text-slate-800 tracking-tight truncate max-w-full"
            title={fn.name || 'Database Records'}
          >
            {fn.name || '(untitled database)'}
          </span>
          {roleText && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-semibold text-amber-800 truncate max-w-full">
              <User className="w-2.5 h-2.5 text-amber-600 shrink-0" />
              <span className="truncate">{roleText}</span>
            </span>
          )}
        </div>

        {/* Bottom Source & Target Handles */}
        {(['left', 'center', 'right'] as const).map((slot) => {
          const leftPct = slot === 'left' ? '25%' : slot === 'center' ? '50%' : '75%';
          const sourceId = slot === 'center' ? 'source-bottom' : `source-bottom-${slot}`;
          const targetId = slot === 'center' ? 'target-bottom' : `target-bottom-${slot}`;
          return (
            <div key={`bottom-${slot}`}>
              <Handle
                type="source"
                position={Position.Bottom}
                id={sourceId}
                style={{ left: leftPct, bottom: 7 }}
                className={`transition-all ${
                  isConnected(sourceId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
              <Handle
                type="target"
                position={Position.Bottom}
                id={targetId}
                style={{ left: leftPct, bottom: 7 }}
                className={`transition-all ${
                  isConnected(targetId)
                    ? '!w-2.5 !h-2.5 !bg-violet-600 !border-2 !border-white opacity-100'
                    : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                }`}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`w-[230px] min-h-[152px] flex flex-col justify-between bg-white rounded-xl border-2 transition-all shadow-md select-none ${
        selected
          ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-lg'
          : hasErrors
          ? 'border-amber-400 hover:border-amber-500'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Top Target & Source Handles (Distributed Anti-Overlap Slots) */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top-left"
        style={{ left: '25%' }}
        className={`transition-all ${
          isConnected('target-top-left')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{ left: '50%' }}
        className={`transition-all ${
          isConnected('target-top')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top-right"
        style={{ left: '75%' }}
        className={`transition-all ${
          isConnected('target-top-right')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top-left"
        style={{ left: '25%' }}
        className={`transition-all ${
          isConnected('source-top-left')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        style={{ left: '50%' }}
        className={`transition-all ${
          isConnected('source-top')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top-right"
        style={{ left: '75%' }}
        className={`transition-all ${
          isConnected('source-top-right')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Left Target Handles (Top, Center, Bottom) */}
      {(['top', 'center', 'bottom'] as const).map((slot) => {
        const topPos = slot === 'top' ? 'calc(50% - 36px)' : slot === 'center' ? '50%' : 'calc(50% + 36px)';
        const targetId = slot === 'center' ? 'target-left' : `target-left-${slot}`;
        return (
          <Handle
            key={targetId}
            type="target"
            position={Position.Left}
            id={targetId}
            style={{ top: topPos }}
            className={`transition-all ${
              isConnected(targetId)
                ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-left-1.5 opacity-100'
                : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
            }`}
          />
        );
      })}

      {/* Right Target Handles (Top, Center, Bottom) */}
      {(['top', 'center', 'bottom'] as const).map((slot) => {
        const topPos = slot === 'top' ? 'calc(50% - 36px)' : slot === 'center' ? '50%' : 'calc(50% + 36px)';
        const targetId = slot === 'center' ? 'target-right' : `target-right-${slot}`;
        return (
          <Handle
            key={targetId}
            type="target"
            position={Position.Right}
            id={targetId}
            style={{ top: topPos }}
            className={`transition-all ${
              isConnected(targetId)
                ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-right-1.5 opacity-100'
                : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
            }`}
          />
        );
      })}

      {/* Function Title Header + Optional Role Badge */}
      <div className="bg-slate-100 px-3 py-2 rounded-t-[10px] border-b border-slate-200 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-mono font-bold text-xs text-slate-800 truncate" title={`${fn.name}()`}>
              {fn.name ? `${fn.name}()` : '(untitled)'}
            </span>
          </div>
          {hasErrors && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Ada validasi yang belum lengkap" />
          )}
        </div>
        {roleText && (
          <div className="flex items-center">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 text-[10px] font-semibold truncate max-w-full"
              title={`Role: ${roleText}`}
            >
              <User className="w-2.5 h-2.5 text-amber-600 shrink-0" />
              <span className="truncate">{roleText}</span>
            </span>
          </div>
        )}
      </div>

      {/* Inputs & Outputs Summary Body */}
      <div className="p-2.5 space-y-2 text-[11px]">
        {/* Inputs */}
        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Input ({fn.inputs.length}):
          </span>
          {fn.inputs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {fn.inputs.map((inp) => (
                <div key={inp.id} className="relative inline-flex items-center group/inp">
                  <span
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[10px] truncate max-w-full"
                    title={`Input: ${inp.name}`}
                  >
                    {inp.name || '...'}
                  </span>
                  {/* Dedicated per-input target pin */}
                  <Handle
                    type="target"
                    position={Position.Top}
                    id={`target-in-${inp.id}`}
                    className={`!left-1/2 !-translate-x-1/2 transition-all ${
                      isConnected(`target-in-${inp.id}`)
                        ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1.5 opacity-100'
                        : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                    }`}
                    title={`Pin Target: ${inp.name}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-[10px]">Belum ada input</span>
          )}
        </div>

        {/* Outputs */}
        <div className="pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Output ({fn.outputs.length}):
          </span>
          {fn.outputs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {fn.outputs.map((out) => (
                <div key={out.id} className="relative inline-flex items-center group/out">
                  <span
                    className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[10px] truncate max-w-full"
                    title={`Output: ${out.name}`}
                  >
                    {out.name || '...'}
                  </span>
                  {/* Dedicated per-output source pin */}
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id={`source-out-${out.id}`}
                    className={`!left-1/2 !-translate-x-1/2 transition-all ${
                      isConnected(`source-out-${out.id}`)
                        ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1.5 opacity-100'
                        : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                    }`}
                    title={`Pin Output: ${out.name}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-[10px]">Belum ada output</span>
          )}
        </div>
      </div>

      {/* Left Source Handles (Top, Center, Bottom) */}
      {(['top', 'center', 'bottom'] as const).map((slot) => {
        const topPos = slot === 'top' ? 'calc(50% - 36px)' : slot === 'center' ? '50%' : 'calc(50% + 36px)';
        const sourceId = slot === 'center' ? 'source-left' : `source-left-${slot}`;
        return (
          <Handle
            key={sourceId}
            type="source"
            position={Position.Left}
            id={sourceId}
            style={{ top: topPos }}
            className={`transition-all ${
              isConnected(sourceId)
                ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-left-1.5 opacity-100'
                : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
            }`}
          />
        );
      })}

      {/* Right Source Handles (Top, Center, Bottom) */}
      {(['top', 'center', 'bottom'] as const).map((slot) => {
        const topPos = slot === 'top' ? 'calc(50% - 36px)' : slot === 'center' ? '50%' : 'calc(50% + 36px)';
        const sourceId = slot === 'center' ? 'source-right' : `source-right-${slot}`;
        return (
          <Handle
            key={sourceId}
            type="source"
            position={Position.Right}
            id={sourceId}
            style={{ top: topPos }}
            className={`transition-all ${
              isConnected(sourceId)
                ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-right-1.5 opacity-100'
                : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
            }`}
          />
        );
      })}

      {/* Bottom Source & Target Handles (Distributed Anti-Overlap Slots) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom-left"
        style={{ left: '25%' }}
        className={`transition-all ${
          isConnected('source-bottom-left')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{ left: '50%' }}
        className={`transition-all ${
          isConnected('source-bottom')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom-right"
        style={{ left: '75%' }}
        className={`transition-all ${
          isConnected('source-bottom-right')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom-left"
        style={{ left: '25%' }}
        className={`transition-all ${
          isConnected('target-bottom-left')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        style={{ left: '50%' }}
        className={`transition-all ${
          isConnected('target-bottom')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom-right"
        style={{ left: '75%' }}
        className={`transition-all ${
          isConnected('target-bottom-right')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
    </div>
  );
});

IpoFunctionNode.displayName = 'IpoFunctionNode';
