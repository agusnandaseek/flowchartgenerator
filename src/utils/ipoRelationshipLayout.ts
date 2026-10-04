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

    const edgeColor = conn.color?.trim() || '#4f46e5';

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

    dagreGraph.setEdge(conn.sourceFunctionId, conn.targetFunctionId);
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
 * Menyesuaikan handle koneksi (kiri, kanan, bawah) secara otomatis serta mencegah overlap garis.
 * - Mendukung titik handle spesifik (per-output pin atau per-input pin) yang dipilih pengguna.
 * - Anti-Overlap: Jika target block menerima 2 atau lebih koneksi (seperti pada contoh PrintInvoice),
 *   garis dari samping masuk via handle samping (target-left/target-right),
 *   sedangkan garis dari atas didistribusikan secara terpisah (target-top-left / target-top-right).
 */
export function updateIpoEdgeHandles(
  edges: Edge[],
  nodes: Node[],
  connections?: IpoConnection[]
): Edge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const connMap = new Map((connections || []).map((c) => [c.id, c]));

  // Kelompokkan edge keluar berdasarkan source
  const sourceToEdges = new Map<string, Edge[]>();
  // Kelompokkan edge masuk berdasarkan target untuk deteksi & pencegahan overlap
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

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const conn = connMap.get(edge.id) || (edge.data as any);

    if (!sourceNode || !targetNode) {
      return edge;
    }

    // Jika pengguna secara manual menetapkan kedua handle kustom, prioritaskan pilihan pengguna
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

    const dx = targetCenterX - sourceCenterX; // Positif jika target di sebelah kanan source
    const dy = targetCenterY - sourceCenterY; // Positif jika target di bawah source

    const outgoing = sourceToEdges.get(edge.source) || [];
    const distinctTargets = new Set(outgoing.map((e) => e.target));
    const incoming = targetToIncoming.get(edge.target) || [];

    // --- 1. TENTUKAN SOURCE HANDLE ---
    let newSourceHandle = conn?.sourceHandle || edge.sourceHandle || 'source-bottom';
    if (!conn?.sourceHandle) {
      if (distinctTargets.size >= 2) {
        if (dx > HORIZONTAL_THRESHOLD) {
          // Target berada di sebelah KANAN source
          newSourceHandle = 'source-right';
        } else if (dx < -HORIZONTAL_THRESHOLD) {
          // Target berada di sebelah KIRI source
          newSourceHandle = 'source-left';
        } else {
          // Target lurus di bawah source
          newSourceHandle = 'source-bottom';
        }
      } else {
        newSourceHandle = 'source-bottom';
      }
    }

    // --- 2. TENTUKAN TARGET HANDLE (ANTI-OVERLAP) ---
    let newTargetHandle = conn?.targetHandle || edge.targetHandle || 'target-top';
    if (!conn?.targetHandle) {
      // Jika target block menerima 2 atau lebih koneksi (seperti pada PrintInvoice):
      if (incoming.length > 1) {
        // Jika source datang dari sebelah KIRI target (dx > HORIZONTAL_THRESHOLD)
        if (dx > HORIZONTAL_THRESHOLD) {
          newTargetHandle = 'target-left';
        }
        // Jika source datang dari sebelah KANAN target (dx < -HORIZONTAL_THRESHOLD)
        else if (dx < -HORIZONTAL_THRESHOLD) {
          newTargetHandle = 'target-right';
        }
        // Jika source datang dari ATAS target
        else {
          // Pisahkan garis-garis yang datang dari atas agar tidak bertumpuk
          const incomingFromAbove = incoming.filter((e) => {
            const s = nodeMap.get(e.source);
            return s && targetNode.position.y > s.position.y + 40;
          });

          if (incomingFromAbove.length >= 2) {
            // Urutkan berdasarkan koordinat X dari sumbernya
            incomingFromAbove.sort((a, b) => {
              const sa = nodeMap.get(a.source)?.position.x || 0;
              const sb = nodeMap.get(b.source)?.position.x || 0;
              return sa - sb;
            });
            const idx = incomingFromAbove.findIndex((e) => e.id === edge.id);
            if (idx === 0) {
              newTargetHandle = 'target-top-left';
            } else if (idx === incomingFromAbove.length - 1) {
              newTargetHandle = 'target-top-right';
            } else {
              newTargetHandle = 'target-top';
            }
          } else {
            newTargetHandle = 'target-top';
          }
        }
      } else {
        // Hanya 1 garis masuk ke target block ini
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
}
