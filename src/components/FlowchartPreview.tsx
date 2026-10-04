import { useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeChange,
  type NodePositionChange,
  Panel,
} from '@xyflow/react';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import {
  getLayoutedElements,
  resolveDynamicEdgeHandles,
  computeJunctionArrows,
  type FlowDensity,
  type FlowEdgeStyle,
} from '../utils/layout';
import {
  Maximize2,
  Maximize,
  Minimize2,
  RefreshCw,
  Layers,
  CornerDownRight,
  GitCommit,
  Spline,
} from 'lucide-react';
import { toPng } from 'html-to-image';

export interface FlowchartPreviewRef {
  exportImage: (format?: 'png' | 'svg', filename?: string) => Promise<void>;
  getNodePositions: () => Record<string, { x: number; y: number }>;
  setCustomPositions: (positions: Record<string, { x: number; y: number }>) => void;
  resetPositions: () => void;
}

interface FlowchartPreviewContentProps {
  rawNodes: Node[];
  rawEdges: Edge[];
  direction: 'TB' | 'LR';
  density: FlowDensity;
  onChangeDensity: (density: FlowDensity) => void;
  edgeStyle: FlowEdgeStyle;
  onChangeEdgeStyle: (style: FlowEdgeStyle) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  customNodePositions?: Record<string, { x: number; y: number }> | null;
  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;
  onNodeSelect?: (lineNumber: number, nodeId: string) => void;
}

