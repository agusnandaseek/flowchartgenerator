import React, { useState, useRef, useMemo, forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
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
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Table2,
  Network,
  Download,
  Maximize2,
  Minimize2,
  Info,
  RotateCcw,
  Palette,
  Trash2,
  X,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import type { IpoFunction, IpoConnection } from '../types/ipoChart';
import { IpoFunctionNode } from '../nodes/IpoFunctionNode';
import { IpoRelationshipEdge } from '../edges/IpoRelationshipEdge';
import { getIpoRelationshipElements, updateIpoEdgeHandles } from '../utils/ipoRelationshipLayout';

export interface IpoPreviewRef {
  exportAllCharts: (filename?: string) => Promise<void>;
  exportRelationships: (filename?: string) => Promise<void>;
  resetPositions: () => void;
}

interface IpoPreviewProps {
  functions: IpoFunction[];
  connections: IpoConnection[];
  projectName: string;
  customNodePositions?: Record<string, { x: number; y: number }> | null;
  onPositionsChange?: (positions: Record<string, { x: number; y: number }> | null) => void;
  onUpdateConnection?: (connId: string, updates: Partial<IpoConnection>) => void;
  onDeleteConnection?: (connId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const nodeTypes = {
  ipoFunction: IpoFunctionNode,
};

const edgeTypes = {
  ipoRelationshipEdge: IpoRelationshipEdge,
};

const IpoRelationshipsDiagram: React.FC<{
  functions: IpoFunction[];
  connections: IpoConnection[];
  customNodePositions?: Record<string, { x: number; y: number }> | null;
  onPositionsChange?: (positions: Record<string, { x: number; y: number }> | null) => void;
  onUpdateConnection?: (connId: string, updates: Partial<IpoConnection>) => void;
  onDeleteConnection?: (connId: string) => void;
  diagramRef: React.RefObject<HTMLDivElement | null>;
  onNodesUpdatedRef: React.MutableRefObject<Node[]>;
  onResetPositionsRef: React.MutableRefObject<() => void>;
}> = ({
  functions,
  connections,
  customNodePositions,
  onPositionsChange,
  onUpdateConnection,
  onDeleteConnection,
  diagramRef,
  onNodesUpdatedRef,
  onResetPositionsRef,
}) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return getIpoRelationshipElements(functions, connections, 'TB', customNodePositions);
  }, [functions, connections, customNodePositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  // Keep ref up to date for export bounding box
  useEffect(() => {
    onNodesUpdatedRef.current = nodes;
  }, [nodes, onNodesUpdatedRef]);

  // Sync state when elements change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Penyesuaian Dinamis Handle Garis Relasi:
  // Jika 1 source memiliki >= 2 target functions, garis keluar dari handle kanan/kiri/bawah
  // dan secara otomatis menyesuaikan secara real-time saat target block digeser ke kanan atau ke kiri!
  useEffect(() => {
    setEdges((currentEdges) => {
      const updated = updateIpoEdgeHandles(currentEdges, nodes, connections);
      const hasChanged = updated.some(
        (e, i) =>
          e.sourceHandle !== currentEdges[i]?.sourceHandle ||
          e.targetHandle !== currentEdges[i]?.targetHandle
      );
      return hasChanged ? updated : currentEdges;
    });
  }, [nodes, connections, setEdges]);

  // FitView only on initial mount or when function count changes
  const prevFnCount = useRef(functions.length);
  useEffect(() => {
    if (prevFnCount.current !== functions.length) {
      prevFnCount.current = functions.length;
      const timer = setTimeout(() => {
        fitView({ padding: 0.25, duration: 250 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [functions.length, fitView]);

  // Magnetic Snapping on Drag
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const SNAP_THRESHOLD = 15;

      const adjustedChanges = changes.map((change) => {
        if (change.type === 'position' && change.position && change.dragging) {
          const draggedNode = nodes.find((n) => n.id === change.id);
          if (draggedNode) {
            const nodeW = 230;
            const nodeH = 120;
            const proposedCenterX = change.position.x + nodeW / 2;
            const proposedCenterY = change.position.y + nodeH / 2;

            const otherNodes = nodes.filter((n) => n.id !== change.id);

            let snappedX = change.position.x;
            let snappedY = change.position.y;

            // Snap X to align centers vertically
            for (const other of otherNodes) {
              const otherCenterX = other.position.x + nodeW / 2;
              if (Math.abs(proposedCenterX - otherCenterX) <= SNAP_THRESHOLD) {
                snappedX = Math.round(otherCenterX - nodeW / 2);
                break;
              }
            }

            // Snap Y to align centers horizontally
            for (const other of otherNodes) {
              const otherCenterY = other.position.y + nodeH / 2;
              if (Math.abs(proposedCenterY - otherCenterY) <= SNAP_THRESHOLD) {
                snappedY = Math.round(otherCenterY - nodeH / 2);
                break;
              }
            }

            return {
              ...change,
              position: { x: snappedX, y: snappedY },
            };
          }
        }
        return change;
      });

      onNodesChange(adjustedChanges);
    },
    [nodes, onNodesChange]
  );

  // When node drag stops, persist new position
  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const newPos = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      const updatedPositions = { ...(customNodePositions || {}) };
      updatedPositions[node.id] = newPos;

      if (onPositionsChange) {
        onPositionsChange(updatedPositions);
      }
    },
    [customNodePositions, onPositionsChange]
  );

  // Reset positions handler
  const handleResetPositions = useCallback(() => {
    if (onPositionsChange) {
      onPositionsChange(null);
    }
    const fresh = getIpoRelationshipElements(functions, connections, 'TB', null);
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 250 });
    }, 50);
  }, [functions, connections, onPositionsChange, setNodes, setEdges, fitView]);

  useEffect(() => {
    onResetPositionsRef.current = handleResetPositions;
  }, [handleResetPositions, onResetPositionsRef]);

  // Selected connection details
  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === selectedEdgeId),
    [connections, selectedEdgeId]
  );

  const srcFn = useMemo(
    () => functions.find((f) => f.id === selectedConnection?.sourceFunctionId),
    [functions, selectedConnection]
  );
  const tgtFn = useMemo(
    () => functions.find((f) => f.id === selectedConnection?.targetFunctionId),
    [functions, selectedConnection]
  );

  const selectedSrcOut = useMemo(
    () => srcFn?.outputs.find((o) => o.id === selectedConnection?.sourceOutputId),
    [srcFn, selectedConnection]
  );
  const selectedTgtIn = useMemo(
    () => tgtFn?.inputs.find((i) => i.id === selectedConnection?.targetInputId),
    [tgtFn, selectedConnection]
  );

  // Edges with selection highlight, color, position and interactive handlers
  const styledEdges = useMemo(() => {
    return edges.map((e) => {
      const isSel = e.id === selectedEdgeId;
      const conn = connections.find((c) => c.id === e.id);
      const edgeColor = conn?.color || (e.data as any)?.color || '#4f46e5';
      const edgeLabel = conn?.label?.trim()
        ? conn.label.trim()
        : (e.data as any)?.label || '';

      return {
        ...e,
        type: 'ipoRelationshipEdge',
        selected: isSel,
        animated: isSel,
        data: {
          ...(e.data as any),
          connectionId: e.id,
          color: edgeColor,
          label: edgeLabel,
          labelPosition: typeof conn?.labelPosition === 'number' ? conn.labelPosition : (e.data as any)?.labelPosition ?? 0.5,
          onUpdateConnection,
          onSelectEdge: (edgeId: string) => setSelectedEdgeId(edgeId),
        },
        style: {
          ...e.style,
          stroke: edgeColor,
          strokeWidth: isSel ? 3.5 : 2,
          fill: 'none',
        },
      };
    });
  }, [edges, selectedEdgeId, connections, onUpdateConnection]);

  return (
    <div ref={diagramRef} className="w-full h-full relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={(_event, edge) => {
          setSelectedEdgeId(edge.id);
        }}
        onPaneClick={() => {
          setSelectedEdgeId(null);
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'ipoRelationshipEdge',
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

      {/* Floating Edge Settings Toolbar (Color & Handle Position Adjuster) */}
      {selectedConnection && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 max-w-2xl w-[94%] sm:w-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedConnection.color || '#4f46e5' }}
              />
              <span className="text-xs font-bold text-slate-800 truncate">
                {selectedConnection.label || 'Relasi Data'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono truncate">
                ({srcFn?.name || 'source'} → {tgtFn?.name || 'target'})
              </span>
            </div>
            <button
              onClick={() => setSelectedEdgeId(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-xs">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 mr-1">Warna:</span>
              {[
                { name: 'Indigo', color: '#4f46e5' },
                { name: 'Emerald', color: '#059669' },
                { name: 'Rose', color: '#e11d48' },
                { name: 'Amber', color: '#d97706' },
                { name: 'Purple', color: '#9333ea' },
                { name: 'Sky', color: '#0284c7' },
                { name: 'Slate', color: '#475569' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => onUpdateConnection?.(selectedConnection.id, { color: swatch.color })}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                    (selectedConnection.color || '#4f46e5') === swatch.color
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}
              <label className="relative cursor-pointer ml-0.5" title="Pilih warna custom">
                <input
                  type="color"
                  value={selectedConnection.color || '#4f46e5'}
                  onChange={(e) => onUpdateConnection?.(selectedConnection.id, { color: e.target.value })}
                  className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer p-0 opacity-0 absolute inset-0"
                />
                <div
                  className="w-5 h-5 rounded-full border border-slate-300 hover:border-slate-400 flex items-center justify-center shadow-2xs"
                  style={{ backgroundColor: selectedConnection.color || '#4f46e5' }}
                >
                  <Palette className="w-2.5 h-2.5 text-white mix-blend-difference" />
                </div>
              </label>
            </div>

            {/* Source Handle Selector ("Ubah Posisi ke Titik Output") */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Titik Output:</span>
              <select
                value={selectedConnection.sourceHandle || 'auto'}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConnection?.(selectedConnection.id, {
                    sourceHandle: val === 'auto' ? undefined : val,
                  });
                }}
                className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="auto">Otomatis (Sesuai Posisi)</option>
                {selectedSrcOut && (
                  <option value={`source-out-${selectedSrcOut.id}`}>
                    Pin Tag [{selectedSrcOut.name}]
                  </option>
                )}
                <option value="source-bottom">Sisi Bawah (Tengah)</option>
                <option value="source-bottom-left">Sisi Bawah (Kiri)</option>
                <option value="source-bottom-right">Sisi Bawah (Kanan)</option>
                <option value="source-left">Sisi Kiri</option>
                <option value="source-right">Sisi Kanan</option>
              </select>
            </div>

            {/* Target Handle Selector ("Titik Tujuan Input") */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Titik Input:</span>
              <select
                value={selectedConnection.targetHandle || 'auto'}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConnection?.(selectedConnection.id, {
                    targetHandle: val === 'auto' ? undefined : val,
                  });
                }}
                className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="auto">Otomatis (Anti-Overlap)</option>
                {selectedTgtIn && (
                  <option value={`target-in-${selectedTgtIn.id}`}>
                    Pin Tag [{selectedTgtIn.name}]
                  </option>
                )}
                <option value="target-top">Sisi Atas (Tengah)</option>
                <option value="target-top-left">Sisi Atas (Kiri)</option>
                <option value="target-top-right">Sisi Atas (Kanan)</option>
                <option value="target-left">Sisi Kiri</option>
                <option value="target-right">Sisi Kanan</option>
              </select>
            </div>

            {/* Delete button */}
            {onDeleteConnection && (
              <button
                onClick={() => {
                  onDeleteConnection(selectedConnection.id);
                  setSelectedEdgeId(null);
                }}
                className="ml-auto text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Hapus Koneksi Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Posisi Label di Garis (Slider, Presets & Quick Rename) */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Quick Rename Label */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Teks Label:</span>
              <input
                type="text"
                value={selectedConnection.label ?? ''}
                placeholder={selectedSrcOut?.name || selectedTgtIn?.name || 'Label'}
                onChange={(e) => onUpdateConnection?.(selectedConnection.id, { label: e.target.value })}
                className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-mono w-28 sm:w-36 focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                title="Ketik untuk mengubah teks label garis"
              />
            </div>

            {/* Position Slider & Presets */}
            <div className="flex items-center gap-2 grow sm:grow-0 justify-end">
              <span className="text-[11px] font-semibold text-slate-600">Posisi di Garis:</span>
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={Math.round((selectedConnection.labelPosition ?? 0.5) * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  onUpdateConnection?.(selectedConnection.id, { labelPosition: val });
                }}
                className="w-20 sm:w-28 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                title="Geser slider ini untuk memindahkan posisi label di sepanjang garis"
              />
              <span className="text-[10px] font-mono font-bold text-indigo-600 min-w-[30px] text-right">
                {Math.round((selectedConnection.labelPosition ?? 0.5) * 100)}%
              </span>

              {/* Preset Buttons */}
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => onUpdateConnection?.(selectedConnection.id, { labelPosition: 0.2 })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    Math.round((selectedConnection.labelPosition ?? 0.5) * 100) === 20
                      ? 'bg-indigo-100 text-indigo-700 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Posisikan dekat sumber (20%)"
                >
                  Sumber
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateConnection?.(selectedConnection.id, { labelPosition: 0.5 })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    Math.round((selectedConnection.labelPosition ?? 0.5) * 100) === 50
                      ? 'bg-indigo-100 text-indigo-700 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Posisikan tepat di tengah garis (50%)"
                >
                  Tengah
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateConnection?.(selectedConnection.id, { labelPosition: 0.8 })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    Math.round((selectedConnection.labelPosition ?? 0.5) * 100) === 80
                      ? 'bg-indigo-100 text-indigo-700 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Posisikan dekat target (80%)"
                >
                  Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Floating Helper & Reset Button */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={handleResetPositions}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-md rounded-lg text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
          title="Tata ulang posisi semua kotak ke susunan otomatis Dagre yang rapi"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tata Ulang Posisi</span>
        </button>
      </div>

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
  (
    {
      functions,
      connections,
      projectName,
      customNodePositions,
      onPositionsChange,
      onUpdateConnection,
      onDeleteConnection,
      isFullscreen,
      onToggleFullscreen,
    },
    ref
  ) => {
    const [subMode, setSubMode] = useState<'tables' | 'relationships'>('tables');
    const [isExporting, setIsExporting] = useState<boolean>(false);

    const tablesContainerRef = useRef<HTMLDivElement>(null);
    const diagramWrapperRef = useRef<HTMLDivElement>(null);
    const activeNodesRef = useRef<Node[]>([]);
    const resetPositionsCallbackRef = useRef<() => void>(() => {});

    // Export All IPO Charts as a single consolidated vertical image
    const handleExportAllCharts = useCallback(
      async (filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_ipo_charts`) => {
        if (!tablesContainerRef.current) return;
        setIsExporting(true);
        try {
          const target = tablesContainerRef.current;
          const dataUrl = await toPng(target, {
            backgroundColor: '#ffffff',
            pixelRatio: 3, // Retina 300+ DPI
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

    // Export Function Relationships Diagram (Identical High-Res Bounding Box Calculation)
    const handleExportRelationships = useCallback(
      async (filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_function_relationships`) => {
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

          const currentNodes = activeNodesRef.current || [];
          if (currentNodes.length === 0) {
            alert('Tidak ada node untuk diekspor.');
            return;
          }

          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          currentNodes.forEach((node) => {
            const nx = node.position.x;
            const ny = node.position.y;
            const nw = (node.measured?.width ?? 230) || 230;
            const nh = (node.measured?.height ?? 120) || 120;

            minX = Math.min(minX, nx);
            minY = Math.min(minY, ny);
            maxX = Math.max(maxX, nx + nw);
            maxY = Math.max(maxY, ny + nh);
          });

          // Add 50px padding
          const padding = 50;
          const contentWidth = Math.max(100, Math.ceil(maxX - minX));
          const contentHeight = Math.max(100, Math.ceil(maxY - minY));
          const imageWidth = contentWidth + padding * 2;
          const imageHeight = contentHeight + padding * 2;

          // Ensure all SVG edge paths are strictly fill="none" so html-to-image won't render black fills
          const allEdgePaths = viewportEl.querySelectorAll<SVGPathElement>('.react-flow__edge-path');
          allEdgePaths.forEach((p) => {
            p.setAttribute('fill', 'none');
            p.style.fill = 'none';
          });

          const dataUrl = await toPng(viewportEl, {
            backgroundColor: '#ffffff',
            width: imageWidth,
            height: imageHeight,
            pixelRatio: 3, // 300+ DPI Retina crispness
            style: {
              width: `${imageWidth}px`,
              height: `${imageHeight}px`,
              transform: `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`,
              transformOrigin: 'top left',
            },
            filter: (domNode) => {
              const classList = (domNode as HTMLElement)?.classList;
              if (classList?.contains('react-flow__handle')) return false;
              return true;
            },
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
      resetPositions: () => resetPositionsCallbackRef.current(),
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
                  : 'Ekspor diagram relasi fungsi ke PNG resolusi tinggi'
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
                customNodePositions={customNodePositions}
                onPositionsChange={onPositionsChange}
                onUpdateConnection={onUpdateConnection}
                onDeleteConnection={onDeleteConnection}
                diagramRef={diagramWrapperRef}
                onNodesUpdatedRef={activeNodesRef}
                onResetPositionsRef={resetPositionsCallbackRef}
              />
            </ReactFlowProvider>
          )}
        </div>
      </div>
    );
  }
);

IpoPreview.displayName = 'IpoPreview';
