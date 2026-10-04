import React, { useState, useRef, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Table2,
  Network,
  Download,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import type { IpoFunction, IpoConnection } from '../types/ipoChart';
import { IpoFunctionNode } from '../nodes/IpoFunctionNode';
import { getIpoRelationshipElements } from '../utils/ipoRelationshipLayout';

export interface IpoPreviewRef {
  exportAllCharts: (filename?: string) => Promise<void>;
  exportRelationships: (filename?: string) => Promise<void>;
}

interface IpoPreviewProps {
  functions: IpoFunction[];
  connections: IpoConnection[];
  projectName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const nodeTypes = {
  ipoFunction: IpoFunctionNode,
};

const IpoRelationshipsDiagram: React.FC<{
  functions: IpoFunction[];
  connections: IpoConnection[];
  diagramRef: React.RefObject<HTMLDivElement | null>;
}> = ({ functions, connections, diagramRef }) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return getIpoRelationshipElements(functions, connections, 'TB');
  }, [functions, connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const { fitView } = useReactFlow();

  // Sync state when elements change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const timer = setTimeout(() => {
      fitView({ padding: 0.25, duration: 250 });
    }, 50);
    return () => clearTimeout(timer);
  }, [initialNodes, initialEdges, fitView, setNodes, setEdges]);

  return (
    <div ref={diagramRef} className="w-full h-full relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={18} size={1} />
        <Controls showInteractive={false} className="!bg-white !border !border-slate-200 !shadow-md !rounded-lg" />
        <MiniMap
          nodeColor="#6366f1"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!bg-white !border !border-slate-200 !shadow-md !rounded-lg !m-3"
          zoomable
          pannable
        />
      </ReactFlow>

      {connections.length === 0 && functions.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md px-3.5 py-2 rounded-xl text-xs text-slate-600 flex items-center gap-2 pointer-events-none">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Hubungkan fungsi melalui tab <strong>Connections</strong> di panel kiri untuk menampilkan alur panah.</span>
        </div>
      )}
    </div>
  );
};