const FlowchartPreviewContent = forwardRef<FlowchartPreviewRef, FlowchartPreviewContentProps>(
  (
    {
      rawNodes,
      rawEdges,
      direction,
      density,
      onChangeDensity,
      edgeStyle,
      onChangeEdgeStyle,
      isFullscreen,
      onToggleFullscreen,
      customNodePositions,
      onPositionsChange,
      onNodeSelect,
    },
    ref
  ) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView, getNodes, getNodesBounds } = useReactFlow();

    // Store manual positions for nodes dragged by the user
    const userMovedNodes = useRef<Map<string, { x: number; y: number }>>(
      new Map(customNodePositions ? Object.entries(customNodePositions) : [])
    );
    // Store the last positions emitted by this component to avoid self-triggered zoom-out loops
    const lastEmittedPositions = useRef<Record<string, { x: number; y: number }> | null>(null);
    const isFirstLayout = useRef<boolean>(true);

    // Smart Magnetic Snapping on drag
    const handleNodesChange = useCallback(
      (changes: NodeChange<Node>[]) => {
        const SNAP_THRESHOLD = 15;

        const adjustedChanges = changes.map((change) => {
          if (change.type === 'position' && change.position && change.dragging) {
            const draggedNode = nodes.find((n) => n.id === change.id);
            if (draggedNode) {
              const nodeW = parseFloat(String(draggedNode.style?.width || 180));
              const nodeH = parseFloat(String(draggedNode.style?.height || 44));
              const proposedCenterX = change.position.x + nodeW / 2;
              const proposedCenterY = change.position.y + nodeH / 2;

              // Find connected node IDs (parents and children)
              const connectedNodeIds = new Set<string>();
              edges.forEach((e) => {
                if (e.source === change.id) connectedNodeIds.add(e.target);
                if (e.target === change.id) connectedNodeIds.add(e.source);
              });

              // Sort other nodes so connected nodes are snapped to first
              const otherNodes = nodes.filter((n) => n.id !== change.id);
              const sortedOthers = [...otherNodes].sort((a, b) => {
                const aConn = connectedNodeIds.has(a.id) ? 1 : 0;
                const bConn = connectedNodeIds.has(b.id) ? 1 : 0;
                return bConn - aConn;
              });

              let snappedX = change.position.x;
              let snappedY = change.position.y;

              // Snap X to align centers vertically (straight vertical flow)
              for (const other of sortedOthers) {
                const otherW = parseFloat(String(other.style?.width || 180));
                const otherCenterX = other.position.x + otherW / 2;
                if (Math.abs(proposedCenterX - otherCenterX) <= SNAP_THRESHOLD) {
                  snappedX = Math.round(otherCenterX - nodeW / 2);
                  break;
                }
              }

              // Snap Y to align centers horizontally (for horizontal branches / parallel nodes)
              for (const other of sortedOthers) {
                const otherH = parseFloat(String(other.style?.height || 44));
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

        // Dynamically update connected edges during drag if handle directions flip
        const draggingPosChange = adjustedChanges.find(
          (c): c is NodePositionChange => c.type === 'position' && !!c.position && !!c.dragging
        );
        if (draggingPosChange && draggingPosChange.position) {
          const draggedId = draggingPosChange.id;
          const pos = draggingPosChange.position;
          const tempNodeMap = new Map<string, Node>();
          nodes.forEach((n) => {
            if (n.id === draggedId) {
              tempNodeMap.set(n.id, { ...n, position: pos });
            } else {
              tempNodeMap.set(n.id, n);
            }
          });

          let edgesNeedUpdate = false;
          const nextEdges = edges.map((edge) => {
            if (edge.source === draggedId || edge.target === draggedId) {
              const sNode = tempNodeMap.get(edge.source);
              const tNode = tempNodeMap.get(edge.target);
              if (sNode && tNode) {
                const handles = resolveDynamicEdgeHandles(edge, sNode, tNode, direction, edges);
                if (
                  edge.sourceHandle !== handles.sourceHandle ||
                  edge.targetHandle !== handles.targetHandle
                ) {
                  edgesNeedUpdate = true;
                  return {
                    ...edge,
                    sourceHandle: handles.sourceHandle,
                    targetHandle: handles.targetHandle,
                  };
                }
              }
            }
            return edge;
          });

          if (edgesNeedUpdate) {
            computeJunctionArrows(nextEdges, tempNodeMap, direction);
            setEdges(nextEdges);
          }
        }
      },
      [nodes, edges, direction, onNodesChange, setEdges]
    );

    const handleNodeDrag = useCallback((_: unknown, node: Node) => {
      userMovedNodes.current.set(node.id, { x: node.position.x, y: node.position.y });
    }, []);

    const handleNodeDragStop = useCallback(
      (_: unknown, node: Node) => {
        const SNAP_THRESHOLD = 18;
        const nodeW = parseFloat(String(node.style?.width || 180));
        const nodeH = parseFloat(String(node.style?.height || 44));
        let finalX = node.position.x;
        let finalY = node.position.y;
        const currentCenterX = finalX + nodeW / 2;
        const currentCenterY = finalY + nodeH / 2;

        const connectedNodeIds = new Set<string>();
        edges.forEach((e) => {
          if (e.source === node.id) connectedNodeIds.add(e.target);
          if (e.target === node.id) connectedNodeIds.add(e.source);
        });

        const otherNodes = nodes.filter((n) => n.id !== node.id);
        const sortedOthers = [...otherNodes].sort((a, b) => {
          const aConn = connectedNodeIds.has(a.id) ? 1 : 0;
          const bConn = connectedNodeIds.has(b.id) ? 1 : 0;
          return bConn - aConn;
        });

        for (const other of sortedOthers) {
          const otherW = parseFloat(String(other.style?.width || 180));
          const otherCenterX = other.position.x + otherW / 2;
          if (Math.abs(currentCenterX - otherCenterX) <= SNAP_THRESHOLD) {
            finalX = Math.round(otherCenterX - nodeW / 2);
            break;
          }
        }

        for (const other of sortedOthers) {
          const otherH = parseFloat(String(other.style?.height || 44));
          const otherCenterY = other.position.y + otherH / 2;
          if (Math.abs(currentCenterY - otherCenterY) <= SNAP_THRESHOLD) {
            finalY = Math.round(otherCenterY - nodeH / 2);
            break;
          }
        }

        const finalPos = { x: finalX, y: finalY };
        userMovedNodes.current.set(node.id, finalPos);

        const updatedNodes = nodes.map((n) => (n.id === node.id ? { ...n, position: finalPos } : n));
        setNodes(updatedNodes);

        // Re-resolve handles for connected edges with final position
        const tempNodeMap = new Map<string, Node>();
        updatedNodes.forEach((n) => tempNodeMap.set(n.id, n));

        setEdges((prevEdges) => {
          const updatedEdges = prevEdges.map((edge) => {
            if (edge.source === node.id || edge.target === node.id) {
              const sNode = tempNodeMap.get(edge.source);
              const tNode = tempNodeMap.get(edge.target);
              if (sNode && tNode) {
                const handles = resolveDynamicEdgeHandles(edge, sNode, tNode, direction, prevEdges);
                if (
                  edge.sourceHandle !== handles.sourceHandle ||
                  edge.targetHandle !== handles.targetHandle
                ) {
                  return {
                    ...edge,
                    sourceHandle: handles.sourceHandle,
                  };
                }
              }
            }
            return edge;
          });
          computeJunctionArrows(updatedEdges, tempNodeMap, direction);
          return updatedEdges;
        });

        // Notify parent of updated positions
        const allPos: Record<string, { x: number; y: number }> = {};
        updatedNodes.forEach((n) => {
          allPos[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
        });
        lastEmittedPositions.current = allPos;
        onPositionsChange?.(allPos);
      },
      [nodes, edges, direction, setNodes, setEdges, onPositionsChange]
    );

    // Layout elements whenever rawNodes, rawEdges, direction, density, or edgeStyle change
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

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          rawNodes,
          rawEdges,
          direction,
          density,
          edgeStyle
        );

        const prevNodes = getNodes();

        // 1. Stabilize positions: anchor to existing node so existing shapes NEVER jump/move
        if (prevNodes.length > 0 && !resetManualPositions) {
          const prevMap = new Map<string, Node>();
          prevNodes.forEach((pn) => prevMap.set(pn.id, pn));

          // Find first node that exists in both previous and new graph (prefer un-moved node)
          const anchorNode =
            layoutedNodes.find((ln) => prevMap.has(ln.id) && !userMovedNodes.current.has(ln.id)) ||
            layoutedNodes.find((ln) => prevMap.has(ln.id));

          if (anchorNode) {
            const prevAnchor = prevMap.get(anchorNode.id)!;
            const deltaX = prevAnchor.position.x - anchorNode.position.x;
            const deltaY = prevAnchor.position.y - anchorNode.position.y;

            layoutedNodes.forEach((n) => {
              if (userMovedNodes.current.has(n.id)) {
                // Keep exact user-moved position
                n.position = { ...userMovedNodes.current.get(n.id)! };
              } else {
                // Apply anchor delta to keep node steady
                n.position.x += deltaX;
                n.position.y += deltaY;
              }
            });
          } else {
            // Apply any user-moved positions if IDs match
            layoutedNodes.forEach((n) => {
              if (userMovedNodes.current.has(n.id)) {
                n.position = { ...userMovedNodes.current.get(n.id)! };
              }
            });
          }
        } else {
          // Preserve any existing user-moved positions
          layoutedNodes.forEach((n) => {
            if (userMovedNodes.current.has(n.id)) {
              n.position = { ...userMovedNodes.current.get(n.id)! };
            }
          });
        }

        // 2. If any node has a manual position, re-resolve edge handles for consistency
        if (userMovedNodes.current.size > 0) {
          const finalNodeMap = new Map<string, Node>();
          layoutedNodes.forEach((n) => finalNodeMap.set(n.id, n));

          layoutedEdges.forEach((edge) => {
            const sNode = finalNodeMap.get(edge.source);
            const tNode = finalNodeMap.get(edge.target);
            if (sNode && tNode) {
              const handles = resolveDynamicEdgeHandles(edge, sNode, tNode, direction, layoutedEdges);
              edge.sourceHandle = handles.sourceHandle;
              edge.targetHandle = handles.targetHandle;
            }
          });
          computeJunctionArrows(layoutedEdges, finalNodeMap, direction);
        }

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // ONLY call fitView on initial load or explicit reset, NEVER on routine keystrokes
        if (isFirstLayout.current || resetManualPositions) {
          isFirstLayout.current = false;
          setTimeout(() => {
            fitView({ padding: 0.18, maxZoom: 1, duration: 250 });
          }, 50);
        }
      },
      [rawNodes, rawEdges, direction, density, edgeStyle, setNodes, setEdges, fitView, getNodes]
    );

    useEffect(() => {
      applyLayout(false);
    }, [applyLayout]);

    // Sync custom positions when loaded externally from cloud or storage
    useEffect(() => {
      if (!customNodePositions || Object.keys(customNodePositions).length === 0) {
        return;
      }

      // Ignore if this update was triggered by our own internal node dragging (prevents zoom-out bug)
      if (customNodePositions === lastEmittedPositions.current) {
        return;
      }

      // Check if positions actually differ from current internal userMovedNodes
      let hasDifferentPositions = false;
      const customKeys = Object.keys(customNodePositions);
      if (customKeys.length !== userMovedNodes.current.size) {
        hasDifferentPositions = true;
      } else {
        for (const [id, pos] of Object.entries(customNodePositions)) {
          const current = userMovedNodes.current.get(id);
          if (
            !current ||
            Math.round(current.x) !== Math.round(pos.x) ||
            Math.round(current.y) !== Math.round(pos.y)
          ) {
            hasDifferentPositions = true;
            break;
          }
        }
      }

      // If positions are already identical to what's on the canvas, do nothing (never zoom out!)
      if (!hasDifferentPositions) {
        return;
      }

      // External load from cloud/storage: update positions and fit view
      userMovedNodes.current.clear();
      Object.entries(customNodePositions).forEach(([id, pos]) => {
        userMovedNodes.current.set(id, pos);
      });
      applyLayout(false);
      setTimeout(() => {
        fitView({ padding: 0.18, maxZoom: 1, duration: 250 });
      }, 80);
    }, [customNodePositions, applyLayout, fitView]);

    // High-resolution cropped image export with tight bounding box and ultra-sharp 3x Retina detail
    const exportImage = useCallback(
      async (format: 'png' | 'svg' = 'png', filename = 'flowchart') => {
        const currentNodes = getNodes();
        if (currentNodes.length === 0) {
          alert('Diagram kosong. Buat pseudocode terlebih dahulu.');
          return;
        }

        const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportEl) return;

        try {
          // 1. Measure all nodes and edges accurately to compute tight bounding box
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          currentNodes.forEach((node) => {
            const nx = node.position.x;
            const ny = node.position.y;
            const nw = (node.measured?.width ?? parseFloat(String(node.style?.width || 180))) || 180;
            const nh = (node.measured?.height ?? parseFloat(String(node.style?.height || 44))) || 44;

            minX = Math.min(minX, nx);
            minY = Math.min(minY, ny);
            maxX = Math.max(maxX, nx + nw);
            maxY = Math.max(maxY, ny + nh);
          });

          // Also check actual DOM elements of nodes to catch any custom padding/size
          const domNodes = document.querySelectorAll('.react-flow__node');
          domNodes.forEach((dn) => {
            const transform = (dn as HTMLElement).style.transform;
            const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
            if (match) {
              const nx = parseFloat(match[1]);
              const ny = parseFloat(match[2]);
              const nw = (dn as HTMLElement).offsetWidth || 180;
              const nh = (dn as HTMLElement).offsetHeight || 44;
              minX = Math.min(minX, nx);
              minY = Math.min(minY, ny);
              maxX = Math.max(maxX, nx + nw);
              maxY = Math.max(maxY, ny + nh);
            }
          });

          // Check all edge SVG paths (to include loop-back lines that route outside node bounds)
          const edgePaths = document.querySelectorAll('.react-flow__edge path.react-flow__edge-path');
          edgePaths.forEach((pathEl) => {
            try {
              const bbox = (pathEl as SVGGraphicsElement).getBBox();
              if (bbox.width > 0 || bbox.height > 0) {
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
              }
            } catch {}
          });

          // Check edge labels (e.g. "Ya", "Tidak")
          const edgeLabels = document.querySelectorAll('.react-flow__edge-text, .react-flow__edge-textwrapper');
          edgeLabels.forEach((el) => {
            try {
              const bbox = (el as SVGGraphicsElement).getBBox();
              if (bbox.width > 0 || bbox.height > 0) {
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
              }
            } catch {}
          });

          if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            const defaultBounds = getNodesBounds(currentNodes);
            minX = defaultBounds.x;
            minY = defaultBounds.y;
            maxX = defaultBounds.x + defaultBounds.width;
            maxY = defaultBounds.y + defaultBounds.height;
          }

          // 2. Balanced padding around the entire flowchart (clean 50px margin)
          const padding = 50;
          const contentWidth = Math.max(120, Math.ceil(maxX - minX));
          const contentHeight = Math.max(100, Math.ceil(maxY - minY));

          // Final output image dimensions tightly wrapping the flowchart
          const imageWidth = contentWidth + padding * 2;
          const imageHeight = contentHeight + padding * 2;

          // 3. Translation to place the flowchart exactly at (padding, padding) with 1:1 scale (no downscaling blur)
          const translateX = Math.round(-minX + padding);
          const translateY = Math.round(-minY + padding);

          const dataUrl = await toPng(viewportEl, {
            backgroundColor: '#ffffff',
            width: imageWidth,
            height: imageHeight,
            pixelRatio: 3, // Ultra-sharp 3x Retina resolution (300+ DPI equivalent)
            filter: (domNode) => {
              // Exclude panels, controls, or minimap if they happen to be inside
              const classList = (domNode as HTMLElement)?.classList;
              if (
                classList?.contains('react-flow__panel') ||
                classList?.contains('react-flow__controls') ||
                classList?.contains('react-flow__minimap') ||
                classList?.contains('react-flow__handle')
              ) {
                return false;
              }
              return true;
            },
            style: {
              width: `${imageWidth}px`,
              height: `${imageHeight}px`,
              transform: `translate(${translateX}px, ${translateY}px) scale(1)`,
              transformOrigin: 'top left',
            },
          });

          const a = document.createElement('a');
          const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
          a.download = `${safeName || 'flowchart'}-${Date.now()}.${format}`;
          a.href = dataUrl;
          a.click();
        } catch (err) {
          console.error('Gagal mengekspor diagram:', err);
          alert('Terjadi kesalahan saat memproses ekspor gambar.');
        }
      },
      [getNodes, getNodesBounds]
    );

    const getNodePositions = useCallback((): Record<string, { x: number; y: number }> => {
      const currentNodes = getNodes();
      const posMap: Record<string, { x: number; y: number }> = {};
      if (currentNodes && currentNodes.length > 0) {
        currentNodes.forEach((n) => {
          posMap[n.id] = {
            x: Math.round(n.position.x),
            y: Math.round(n.position.y),
          };
        });
      } else {
        nodes.forEach((n) => {
          posMap[n.id] = {
            x: Math.round(n.position.x),
            y: Math.round(n.position.y),
          };
        });
      }
      return posMap;
    }, [getNodes, nodes]);

    const setCustomPositions = useCallback(
      (newPositions: Record<string, { x: number; y: number }>) => {
        Object.entries(newPositions).forEach(([id, pos]) => {
          userMovedNodes.current.set(id, pos);
        });
        applyLayout(false);
        setTimeout(() => {
          fitView({ padding: 0.18, maxZoom: 1, duration: 250 });
        }, 80);
      },
      [applyLayout, fitView]
    );

    const resetPositions = useCallback(() => {
      lastEmittedPositions.current = null;
      applyLayout(true);
    }, [applyLayout]);

    useImperativeHandle(ref, () => ({
      exportImage,
      getNodePositions,
      setCustomPositions,
      resetPositions,
    }));

    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node) => {
        const lineNum = node.data?.lineNumber as number | undefined;
        if (lineNum && onNodeSelect) {
          onNodeSelect(lineNum, node.id);
        }
      },
      [onNodeSelect]
    );

    const nodeCount = nodes.length;

    return (
      <div className="w-full h-full relative bg-slate-50 select-none">
        {nodeCount === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-sm text-slate-600 mb-1">
              Belum Ada Flowchart
            </h3>
            <p className="text-xs max-w-xs text-slate-400">
              Tulis pseudocode di panel kanan atau pilih template untuk menghasilkan diagram alur secara otomatis.
            </p>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          minZoom={0.15}
          maxZoom={2.5}
          defaultEdgeOptions={{
            type: edgeStyle,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={14} size={1.2} color="#cbd5e1" />
          <Controls
            showInteractive={false}
            className="!bg-white !border-slate-200 !shadow-sm !rounded-lg overflow-hidden"
          />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white !border-slate-200 !rounded-lg !shadow-sm hidden md:block"
            nodeColor={(node) => {
              if (node.type === 'terminator') return '#10b981';
              if (node.type === 'decision') return '#f59e0b';
              if (node.type === 'inputOutput') return '#06b6d4';
              return '#6366f1';
            }}
          />

          {/* Floating Canvas Toolbar */}
          <Panel position="top-left" className="!m-2.5 flex flex-wrap items-center gap-1.5 z-10">
            {/* Status Pill */}
            <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-2xs px-2.5 py-1 rounded-lg flex items-center gap-2 text-[11px] font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{nodeCount} Node</span>
            </div>

            {/* Edge Style Selector (Tegas / Lurus / Lengkung) */}
            <div
              className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-2xs p-0.5 rounded-lg flex items-center gap-0.5 text-[11px]"
              title="Bentuk Garis Panah Flowchart"
            >
              <button
                onClick={() => onChangeEdgeStyle('step')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  edgeStyle === 'step'
                    ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Garis Tegas 90 Derajat (Orthogonal Step - Standar Flowchart)"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Tegas 90°</span>
              </button>

              <button
                onClick={() => onChangeEdgeStyle('straight')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  edgeStyle === 'straight'
                    ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Garis Lurus Langsung (Direct Straight)"
              >
                <GitCommit className="w-3 h-3" />
                <span>Lurus</span>
              </button>

              <button
                onClick={() => onChangeEdgeStyle('smoothstep')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  edgeStyle === 'smoothstep'
                    ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Garis Sudut Melengkung (Smoothstep)"
              >
                <Spline className="w-3 h-3" />
                <span>Lengkung</span>
              </button>
            </div>

            {/* Density Selector (Rapat / Sedang / Renggang) */}
            <div
              className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-2xs p-0.5 rounded-lg flex items-center gap-0.5 text-[11px]"
              title="Kerapatan / Jarak Antar Node Flowchart"
            >
              <button
                onClick={() => onChangeDensity('compact')}
                className={`px-2 py-0.5 rounded transition-all ${
                  density === 'compact'
                    ? 'bg-slate-800 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Jarak Rapat (Tersusun rapi dan hemat ruang)"
              >
                Rapat
              </button>

              <button
                onClick={() => onChangeDensity('normal')}
                className={`px-2 py-0.5 rounded transition-all ${
                  density === 'normal'
                    ? 'bg-slate-800 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Jarak Sedang"
              >
                Sedang
              </button>

              <button
                onClick={() => onChangeDensity('spacious')}
                className={`px-2 py-0.5 rounded transition-all ${
                  density === 'spacious'
                    ? 'bg-slate-800 text-white font-medium shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Jarak Renggang"
              >
                Renggang
              </button>
            </div>

            {/* Fit to View & Re-layout buttons */}
            <button
              onClick={() => fitView({ padding: 0.18, maxZoom: 1, duration: 250 })}
              className="bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs px-2 py-1 rounded-lg text-[11px] font-medium text-slate-700 flex items-center gap-1 transition-all"
              title="Pusatkan Tampilan Diagram (Fit View)"
            >
              <Maximize2 className="w-3 h-3 text-indigo-600" />
              <span>Pusatkan</span>
            </button>

            {/* Fullscreen Flowchart Toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className={`border border-slate-200 shadow-2xs px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  isFullscreen
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600'
                }`}
                title={
                  isFullscreen
                    ? 'Tampilkan Menu Code (Keluar Layar Penuh)'
                    : 'Layar Penuh Flowchart (Sembunyikan Menu Code)'
                }
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Tampilkan Code</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Layar Penuh</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => applyLayout(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs p-1 rounded-lg text-[11px] font-medium text-slate-700 flex items-center transition-all"
              title="Tata Ulang Otomatis (Reset Posisi Manual)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          </Panel>
        </ReactFlow>
      </div>
    );
  }
);

FlowchartPreviewContent.displayName = 'FlowchartPreviewContent';

interface FlowchartPreviewProps extends FlowchartPreviewContentProps {}

export const FlowchartPreview = forwardRef<FlowchartPreviewRef, FlowchartPreviewProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <FlowchartPreviewContent {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

FlowchartPreview.displayName = 'FlowchartPreview';
