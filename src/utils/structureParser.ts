import type {
  StructureNode,
  StructureEdge,
  StructureParseResult,
  StructureCouple,
} from '../types/structureChart';

interface RawParsedItem {
  id: string;
  name: string;
  level: number;
  isLibrary: boolean;
  isLoop: boolean;
  isConditional: boolean;
  condGroupId?: string;
  couples: StructureCouple[];
  lineNumber: number;
  parentIndex: number;
}

export function parseStructureChart(text: string): StructureParseResult {
  const lines = text.split('\n');
  const nodes: StructureNode[] = [];
  const edges: StructureEdge[] = [];
  const errors: { line: number; message: string }[] = [];

  const rawItems: RawParsedItem[] = [];
  // Stack of parent indices at indentation levels
  const parentStack: { level: number; itemIndex: number }[] = [];

  // Track active condition groups per parentIndex
  const activeCondGroupPerParent = new Map<number, string>();
  let condGroupCounter = 1;

  let nodeCounter = 1;
  let coupleCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines and comments (# or //)
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Measure indentation level (tabs count as 2 spaces)
    const expandedLine = rawLine.replace(/\t/g, '  ');
    const indentMatch = expandedLine.match(/^(\s*)/);
    const indentSpaces = indentMatch ? indentMatch[1].length : 0;
    const currentLineNum = i + 1;

    // Check if line is a standalone block condition tag: [COND START] or [COND END]
    const isBlockCondStart = /^\s*\[(COND|IF)[\s_-]*START\]\s*$/i.test(trimmed);
    const isBlockCondEnd = /^\s*\[(COND|IF)[\s_-]*END\]\s*$/i.test(trimmed);

    if (isBlockCondStart || isBlockCondEnd) {
      // Find parent according to indentation
      while (parentStack.length > 0 && indentSpaces <= parentStack[parentStack.length - 1].level) {
        parentStack.pop();
      }
      const parentIdx = parentStack.length > 0 ? parentStack[parentStack.length - 1].itemIndex : -1;
      if (isBlockCondStart) {
        activeCondGroupPerParent.set(parentIdx, `cg_${condGroupCounter++}`);
      } else {
        activeCondGroupPerParent.delete(parentIdx);
      }
      continue;
    }

    // Check if line is a couple definition attached to the most recent module
    // E.g. (DATA IN: order_info), (DATA OUT: total), (FLAG IN: valid), (FLAG OUT: EOF), etc.
    const coupleMatch = trimmed.match(
      /^\(?\s*(DATA|FLAG|CONTROL)\s*(?:(IN|OUT)\s*:\s*([^)]+)|:\s*(<-|->)?\s*([a-zA-Z0-9_\-\s]+?)\s*(<-|->)?)\s*\)?$/i
    );

    if (coupleMatch) {
      if (rawItems.length === 0) {
        errors.push({
          line: currentLineNum,
          message: 'Data/Control couple harus diletakkan di bawah modul terkait',
        });
        continue;
      }

      const category = coupleMatch[1].toUpperCase();
      const type: 'data' | 'control' = category === 'DATA' ? 'data' : 'control';

      let direction: 'down' | 'up' = 'down';
      let label = '';

      if (coupleMatch[2]) {
        // Format: (DATA IN: x) or (DATA OUT: y)
        direction = coupleMatch[2].toUpperCase() === 'OUT' ? 'up' : 'down';
        label = (coupleMatch[3] || '').trim();
      } else {
        // Format with arrows: (DATA: x ->) or (DATA: <- y)
        const leftArrow = coupleMatch[4] || '';
        const rawLabel = coupleMatch[5] || '';
        const rightArrow = coupleMatch[6] || '';

        label = rawLabel.trim();
        if (leftArrow === '<-' || rightArrow === '<-') {
          direction = 'up';
        } else {
          direction = 'down';
        }
      }

      const targetItem = rawItems[rawItems.length - 1];
      targetItem.couples.push({
        id: `couple_${coupleCounter++}`,
        type,
        direction,
        label: label || (type === 'data' ? 'data' : 'flag'),
      });
      continue;
    }

    // It is a Module line
    let moduleName = trimmed;
    let isLibrary = false;
    let isLoop = false;
    let isConditional = false;

    // Detect Library Module: || Module Name || or [LIB]
    if (/^\|\|.*\|\|$/.test(moduleName)) {
      isLibrary = true;
      moduleName = moduleName.replace(/^\|\|\s*/, '').replace(/\s*\|\|$/, '');
    } else if (/\[LIB\]/i.test(moduleName)) {
      isLibrary = true;
      moduleName = moduleName.replace(/\[LIB\]/gi, '').trim();
    }

    // Detect Loop: [LOOP]
    if (/\[LOOP\]/i.test(moduleName)) {
      isLoop = true;
      moduleName = moduleName.replace(/\[LOOP\]/gi, '').trim();
    }

    // Detect Condition tags: [COND START], [COND END], [COND]
    const hasInlineCondStart = /\[(COND|IF)[\s_-]*START\]/i.test(moduleName);
    const hasInlineCondEnd = /\[(COND|IF)[\s_-]*END\]/i.test(moduleName);
    const hasInlineCondSingle = /\[(COND|IF)\]/i.test(moduleName);

    if (hasInlineCondStart) {
      moduleName = moduleName.replace(/\[(COND|IF)[\s_-]*START\]/gi, '').trim();
    }
    if (hasInlineCondEnd) {
      moduleName = moduleName.replace(/\[(COND|IF)[\s_-]*END\]/gi, '').trim();
    }
    if (hasInlineCondSingle) {
      moduleName = moduleName.replace(/\[(COND|IF)\]/gi, '').trim();
    }

    // Remove quotes if present: "Module Name"
    if (/^["'].*["']$/.test(moduleName)) {
      moduleName = moduleName.slice(1, -1).trim();
    }

    if (!moduleName) {
      moduleName = `Modul ${nodeCounter}`;
    }

    // Determine parent using indentation stack
    while (parentStack.length > 0 && indentSpaces <= parentStack[parentStack.length - 1].level) {
      const popped = parentStack.pop();
      if (popped) {
        // Clear active condition group for parents that are popped/closed
        activeCondGroupPerParent.delete(popped.itemIndex);
      }
    }

    const parentIndex = parentStack.length > 0 ? parentStack[parentStack.length - 1].itemIndex : -1;
    const currentItemIndex = rawItems.length;

    // Manage condition groups
    if (hasInlineCondStart) {
      activeCondGroupPerParent.set(parentIndex, `cg_${condGroupCounter++}`);
    }

    const currentCondGroupId = activeCondGroupPerParent.get(parentIndex);
    if (currentCondGroupId) {
      isConditional = true;
    } else if (hasInlineCondSingle) {
      isConditional = true;
    }

    const newItem: RawParsedItem = {
      id: `mod_${nodeCounter++}`,
      name: moduleName,
      level: indentSpaces,
      isLibrary,
      isLoop,
      isConditional,
      condGroupId: currentCondGroupId,
      couples: [],
      lineNumber: currentLineNum,
      parentIndex,
    };

    rawItems.push(newItem);
    parentStack.push({ level: indentSpaces, itemIndex: currentItemIndex });

    if (hasInlineCondEnd) {
      activeCondGroupPerParent.delete(parentIndex);
    }
  }

  // Convert raw items into ReactFlow Nodes & Edges
  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];

    nodes.push({
      id: item.id,
      type: 'structureModule',
      data: {
        label: item.name,
        isLibrary: item.isLibrary,
        lineNumber: item.lineNumber,
      },
      position: { x: 0, y: 0 },
    });

    if (item.parentIndex >= 0) {
      const parent = rawItems[item.parentIndex];

      // Find all siblings sharing this parent to distribute branch origins
      const siblings = rawItems.filter((other) => other.parentIndex === item.parentIndex);
      const childIndex = siblings.findIndex((other) => other.id === item.id);
      const siblingCount = siblings.length;

      // Group condition logic:
      // If child belongs to a condGroupId, find all siblings in that same group
      const condGroupId = item.condGroupId;
      let groupStartIndex: number | undefined;
      let groupEndIndex: number | undefined;
      let isGroupLeader: boolean | undefined;

      if (condGroupId) {
        const groupSiblings = siblings.filter((other) => other.condGroupId === condGroupId);
        const groupIndices = groupSiblings.map((other) => siblings.indexOf(other));
        groupStartIndex = Math.min(...groupIndices);
        groupEndIndex = Math.max(...groupIndices);
        isGroupLeader = childIndex === groupStartIndex;
      }

      // NO downward cascading: condition ONLY applies if the item itself was marked conditional
      const isEdgeConditional = item.isConditional;

      // Edge carries loop, conditional, couples, and sibling layout info
      edges.push({
        id: `edge_${parent.id}_${item.id}`,
        source: parent.id,
        target: item.id,
        type: 'structureEdge',
        data: {
          isConditional: isEdgeConditional,
          condGroupId,
          groupStartIndex,
          groupEndIndex,
          isGroupLeader,
          isLoop: item.isLoop,
          couples: item.couples,
          childIndex: childIndex >= 0 ? childIndex : 0,
          siblingCount,
        },
      });
    }
  }

  return { nodes, edges, errors };
}
