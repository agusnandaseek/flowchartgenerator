import dagre from 'dagre';
import { type Node, type Edge, MarkerType, Position } from '@xyflow/react';

export type FlowDensity = 'compact' | 'normal' | 'spacious';
export type FlowEdgeStyle = 'step' | 'straight' | 'smoothstep';

/**
 * Standardized node dimension estimation with even integers
 * to prevent subpixel coordinate drifting and line bending.
 */
export function estimateNodeSize(label: string, type: string) {
  const text = label || '';
  const len = text.length;
  const BASE_WIDTH = 180;

  if (type === 'decision') {
    const width = Math.max(BASE_WIDTH, Math.min(280, Math.ceil((len * 7.5 + 46) / 2) * 2));
    const lines = Math.max(1, Math.ceil(len / 22));
    const height = Math.max(56, Math.ceil((lines * 18 + 36) / 2) * 2);
    return { width, height };
  }

  if (type === 'inputOutput') {
    const width = Math.max(BASE_WIDTH, Math.min(280, Math.ceil((len * 7.5 + 40) / 2) * 2));
    const lines = Math.max(1, Math.ceil(len / 22));
    const height = Math.max(46, Math.ceil((lines * 18 + 26) / 2) * 2);
    return { width, height };
  }

  if (type === 'terminator') {
    const width = Math.max(BASE_WIDTH, Math.min(260, Math.ceil((len * 7.5 + 36) / 2) * 2));
    const lines = Math.max(1, Math.ceil(len / 20));
    const height = Math.max(42, Math.ceil((lines * 16 + 22) / 2) * 2);
    return { width, height };
  }

  // default 'process'
  const width = Math.max(BASE_WIDTH, Math.min(280, Math.ceil((len * 7.5 + 36) / 2) * 2));
  const lines = Math.max(1, Math.ceil(len / 22));
  const height = Math.max(44, Math.ceil((lines * 18 + 24) / 2) * 2);
  return { width, height };
}

