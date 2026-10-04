export type FlowNodeType = 'terminator' | 'process' | 'inputOutput' | 'decision';

export interface FlowNodeData {
  label: string;
  nodeType: FlowNodeType;
  subType?: 'start' | 'end' | 'input' | 'output' | 'process' | 'decision' | 'loop';
  lineNumber?: number;
  [key: string]: unknown;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  nodes: {
    id: string;
    type: FlowNodeType;
    data: FlowNodeData;
    position: { x: number; y: number };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    animated?: boolean;
    style?: Record<string, unknown>;
    data?: Record<string, unknown>;
  }[];
  errors: ParseError[];
}

export interface PresetItem {
  id: string;
  label: string;
  category: 'terminator' | 'io' | 'process' | 'decision' | 'loop';
  shapeName: string;
  snippet: string;
  description: string;
  iconName: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  code: string;
}
