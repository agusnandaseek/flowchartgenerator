import React, {
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  Panel,
  type Node,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import {
  Maximize,
  Minimize2,
  RotateCcw,
  Focus,
} from 'lucide-react';
import { StructureModuleNode } from '../nodes/StructureModuleNode';
import { StructureEdge } from '../edges/StructureEdge';
import { getStructureLayoutedElements } from '../utils/structureLayout';

export interface StructureChartPreviewRef {
  exportImage: (format?: 'png' | 'svg', filename?: string) => Promise<void>;
  getNodePositions: () => Record<string, { x: number; y: number }>;
  resetPositions: () => void;
}

interface StructureChartPreviewProps {
  rawNodes: Node[];
  rawEdges: Edge[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onNodeSelect?: (lineNumber: number, nodeId: string) => void;
}

const nodeTypes = {
  structureModule: StructureModuleNode,
};

const edgeTypes = {
  structureEdge: StructureEdge,
};

const StructureChartPreviewContent = forwardRef<
  StructureChartPreviewRef,
  StructureChartPreviewProps
>(({ rawNodes, rawEdges, isFullscreen, onToggleFullscreen, onNodeSelect }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, getNodes } = useReactFlow();

  const userMovedNodes = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isFirstLayout = useRef<boolean>(true);

  // Magnetic snapping on drag
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const SNAP_THRESHOLD = 15;

      const adjustedChanges = changes.map((change) => {
        if (change.type === 'position' && change.position && change.dragging) {
          const draggedNode = nodes.find((n) => n.id === change.id);
          if (draggedNode) {
            const nodeW = parseFloat(String(draggedNode.style?.width || 180));
            const nodeH = parseFloat(String(draggedNode.style?.height || 54));
            const proposedCenterX = change.position.x + nodeW / 2;
            const proposedCenterY = change.position.y + nodeH / 2;

            const otherNodes = nodes.filter((n) => n.id !== change.id);

            let snappedX = change.position.x;
            let snappedY = change.position.y;

            // Snap X to align centers vertically
            for (const other of otherNodes) {
              const otherW = parseFloat(String(other.style?.width || 180));
              const otherCenterX = other.position.x + otherW / 2;
              if (Math.abs(proposedCenterX - otherCenterX) <= SNAP_THRESHOLD) {
                snappedX = Math.round(otherCenterX - nodeW / 2);
                break;
              }
            }

            // Snap Y to align horizontally
            for (const other of otherNodes) {
              const otherH = parseFloat(String(other.style?.height || 54));
              const otherCenterY = other.position.y + otherH / 2;
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

  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const finalPos = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      userMovedNodes.current.set(node.id, finalPos);
    },
    []
  );

  // Click on node: highlights line in pseudocode
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const lineNum = node.data?.lineNumber as number | undefined;
      if (lineNum && onNodeSelect) {
        onNodeSelect(lineNum, node.id);
      }
    },
    [onNodeSelect]
  );

  // Apply layout
  const applyLayout = useCallback(
    (resetManualPositions = false) => {
      if (rawNodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      if (resetManualPositions) {
        userMovedNodes.current.clear();
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = getStructureLayoutedElements(
        rawNodes,
        rawEdges
      );

      // Preserve manually moved nodes
      if (userMovedNodes.current.size > 0 && !resetManualPositions) {
        layoutedNodes.forEach((n) => {
          if (userMovedNodes.current.has(n.id)) {
            n.position = { ...userMovedNodes.current.get(n.id)! };
          }
        });
      }

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      if (isFirstLayout.current || resetManualPositions) {
        isFirstLayout.current = false;
        setTimeout(() => {
          fitView({ padding: 0.2, maxZoom: 1, duration: 250 });
        }, 60);
      }
    },
    [rawNodes, rawEdges, setNodes, setEdges, fitView]
  );

  useEffect(() => {
    applyLayout(false);
  }, [applyLayout]);

  // High-resolution cropped image export
  const exportImage = useCallback(
    async (_format: 'png' | 'svg' = 'png', filename = 'structure-chart') => {
      const currentNodes = getNodes();
      if (currentNodes.length === 0) {
        alert('Structure Chart kosong. Masukkan kode modul terlebih dahulu.');
        return;
      }

      const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportEl) return;

      try {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        currentNodes.forEach((node) => {
          const nx = node.position.x;
          const ny = node.position.y;
          const nw = (node.measured?.width ?? parseFloat(String(node.style?.width || 180))) || 180;
          const nh = (node.measured?.height ?? parseFloat(String(node.style?.height || 54))) || 54;

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
        console.error('Failed to export structure chart PNG:', err);
        alert('Gagal mengekspor gambar. Silakan coba lagi.');
      }
    },
    [getNodes]
  );

  const getNodePositions = useCallback(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      posMap[n.id] = {
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      };
    });
    return posMap;
  }, [nodes]);

  const resetPositions = useCallback(() => {
    applyLayout(true);
  }, [applyLayout]);

  useImperativeHandle(ref, () => ({
    exportImage,
    getNodePositions,
    resetPositions,
  }));

  const nodeCount = nodes.length;

  return (
    <div className="w-full h-full relative bg-slate-50 select-none">
      {rawNodes.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3">
            <Focus className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada modul Structure Chart</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Tulis nama modul di editor sebelah kiri atau gunakan tombol template / preset di atas.
          </p>
        </div>
      ) : null}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={14} size={1.2} color="#cbd5e1" />
        <Controls
          showInteractive={false}
          className="!bg-white !border-slate-200 !shadow-xs !rounded-lg overflow-hidden"
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !border-slate-200 !rounded-lg !shadow-xs hidden md:block"
          nodeColor="#2563eb"
        />

        {/* Floating Canvas Toolbar */}
        <Panel position="top-left" className="!m-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {/* Status Pill */}
          <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-2xs px-2.5 py-1 rounded-lg flex items-center gap-2 text-[11px] font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>{nodeCount} Modul</span>
          </div>

          {/* Fit View Button */}
          <button
            onClick={() => fitView({ padding: 0.2, maxZoom: 1, duration: 250 })}
            className="px-2 py-1 bg-white/95 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Pusatkan Tampilan Diagram"
          >
            <Focus className="w-3.5 h-3.5 text-blue-600" />
            <span>Pusatkan</span>
          </button>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="px-2 py-1 bg-white/95 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Normal</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>
          )}

          {/* Reset Layout Button */}
          <button
            onClick={resetPositions}
            className="p-1 bg-white/95 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg transition-all shadow-2xs cursor-pointer"
            title="Reset Tata Letak ke Posisi Awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
});

StructureChartPreviewContent.displayName = 'StructureChartPreviewContent';

export const StructureChartPreview = forwardRef<
  StructureChartPreviewRef,
  StructureChartPreviewProps
>((props, ref) => {
  return (
    <ReactFlowProvider>
      <StructureChartPreviewContent {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

StructureChartPreview.displayName = 'StructureChartPreview';