const DENSITY_CONFIG: Record<FlowDensity, { nodesep: number; ranksep: number }> = {
  compact: { nodesep: 35, ranksep: 40 },
  normal: { nodesep: 50, ranksep: 55 },
  spacious: { nodesep: 70, ranksep: 75 },
};

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB',
  density: FlowDensity = 'compact',
  edgeStyle: FlowEdgeStyle = 'step'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  const { nodesep, ranksep } = DENSITY_CONFIG[density] || DENSITY_CONFIG.compact;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? nodesep + 15 : nodesep,
    ranksep: isHorizontal ? ranksep + 20 : ranksep,
    edgesep: 25,
  });

  nodes.forEach((node) => {
    const label = (node.data?.label as string) || '';
    const { width, height } = estimateNodeSize(label, node.type || 'process');
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    // Primary vertical spine edges get high weight to enforce strict alignment
    const isVerticalSpine = !edge.sourceHandle || edge.sourceHandle === 'bottom';
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: isVerticalSpine ? 5 : 1,
      minlen: 1,
    });
  });

  dagre.layout(dagreGraph);

  // Initial layout assignment with explicit style dimensions
  const layoutedNodes: Node[] = nodes.map((node) => {
    const label = (node.data?.label as string) || '';
    const { width, height } = estimateNodeSize(label, node.type || 'process');
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: Math.round(nodeWithPosition.x - width / 2),
        y: Math.round(nodeWithPosition.y - height / 2),
      },
      style: {
        ...node.style,
        width: `${width}px`,
        height: `${height}px`,
      },
    };
  });

  // Strict alignment pass for sequential nodes (guarantees 100% straight connections without bends)
  const nodeMap = new Map<string, Node>();
  layoutedNodes.forEach((n) => nodeMap.set(n.id, n));

  edges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) return;

    if (!isHorizontal) {
      // For Top-Bottom flow: check if connection is straight downward (bottom -> top)
      const isDirectDown =
        (!edge.sourceHandle || edge.sourceHandle === 'bottom') &&
        (!edge.targetHandle || edge.targetHandle === 'top');

      if (isDirectDown) {
        const sourceW = parseFloat(String(sourceNode.style?.width || 180));
        const targetW = parseFloat(String(targetNode.style?.width || 180));
        const sourceCenterX = sourceNode.position.x + sourceW / 2;
        const targetCenterX = targetNode.position.x + targetW / 2;

        // If nodes are along the same flow column (within 35px), snap target to exact same center axis
        if (Math.abs(sourceCenterX - targetCenterX) <= 35) {
          targetNode.position.x = Math.round(sourceCenterX - targetW / 2);
        }
      }
    } else {
      // For Left-Right flow: check if connection is straight horizontal (right -> left)
      const isDirectRight =
        (!edge.sourceHandle || edge.sourceHandle === 'right') &&
        (!edge.targetHandle || edge.targetHandle === 'left');

      if (isDirectRight) {
        const sourceH = parseFloat(String(sourceNode.style?.height || 44));
        const targetH = parseFloat(String(targetNode.style?.height || 44));
        const sourceCenterY = sourceNode.position.y + sourceH / 2;
        const targetCenterY = targetNode.position.y + targetH / 2;

        if (Math.abs(sourceCenterY - targetCenterY) <= 35) {
          targetNode.position.y = Math.round(sourceCenterY - targetH / 2);
        }
      }
    }
  });

  const styledEdges = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    let resolvedSourceHandle = edge.sourceHandle;
    let resolvedTargetHandle = edge.targetHandle;

    if (sourceNode && targetNode) {
      const handles = resolveDynamicEdgeHandles(edge, sourceNode, targetNode, direction, edges);
      resolvedSourceHandle = handles.sourceHandle;
      resolvedTargetHandle = handles.targetHandle;
    }

    return {
      ...edge,
      sourceHandle: resolvedSourceHandle,
      targetHandle: resolvedTargetHandle,
      type: edgeStyle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: edge.label === 'Tidak' ? '#f43f5e' : edge.label === 'Ya' ? '#10b981' : '#64748b',
      },
      style: {
        strokeWidth: 1.8,
        stroke: edge.label === 'Tidak' ? '#f43f5e' : edge.label === 'Ya' ? '#10b981' : '#64748b',
        ...((edge.style as Record<string, unknown>) || {}),
      },
      labelStyle: {
        fill: edge.label === 'Tidak' ? '#e11d48' : edge.label === 'Ya' ? '#059669' : '#475569',
        fontWeight: 600,
        fontSize: 10,
      },
      labelBgStyle: {
        fill: '#ffffff',
        fillOpacity: 0.95,
        stroke: edge.label === 'Tidak' ? '#fecdd3' : edge.label === 'Ya' ? '#a7f3d0' : '#e2e8f0',
        strokeWidth: 1,
        rx: 3,
        ry: 3,
      },
      labelBgPadding: [3, 5] as [number, number],
    };
  });

  computeJunctionArrows(styledEdges as Edge[], nodeMap, direction);

  return { nodes: layoutedNodes, edges: styledEdges as Edge[] };
}

/**
 * Detects confluence points (persimpangan) where multiple edges merge into the same target handle.
 * Places directional arrowheads on the incoming/lower overlapping edge at the junction point
 * so its direction of flow is 100% visible and readable.
 */
