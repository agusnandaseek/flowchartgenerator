import dagre from 'dagre';
import { type Node, type Edge, MarkerType, Position } from '@xyflow/react';
import type { IpoFunction, IpoConnection } from '../types/ipoChart';

export function getIpoRelationshipElements(
  functions: IpoFunction[],
  connections: IpoConnection[],
  direction: 'TB' | 'LR' = 'TB',
  customPositions?: Record<string, { x: number; y: number }> | null
): { nodes: Node[]; edges: Edge[] } {
  if (functions.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 90, // Spasi horizontal yang lebih lega (sebelumnya 60)
    ranksep: 115, // Spasi vertikal yang lebih lega (sebelumnya 80)
    marginx: 50,
    marginy: 50,
  });

  const NODE_WIDTH = 230;
  const NODE_HEIGHT = 120;

  // 1. Add nodes to Dagre graph
  const nodes: Node[] = functions.map((fn) => {
    dagreGraph.setNode(fn.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    return {
      id: fn.id,
      type: 'ipoFunction',
      data: { fn },
      position: { x: 0, y: 0 },
      style: { width: NODE_WIDTH },
    };
  });

  // 2. Add edges only from manual user connections
  const edges: Edge[] = [];
  const fnMap = new Map(functions.map((f) => [f.id, f]));

  connections.forEach((conn) => {
    const srcFn = fnMap.get(conn.sourceFunctionId);
    const tgtFn = fnMap.get(conn.targetFunctionId);
    if (!srcFn || !tgtFn) return;

    const srcOut = srcFn.outputs.find((o) => o.id === conn.sourceOutputId);
    const tgtIn = tgtFn.inputs.find((i) => i.id === conn.targetInputId);

    const edgeLabel = conn.label?.trim()
      ? conn.label.trim()
      : srcOut?.name
      ? srcOut.name
      : tgtIn?.name
      ? tgtIn.name
      : '';

    const edgeColor = conn.color?.trim() || (srcFn.type === 'database' || tgtFn.type === 'database' ? '#9333ea' : '#4f46e5');

    edges.push({
      id: conn.id,
      source: conn.sourceFunctionId,
      target: conn.targetFunctionId,
      type: 'ipoRelationshipEdge',
      sourceHandle: conn.sourceHandle || 'source-bottom',
      targetHandle: conn.targetHandle || 'target-top',
      data: {
        connectionId: conn.id,
        color: edgeColor,
        lineStyle: conn.lineStyle || 'solid',
        sourceOutputId: conn.sourceOutputId,
        targetInputId: conn.targetInputId,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        labelPosition: typeof conn.labelPosition === 'number' ? conn.labelPosition : 0.5,
        label: edgeLabel,
      },
      label: edgeLabel,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
        fill: 'none',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 18,
        height: 18,
      },
    });

    // Rank database blocks below functions that read/write them by default
    if (srcFn.type === 'database' && tgtFn.type !== 'database') {
      dagreGraph.setEdge(conn.targetFunctionId, conn.sourceFunctionId);
    } else {
      dagreGraph.setEdge(conn.sourceFunctionId, conn.targetFunctionId);
    }
  });

  // 3. Compute layout with Dagre
  dagre.layout(dagreGraph);

  const rawLayoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    const dagrePos = {
      x: Math.round(nodeWithPos.x - NODE_WIDTH / 2),
      y: Math.round(nodeWithPos.y - NODE_HEIGHT / 2),
    };

    // If custom position was manually saved by user, prioritize it!
    const finalPos = customPositions && customPositions[node.id]
      ? customPositions[node.id]
      : dagrePos;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: finalPos,
    };
  });

  const layoutedEdges = updateIpoEdgeHandles(edges, rawLayoutedNodes, connections);

  // Kumpulkan handle yang aktif terhubung ke edge untuk menyembunyikan dot yang tidak terpakai
  const connectedHandlesMap = new Map<string, Set<string>>();
  layoutedEdges.forEach((e) => {
    if (e.source && e.sourceHandle) {
      const set = connectedHandlesMap.get(e.source) || new Set<string>();
      set.add(e.sourceHandle);
      connectedHandlesMap.set(e.source, set);
    }
    if (e.target && e.targetHandle) {
      const set = connectedHandlesMap.get(e.target) || new Set<string>();
      set.add(e.targetHandle);
      connectedHandlesMap.set(e.target, set);
    }
  });

  const layoutedNodes = rawLayoutedNodes.map((n) => ({
    ...n,
    data: {
      ...(n.data as any),
      connectedHandles: Array.from(connectedHandlesMap.get(n.id) || []),
    },
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

/**
 * Menyesuaikan handle koneksi (atas, bawah, kiri, kanan) secara otomatis serta mencegah overlap garis.
 * Mendukung panah dua arah (read/write) ke/dari blok Database di bawah maupun di atas function.
 */
export function updateIpoEdgeHandles(
  edges: Edge[],
  nodes: Node[],
  connections?: IpoConnection[]
): Edge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const connMap = new Map((connections || []).map((c) => [c.id, c]));

  const sourceToEdges = new Map<string, Edge[]>();
  const targetToIncoming = new Map<string, Edge[]>();

  for (const edge of edges) {
    const outList = sourceToEdges.get(edge.source) || [];
    outList.push(edge);
    sourceToEdges.set(edge.source, outList);

    const inList = targetToIncoming.get(edge.target) || [];
    inList.push(edge);
    targetToIncoming.set(edge.target, inList);
  }

  const NODE_WIDTH = 230;
  const NODE_HEIGHT = 120;
  const HORIZONTAL_THRESHOLD = 30;

  const initialEdges = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const conn = connMap.get(edge.id) || (edge.data as any);

    if (!sourceNode || !targetNode) {
      return edge;
    }

    if (conn?.sourceHandle && conn?.targetHandle) {
      if (edge.sourceHandle !== conn.sourceHandle || edge.targetHandle !== conn.targetHandle) {
        return {
          ...edge,
          sourceHandle: conn.sourceHandle,
          targetHandle: conn.targetHandle,
        };
      }
      return edge;
    }

    const sourceCenterX = sourceNode.position.x + NODE_WIDTH / 2;
    const sourceCenterY = sourceNode.position.y + NODE_HEIGHT / 2;
    const targetCenterX = targetNode.position.x + NODE_WIDTH / 2;
    const targetCenterY = targetNode.position.y + NODE_HEIGHT / 2;

    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    const isSourceDb = (sourceNode.data as any)?.fn?.type === 'database';
    const isTargetDb = (targetNode.data as any)?.fn?.type === 'database';

    // Kumpulkan semua edge yang menghubungkan pasangan node yang sama (dua arah)
    const pairEdges = edges.filter(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source)
    );
    const pairIdx = pairEdges.findIndex((e) => e.id === edge.id);

    const isVerticallyAligned = Math.abs(dx) <= 20 && Math.abs(dy) > 40;
    const isHorizontallyAligned = Math.abs(dy) <= 40 && Math.abs(dx) > 40;

    // KASUS 0A: Sejajar Lurus Secara Vertikal (|dx| <= 20) -> Pasti garis lurus vertikal tanpa belokan
    if (isVerticallyAligned) {
      const slotSuffix =
        pairEdges.length >= 2 ? (pairIdx === 0 ? '-left' : '-right') : '';
      const newSourceHandle =
        conn?.sourceHandle || (dy < 0 ? `source-top${slotSuffix}` : `source-bottom${slotSuffix}`);
      const newTargetHandle =
        conn?.targetHandle || (dy < 0 ? `target-bottom${slotSuffix}` : `target-top${slotSuffix}`);

      if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
        return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
      }
      return edge;
    }

    // KASUS 0B: Sejajar Lurus Secara Horizontal (|dy| <= 40) -> Pasti garis lurus horizontal
    if (isHorizontallyAligned) {
      const slotSuffix =
        pairEdges.length >= 2 ? (pairIdx === 0 ? '-top' : '-bottom') : '';
      const newSourceHandle =
        conn?.sourceHandle || (dx > 0 ? `source-right${slotSuffix}` : `source-left${slotSuffix}`);
      const newTargetHandle =
        conn?.targetHandle || (dx > 0 ? `target-left${slotSuffix}` : `target-right${slotSuffix}`);

      if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
        return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
      }
      return edge;
    }

    // KASUS A: Target berada di ATAS Source secara diagonal (dy < -40)
    if (dy < -40) {
      let newSourceHandle = conn?.sourceHandle || 'source-top';
      if (!conn?.sourceHandle) {
        if (pairEdges.length >= 2) {
          newSourceHandle = pairIdx === 0 ? 'source-top-left' : 'source-top-right';
        } else if (dx > 20) {
          newSourceHandle = 'source-top-right';
        } else if (dx < -20) {
          newSourceHandle = 'source-top-left';
        } else {
          newSourceHandle = 'source-top';
        }
      }

      let newTargetHandle = conn?.targetHandle || 'target-bottom';
      if (!conn?.targetHandle) {
        if (pairEdges.length >= 2) {
          newTargetHandle = pairIdx === 0 ? 'target-bottom-left' : 'target-bottom-right';
        } else if (dx > HORIZONTAL_THRESHOLD) {
          newTargetHandle = 'target-bottom-left';
        } else if (dx < -HORIZONTAL_THRESHOLD) {
          newTargetHandle = 'target-bottom-right';
        } else {
          newTargetHandle = 'target-bottom';
        }
      }

      if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
        return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
      }
      return edge;
    }

    // KASUS B: Target berada di BAWAH Source secara diagonal
    const outgoing = sourceToEdges.get(edge.source) || [];
    const distinctTargets = new Set(outgoing.map((e) => e.target));
    const incoming = targetToIncoming.get(edge.target) || [];

    // --- 1. TENTUKAN SOURCE HANDLE ---
    let newSourceHandle = conn?.sourceHandle || edge.sourceHandle || 'source-bottom';
    if (!conn?.sourceHandle) {
      if (pairEdges.length >= 2 && (isSourceDb || isTargetDb)) {
        newSourceHandle = pairIdx === 0 ? 'source-bottom-left' : 'source-bottom-right';
      } else if (distinctTargets.size >= 2 && !isTargetDb) {
        if (dx > HORIZONTAL_THRESHOLD) {
          newSourceHandle = 'source-right';
        } else if (dx < -HORIZONTAL_THRESHOLD) {
          newSourceHandle = 'source-left';
        } else {
          newSourceHandle = 'source-bottom';
        }
      } else {
        newSourceHandle = 'source-bottom';
      }
    }

    // --- 2. TENTUKAN TARGET HANDLE (ANTI-OVERLAP) ---
    let newTargetHandle = conn?.targetHandle || edge.targetHandle || 'target-top';
    if (!conn?.targetHandle) {
      if (isTargetDb) {
        const topSideDbEdges = edges.filter((e) => {
          const otherId = e.source === edge.target ? e.target : e.target === edge.target ? e.source : null;
          if (!otherId) return false;
          const otherNode = nodeMap.get(otherId);
          return otherNode && otherNode.position.y + 40 < targetNode.position.y;
        });

        if (topSideDbEdges.length >= 2) {
          newTargetHandle = dx > 20 ? 'target-top-left' : dx < -20 ? 'target-top-right' : 'target-top';
        } else if (Math.abs(dy) <= NODE_HEIGHT * 0.75) {
          if (dx > HORIZONTAL_THRESHOLD) newTargetHandle = 'target-left';
          else if (dx < -HORIZONTAL_THRESHOLD) newTargetHandle = 'target-right';
          else newTargetHandle = 'target-top';
        } else {
          newTargetHandle = 'target-top';
        }
      } else if (incoming.length > 1) {
        if (dx > HORIZONTAL_THRESHOLD) {
          newTargetHandle = 'target-left';
        } else if (dx < -HORIZONTAL_THRESHOLD) {
          newTargetHandle = 'target-right';
        } else {
          newTargetHandle = dx > 20 ? 'target-top-left' : dx < -20 ? 'target-top-right' : 'target-top';
        }
      } else {
        if (Math.abs(dy) <= NODE_HEIGHT * 0.75) {
          if (dx > HORIZONTAL_THRESHOLD) newTargetHandle = 'target-left';
          else if (dx < -HORIZONTAL_THRESHOLD) newTargetHandle = 'target-right';
          else newTargetHandle = 'target-top';
        } else {
          newTargetHandle = 'target-top';
        }
      }
    }

    if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
      return {
        ...edge,
        sourceHandle: newSourceHandle,
        targetHandle: newTargetHandle,
      };
    }

    return edge;
  });

  // Distribusi otomatis ke slot Atas (-top) dan Bawah (-bottom) jika sisi Kiri atau Kanan suatu node menerima >= 2 koneksi
  const sourceOverride = new Map<string, string>();
  const targetOverride = new Map<string, string>();

  for (const node of nodes) {
    for (const side of ['left', 'right'] as const) {
      const sideEndpoints: Array<{
        edgeId: string;
        role: 'source' | 'target';
        otherY: number;
        manual: boolean;
      }> = [];

      for (const e of initialEdges) {
        const conn = connMap.get(e.id) || (e.data as any);
        if (e.source === node.id && e.sourceHandle?.startsWith(`source-${side}`)) {
          const otherY = nodeMap.get(e.target)?.position.y ?? 0;
          const lockedSlot =
            conn?.sourceHandle?.endsWith('-top') || conn?.sourceHandle?.endsWith('-bottom');
          sideEndpoints.push({
            edgeId: e.id,
            role: 'source',
            otherY,
            manual: !!lockedSlot,
          });
        }
        if (e.target === node.id && e.targetHandle?.startsWith(`target-${side}`)) {
          const otherY = nodeMap.get(e.source)?.position.y ?? 0;
          const lockedSlot =
            conn?.targetHandle?.endsWith('-top') || conn?.targetHandle?.endsWith('-bottom');
          sideEndpoints.push({
            edgeId: e.id,
            role: 'target',
            otherY,
            manual: !!lockedSlot,
          });
        }
      }

      if (sideEndpoints.length >= 2) {
        sideEndpoints.sort((a, b) => {
          if (Math.abs(a.otherY - b.otherY) > 10) return a.otherY - b.otherY;
          return a.edgeId.localeCompare(b.edgeId);
        });

        sideEndpoints.forEach((ep, idx) => {
          if (ep.manual) return;
          const suffix =
            idx === 0 ? '-top' : idx === sideEndpoints.length - 1 ? '-bottom' : '';
          if (ep.role === 'source') {
            sourceOverride.set(ep.edgeId, `source-${side}${suffix}`);
          } else {
            targetOverride.set(ep.edgeId, `target-${side}${suffix}`);
          }
        });
      }
    }
  }

  return initialEdges.map((e) => {
    const sOvr = sourceOverride.get(e.id);
    const tOvr = targetOverride.get(e.id);
    if ((sOvr && sOvr !== e.sourceHandle) || (tOvr && tOvr !== e.targetHandle)) {
      return {
        ...e,
        sourceHandle: sOvr || e.sourceHandle,
        targetHandle: tOvr || e.targetHandle,
      };
    }
    return e;
  });
}
