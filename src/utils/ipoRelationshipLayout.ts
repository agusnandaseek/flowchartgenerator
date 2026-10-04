import dagre from 'dagre';
import { type Node, type Edge, MarkerType, Position } from '@xyflow/react';
import type { IpoFunction, IpoConnection } from '../types/ipoChart';

export function getIpoRelationshipElements(
  functions: IpoFunction[],
  connections: IpoConnection[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  if (functions.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  const NODE_WIDTH = 230;
  const NODE_HEIGHT = 120;

  // 1. Add nodes
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

    edges.push({
      id: conn.id,
      source: conn.sourceFunctionId,
      target: conn.targetFunctionId,
      type: 'smoothstep',
      label: edgeLabel,
      labelStyle: {
        fill: '#1e293b',
        fontWeight: 600,
        fontSize: 11,
        fontFamily: 'monospace',
      },
      labelBgStyle: {
        fill: '#f1f5f9',
        fillOpacity: 0.95,
        stroke: '#cbd5e1',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
      labelBgPadding: [6, 3],
      style: {
        stroke: '#4f46e5',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4f46e5',
        width: 18,
        height: 18,
      },
    });

    dagreGraph.setEdge(conn.sourceFunctionId, conn.targetFunctionId);
  });

  // 3. Compute layout
  dagre.layout(dagreGraph);

  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: Math.round(nodeWithPos.x - NODE_WIDTH / 2),
        y: Math.round(nodeWithPos.y - NODE_HEIGHT / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
