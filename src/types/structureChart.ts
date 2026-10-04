export type CoupleType = 'data' | 'control';
export type CoupleDirection = 'down' | 'up'; // 'down' (parent to child / IN), 'up' (child to parent / OUT)

export interface StructureCouple {
  id: string;
  type: CoupleType; // 'data' (empty circle) | 'control' (filled circle)
  direction: CoupleDirection;
  label: string;
}

export interface StructureModuleData {
  label: string;
  isLibrary?: boolean; // Common subroutine / Library module (double side lines)
  isLoop?: boolean; // Repeated invocation
  isConditional?: boolean; // Invoked conditionally (diamond symbol)
  couples?: StructureCouple[]; // Data and control couples associated with connection
  lineNumber?: number;
  [key: string]: unknown;
}

export interface StructureNode {
  id: string;
  type: 'structureModule';
  data: StructureModuleData;
  position: { x: number; y: number };
}

export interface StructureEdgeData {
  isConditional?: boolean; // Conditional line (diamond)
  condGroupId?: string; // Group ID for shared condition diamond
  groupStartIndex?: number; // Starting child index of the condition group
  groupEndIndex?: number; // Ending child index of the condition group
  isGroupLeader?: boolean; // Whether this edge renders the single diamond for the group
  groupStartX?: number; // Shared horizontal start position for the grouped diamond
  isLoop?: boolean; // Curved loop arrow
  couples?: StructureCouple[]; // Data and control couples along this connection
  childIndex?: number; // 0-based index of this child among its siblings
  siblingCount?: number; // Total number of children sharing this parent
  sourceWidth?: number; // Width of parent module for distributed start points
  [key: string]: unknown;
}

export interface StructureEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: StructureEdgeData;
}

export interface StructureParseResult {
  nodes: StructureNode[];
  edges: StructureEdge[];
  errors: { line: number; message: string }[];
}

export interface StructureTemplateItem {
  id: string;
  title: string;
  description: string;
  code: string;
}