export function computeJunctionArrows(
  edges: Edge[],
  nodeMap: Map<string, Node>,
  direction: 'TB' | 'LR' = 'TB'
): void {
  // Clear any existing junctionArrows first to prevent accumulation
  edges.forEach((e) => {
    if (e.data && (e.data as Record<string, unknown>).junctionArrows) {
      delete (e.data as Record<string, unknown>).junctionArrows;
    }
  });

  // Group edges by target and targetHandle
  const targetHandleGroups = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = `${edge.target}__${edge.targetHandle || (direction === 'TB' ? 'top' : 'left')}`;
    if (!targetHandleGroups.has(key)) {
      targetHandleGroups.set(key, []);
    }
    targetHandleGroups.get(key)!.push(edge);
  }

  for (const [, groupEdges] of targetHandleGroups.entries()) {
    if (groupEdges.length < 2) continue;

    const targetNode = nodeMap.get(groupEdges[0].target);
    if (!targetNode) continue;

    const targetW = parseFloat(String(targetNode.style?.width || 180));
    const targetH = parseFloat(String(targetNode.style?.height || 44));
    const targetCenterX = targetNode.position.x + targetW / 2;
    const targetCenterY = targetNode.position.y + targetH / 2;

    const targetHandle = groupEdges[0].targetHandle || (direction === 'TB' ? 'top' : 'left');

    let targetHandleX = targetCenterX;
    let targetHandleY = targetCenterY;
    if (targetHandle === 'left') {
      targetHandleX = targetNode.position.x;
    } else if (targetHandle === 'right') {
      targetHandleX = targetNode.position.x + targetW;
    } else if (targetHandle === 'top') {
      targetHandleY = targetNode.position.y;
    } else if (targetHandle === 'bottom') {
      targetHandleY = targetNode.position.y + targetH;
    }

    if (targetHandle === 'left') {
      // Multiple edges approach targetHandle from the left
      const edgeInfos = groupEdges.map((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        if (!sourceNode) return { edge, turnX: targetHandleX - 100, sourceY: 0 };
        const sourceW = parseFloat(String(sourceNode.style?.width || 180));
        const sourceH = parseFloat(String(sourceNode.style?.height || 44));
        const sourceCenterX = sourceNode.position.x + sourceW / 2;
        const sourceCenterY = sourceNode.position.y + sourceH / 2;
        const sHandle = edge.sourceHandle || 'bottom';

        let turnX = sourceCenterX;
        if (sHandle === 'left') {
          turnX = sourceNode.position.x - 20;
        } else if (sHandle === 'right') {
          turnX = sourceNode.position.x + sourceW + 20;
        } else if (sHandle === 'top' || sHandle === 'bottom') {
          turnX = sourceCenterX;
        }
        return { edge, turnX, sourceY: sourceCenterY };
      });

      // Sort by turnX ascending (outermost / furthest left first)
      edgeInfos.sort((a, b) => a.turnX - b.turnX);

      for (let i = 0; i < edgeInfos.length - 1; i++) {
        const lowerEdge = edgeInfos[i].edge;
        const nextEdge = edgeInfos[i + 1];

        // The intersection point where nextEdge joins lowerEdge's horizontal line
        const junctionX = Math.round(nextEdge.turnX - 4);
        const junctionY = Math.round(targetHandleY);

        const currentArrows =
          ((lowerEdge.data as Record<string, unknown>)?.junctionArrows as Array<unknown>) || [];
        lowerEdge.data = {
          ...(lowerEdge.data || {}),
          junctionArrows: [
            ...currentArrows,
            {
              x: junctionX,
              y: junctionY,
              angle: 0, // pointing right towards target
              color:
                lowerEdge.label === 'Tidak'
                  ? '#f43f5e'
                  : lowerEdge.label === 'Ya'
                  ? '#10b981'
                  : '#64748b',
            },
          ],
        };
      }
    } else if (targetHandle === 'right') {
      const edgeInfos = groupEdges.map((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        if (!sourceNode) return { edge, turnX: targetHandleX + 100 };
        const sourceW = parseFloat(String(sourceNode.style?.width || 180));
        const sourceCenterX = sourceNode.position.x + sourceW / 2;
        const sHandle = edge.sourceHandle || 'bottom';

        let turnX = sourceCenterX;
        if (sHandle === 'right') {
          turnX = sourceNode.position.x + sourceW + 20;
        } else if (sHandle === 'left') {
          turnX = sourceNode.position.x - 20;
        }
        return { edge, turnX };
      });

      edgeInfos.sort((a, b) => b.turnX - a.turnX);

      for (let i = 0; i < edgeInfos.length - 1; i++) {
        const lowerEdge = edgeInfos[i].edge;
        const nextEdge = edgeInfos[i + 1];

        const junctionX = Math.round(nextEdge.turnX + 4);
        const junctionY = Math.round(targetHandleY);

        const currentArrows =
          ((lowerEdge.data as Record<string, unknown>)?.junctionArrows as Array<unknown>) || [];
        lowerEdge.data = {
          ...(lowerEdge.data || {}),
          junctionArrows: [
            ...currentArrows,
            {
              x: junctionX,
              y: junctionY,
              angle: 180, // pointing left towards target
              color:
                lowerEdge.label === 'Tidak'
                  ? '#f43f5e'
                  : lowerEdge.label === 'Ya'
                  ? '#10b981'
                  : '#64748b',
            },
          ],
        };
      }
    } else if (targetHandle === 'top') {
      const edgeInfos = groupEdges.map((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        const sourceH = parseFloat(String(sourceNode?.style?.height || 44));
        const sourceCenterY = (sourceNode?.position.y || 0) + sourceH / 2;
        return { edge, turnY: sourceCenterY };
      });

      edgeInfos.sort((a, b) => a.turnY - b.turnY);

      for (let i = 0; i < edgeInfos.length - 1; i++) {
        const lowerEdge = edgeInfos[i].edge;
        const nextEdge = edgeInfos[i + 1];

        const junctionX = Math.round(targetHandleX);
        const junctionY = Math.round(nextEdge.turnY - 4);

        const currentArrows =
          ((lowerEdge.data as Record<string, unknown>)?.junctionArrows as Array<unknown>) || [];
        lowerEdge.data = {
          ...(lowerEdge.data || {}),
          junctionArrows: [
            ...currentArrows,
            {
              x: junctionX,
              y: junctionY,
              angle: 90, // pointing down towards target
              color:
                lowerEdge.label === 'Tidak'
                  ? '#f43f5e'
                  : lowerEdge.label === 'Ya'
                  ? '#10b981'
                  : '#64748b',
            },
          ],
        };
      }
    }
  }
}

