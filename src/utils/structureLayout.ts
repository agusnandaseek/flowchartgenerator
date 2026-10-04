import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export function estimateStructureNodeSize(label: string) {
  const text = label || '';
  const len = text.length;
  const width = Math.max(170, Math.min(240, Math.ceil((len * 8.5 + 40) / 2) * 2));
  const lines = Math.max(1, Math.ceil(len / 22));
  const height = Math.max(54, Math.ceil((lines * 18 + 26) / 2) * 2);
  return { width, height };
}

export function getStructureLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 90, // Room for couple labels between adjacent modules
    ranksep: 180, // Generous vertical space for multi-couple arrows without overlap
    align: 'DL',
    ranker: 'network-simplex',
  });

  nodes.forEach((node) => {
    const label = (node.data?.label as string) || '';
    const { width, height } = estimateStructureNodeSize(label);
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    const label = (node.data?.label as string) || '';
    const { width, height } = estimateStructureNodeSize(label);

    return {
      ...node,
      position: {
        x: Math.round(nodeWithPos.x - width / 2),
        y: Math.round(nodeWithPos.y - height / 2),
      },
      style: {
        width,
        height,
      },
    };
  });

  const layoutedEdges = edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const sourceLabel = (sourceNode?.data?.label as string) || '';
    const { width: sourceWidth } = estimateStructureNodeSize(sourceLabel);
    return {
      ...edge,
      type: 'structureEdge',
      data: {
        ...edge.data,
        sourceWidth,
      },
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