export const IpoPreview = forwardRef<IpoPreviewRef, IpoPreviewProps>(
  ({ functions, connections, projectName, isFullscreen, onToggleFullscreen }, ref) => {
    const [subMode, setSubMode] = useState<'tables' | 'relationships'>('tables');
    const [isExporting, setIsExporting] = useState<boolean>(false);

    const tablesContainerRef = useRef<HTMLDivElement>(null);
    const diagramWrapperRef = useRef<HTMLDivElement>(null);

    // Export All IPO Charts as a single consolidated vertical image
    const handleExportAllCharts = useCallback(
      async (filename = `${projectName}_ipo_charts`) => {
        if (!tablesContainerRef.current) return;
        setIsExporting(true);
        try {
          // Find scroll container
          const target = tablesContainerRef.current;
          const dataUrl = await toPng(target, {
            backgroundColor: '#ffffff',
            pixelRatio: 2.5,
            cacheBust: true,
          });

          const link = document.createElement('a');
          link.download = `${filename}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('Failed to export IPO tables PNG:', err);
          alert('Gagal mengekspor IPO Charts ke PNG. Silakan coba lagi.');
        } finally {
          setIsExporting(false);
        }
      },
      [projectName]
    );

    // Export Function Relationships Diagram
    const handleExportRelationships = useCallback(
      async (filename = `${projectName}_function_relationships`) => {
        if (!diagramWrapperRef.current) return;
        setIsExporting(true);
        try {
          const viewportEl = diagramWrapperRef.current.querySelector(
            '.react-flow__viewport'
          ) as HTMLElement;
          if (!viewportEl) {
            alert('Diagram viewport belum siap.');
            return;
          }

          const dataUrl = await toPng(viewportEl, {
            backgroundColor: '#ffffff',
            pixelRatio: 2.5,
            cacheBust: true,
          });

          const link = document.createElement('a');
          link.download = `${filename}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('Failed to export relationships diagram PNG:', err);
          alert('Gagal mengekspor diagram relasi. Silakan coba lagi.');
        } finally {
          setIsExporting(false);
        }
      },
      [projectName]
    );

    useImperativeHandle(ref, () => ({
      exportAllCharts: handleExportAllCharts,
      exportRelationships: handleExportRelationships,
    }));

    return (
      <div className="w-full h-full flex flex-col min-h-0 bg-slate-100 select-none overflow-hidden">
        {/* Top Preview Toolbar */}
        <div className="h-11 bg-white border-b border-slate-200 px-3 flex items-center justify-between shrink-0 z-10 gap-2">
          {/* Sub-mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
            <button
              onClick={() => setSubMode('tables')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                subMode === 'tables'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>IPO Charts ({functions.length})</span>
            </button>

            <button
              onClick={() => setSubMode('relationships')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                subMode === 'relationships'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-emerald-600" />
              <span>Function Relationships ({connections.length})</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (subMode === 'tables') {
                  handleExportAllCharts();
                } else {
                  handleExportRelationships();
                }
              }}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title={
                subMode === 'tables'
                  ? 'Ekspor seluruh tabel IPO ke PNG resolusi tinggi'
                  : 'Ekspor diagram relasi fungsi ke PNG'
              }
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">
                {subMode === 'tables' ? 'Export All IPO' : 'Export Diagram'}
              </span>
            </button>

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh Preview'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-h-0 relative overflow-hidden">
          {/* VIEW 1: ACADEMIC IPO TABLES */}
          {subMode === 'tables' && (
            <div className="w-full h-full overflow-y-auto p-4 md:p-6 bg-slate-100/70">
              <div
                ref={tablesContainerRef}
                className="max-w-4xl mx-auto space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                {/* Header Title on Export Container */}
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {projectName || 'Functional Design IPO Charts'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Input – Process – Output Specifications ({functions.length} Function{functions.length > 1 ? 's' : ''})
                  </p>
                </div>

                {functions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Table2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">Belum ada Function untuk ditampilkan.</p>
                    <p className="text-[11px] text-slate-400">
                      Tambahkan Function di panel kiri untuk membuat tabel IPO secara manual.
                    </p>
                  </div>
                ) : (
                  functions.map((fn, idx) => (
                    <div
                      key={fn.id}
                      className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs"
                    >
                      {/* Function Name Heading */}
                      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h3 className="font-mono font-bold text-sm text-slate-900">
                            {fn.name ? `${fn.name}()` : '(untitledFunction)'}
                          </h3>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          IPO Chart
                        </span>
                      </div>

                      {/* 3-Column Academic Table */}
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                            <th className="w-[25%] py-2 px-3.5 text-left border-r border-slate-300">
                              INPUT
                            </th>
                            <th className="w-[50%] py-2 px-3.5 text-left border-r border-slate-300">
                              PROCESS
                            </th>
                            <th className="w-[25%] py-2 px-3.5 text-left">
                              OUTPUT
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="align-top">
                            {/* INPUT COLUMN (25%) */}
                            <td className="w-[25%] p-3.5 border-r border-slate-300 bg-white">
                              {fn.inputs.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">- None -</span>
                              ) : (
                                <ul className="space-y-1.5 font-mono text-slate-800">
                                  {fn.inputs.map((inp) => (
                                    <li key={inp.id} className="flex items-center gap-1.5 leading-relaxed">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                      <span className="font-medium text-slate-900">{inp.name || '(unnamed)'}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>

                            {/* PROCESS COLUMN (50%) */}
                            <td className="w-[50%] p-3.5 border-r border-slate-300 bg-white">
                              {fn.processes.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">- None -</span>
                              ) : (
                                <ol className="space-y-2 text-slate-800 list-decimal list-inside leading-relaxed">
                                  {fn.processes.map((pr) => (
                                    <li key={pr.id} className="text-slate-800 text-xs">
                                      <span className="font-normal whitespace-pre-wrap">
                                        {pr.description || '(no description)'}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </td>

                            {/* OUTPUT COLUMN (25%) */}
                            <td className="w-[25%] p-3.5 bg-white">
                              {fn.outputs.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">- None -</span>
                              ) : (
                                <ul className="space-y-1.5 font-mono text-slate-800">
                                  {fn.outputs.map((out) => (
                                    <li key={out.id} className="flex items-center gap-1.5 leading-relaxed">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                      <span className="font-medium text-slate-900">{out.name || '(unnamed)'}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: FUNCTION RELATIONSHIPS GRAPH */}
          {subMode === 'relationships' && (
            <ReactFlowProvider>
              <IpoRelationshipsDiagram
                functions={functions}
                connections={connections}
                diagramRef={diagramWrapperRef}
              />
            </ReactFlowProvider>
          )}
        </div>
      </div>
    );
  }
);

IpoPreview.displayName = 'IpoPreview';