/**
 * Resolves sourceHandle and targetHandle dynamically based on relative position,
 * flow direction, loop returns, and horizontal alignments.
 */
export function resolveDynamicEdgeHandles(
  edge: Edge,
  sourceNode: Node,
  targetNode: Node,
  direction: 'TB' | 'LR' = 'TB',
  allEdges?: Edge[]
): { sourceHandle: string; targetHandle: string } {
  const sourceW = parseFloat(String(sourceNode.style?.width || 180));
  const sourceH = parseFloat(String(sourceNode.style?.height || 44));
  const targetW = parseFloat(String(targetNode.style?.width || 180));
  const targetH = parseFloat(String(targetNode.style?.height || 44));

  const sourceCenterX = sourceNode.position.x + sourceW / 2;
  const sourceCenterY = sourceNode.position.y + sourceH / 2;
  const targetCenterX = targetNode.position.x + targetW / 2;
  const targetCenterY = targetNode.position.y + targetH / 2;

  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;

  const isLoopReturn =
    (edge.data as Record<string, unknown>)?.isLoopReturn === true ||
    (direction === 'TB' ? dy < -30 : dx < -30);

  if (direction === 'TB') {
    // 1. Looping return flow (returning upwards to block awal)
    if (isLoopReturn) {
      // Check if source node has an incoming edge entering its 'top' handle
      const isTopOccupied = allEdges
        ? allEdges.some(
            (e) =>
              e.id !== edge.id &&
              e.target === sourceNode.id &&
              (!e.targetHandle || e.targetHandle === 'top')
          )
        : false;

      // If block awal (target) is to the right (source is on the left)
      if (dx > 40) {
        if (!isTopOccupied && dy < -60) {
          return { sourceHandle: 'top', targetHandle: 'left' };
        }
        // Exiting left keeps the line on the outer left margin, preventing crossing any horizontal connections
        return { sourceHandle: 'left', targetHandle: 'left' };
      }

      // If block awal (target) is to the left (source is on the right)
      if (dx < -40) {
        if (!isTopOccupied && dy < -60) {
          return { sourceHandle: 'top', targetHandle: 'right' };
        }
        // Exiting right keeps the line on the outer right margin
        return { sourceHandle: 'right', targetHandle: 'right' };
      }

      // If block awal is directly above (same column):
      // Outer bypass loop on left margin
      return { sourceHandle: 'left', targetHandle: 'left' };
    }

    // 2. Horizontal alignment check (2 shapes side-by-side or horizontally dominant)
    // - Nearly same horizontal level: |dy| <= max(sourceH, targetH) + 20
    // - Or horizontal distance dominates vertical distance: |dx| > |dy| * 1.15 and |dx| >= 50
    const isHorizontallyAligned =
      Math.abs(dy) <= Math.max(sourceH, targetH) + 20 ||
      (Math.abs(dx) > Math.abs(dy) * 1.15 && Math.abs(dx) >= 50);

    if (isHorizontallyAligned) {
      if (dx > 0) {
        // Target is to the right of source
        return {
          sourceHandle: 'right',
          targetHandle: Math.abs(dy) <= 45 ? 'left' : dy > 0 ? 'top' : 'left',
        };
      } else {
        // Target is to the left of source
        return {
          sourceHandle: 'left',
          targetHandle: Math.abs(dy) <= 45 ? 'right' : dy > 0 ? 'top' : 'right',
        };
      }
    }

    // 3. Decision branches with custom semantics
    if (sourceNode.type === 'decision') {
      if (edge.label === 'Tidak') {
        if (dx > 40) return { sourceHandle: 'right', targetHandle: dy > 50 ? 'top' : 'left' };
        if (dx < -40) return { sourceHandle: 'left', targetHandle: dy > 50 ? 'top' : 'right' };
        return { sourceHandle: 'right', targetHandle: 'top' };
      }
      if (edge.label === 'Ya') {
        if (dx > 60 && Math.abs(dx) > Math.abs(dy)) return { sourceHandle: 'right', targetHandle: 'left' };
        if (dx < -60 && Math.abs(dx) > Math.abs(dy)) return { sourceHandle: 'left', targetHandle: 'right' };
        return { sourceHandle: 'bottom', targetHandle: 'top' };
      }
    }

    // 4. Default downward flow
    if (dy >= 0) {
      if (dx > 70 && dy < 80) {
        return { sourceHandle: 'right', targetHandle: 'top' };
      }
      if (dx < -70 && dy < 80) {
        return { sourceHandle: 'left', targetHandle: 'top' };
      }
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    }

    return { sourceHandle: 'bottom', targetHandle: 'top' };
  } else {
    // Left-to-Right (LR) flow
    if (isLoopReturn) {
      return { sourceHandle: 'top', targetHandle: 'top' };
    }

    const isVerticallyAligned =
      Math.abs(dx) <= Math.max(sourceW, targetW) + 20 ||
      (Math.abs(dy) > Math.abs(dx) * 1.15 && Math.abs(dy) >= 50);

    if (isVerticallyAligned) {
      if (dy > 0) {
        return { sourceHandle: 'bottom', targetHandle: 'top' };
      } else {
        return { sourceHandle: 'top', targetHandle: 'bottom' };
      }
    }

    return { sourceHandle: 'right', targetHandle: 'left' };
  }
}
