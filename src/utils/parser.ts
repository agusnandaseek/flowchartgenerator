import type { ParseError, ParseResult } from '../types/flowchart';

interface RawLine {
  lineNum: number;
  rawText: string;
  cleanText: string;
}

export type ASTNode =
  | {
      id: string;
      type: 'terminator';
      label: string;
      subType: 'start' | 'end';
      lineNumber: number;
    }
  | {
      id: string;
      type: 'inputOutput';
      label: string;
      subType: 'input' | 'output';
      lineNumber: number;
    }
  | {
      id: string;
      type: 'process';
      label: string;
      lineNumber: number;
    }
  | {
      id: string;
      type: 'decision';
      condition: string;
      label: string;
      lineNumber: number;
      thenBranch: ASTNode[];
      elseBranch: ASTNode[];
    }
  | {
      id: string;
      type: 'loop';
      condition: string;
      label: string;
      lineNumber: number;
      body: ASTNode[];
    };

/**
 * Preprocesses pseudocode into clean lines with line numbers, ignoring comments and whitespace
 */
function cleanLines(input: string): RawLine[] {
  const lines = input.split('\n');
  const result: RawLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // Remove comments (// or #)
    const withoutComment = raw.replace(/(\/\/|#).*$/, '').trim();
    if (withoutComment.length > 0) {
      result.push({
        lineNum: i + 1,
        rawText: raw.trim(),
        cleanText: withoutComment,
      });
    }
  }

  return result;
}

let idCounter = 1;
function genId(prefix: string): string {
  return `${prefix}_${idCounter++}`;
}

export function parsePseudocodeToAST(input: string): { ast: ASTNode[]; errors: ParseError[] } {
  idCounter = 1;
  const rawLines = cleanLines(input);
  const errors: ParseError[] = [];
  let index = 0;

  function parseBlock(stopCondition?: (line: string) => boolean): ASTNode[] {
    const nodes: ASTNode[] = [];

    while (index < rawLines.length) {
      const lineObj = rawLines[index];
      const text = lineObj.cleanText;

      if (stopCondition && stopCondition(text)) {
        break;
      }

      // 1. IF / JIKA
      const ifMatch = text.match(/^(?:jika|if)\s+(.*?)(?:\s+(?:maka|then))?$/i);
      if (ifMatch) {
        const condition = ifMatch[1] || 'Kondisi?';
        const lineNum = lineObj.lineNum;
        index++; // consume IF line

        // Parse THEN branch
        const thenBranch = parseBlock((l) =>
          /^(?:lainnya|selain\s*itu|else|akhir[\s\-_]*jika|end[\s\-_]*if|selesai[\s\-_]*jika)$/i.test(l)
        );

        let elseBranch: ASTNode[] = [];
        if (index < rawLines.length) {
          const checkLine = rawLines[index].cleanText;
          if (/^(?:lainnya|selain\s*itu|else)$/i.test(checkLine)) {
            index++; // consume ELSE line
            elseBranch = parseBlock((l) =>
              /^(?:akhir[\s\-_]*jika|end[\s\-_]*if|selesai[\s\-_]*jika)$/i.test(l)
            );
          }
        }

        // Check closing AKHIR-JIKA / ENDIF
        if (
          index < rawLines.length &&
          /^(?:akhir[\s\-_]*jika|end[\s\-_]*if|selesai[\s\-_]*jika)$/i.test(rawLines[index].cleanText)
        ) {
          index++; // consume ENDIF
        } else {
          errors.push({
            line: lineNum,
            message: `Blok JIKA pada baris ${lineNum} belum ditutup dengan 'AKHIR-JIKA'`,
          });
        }

        nodes.push({
          id: genId('dec'),
          type: 'decision',
          condition,
          label: condition.endsWith('?') ? condition : `${condition} ?`,
          lineNumber: lineNum,
          thenBranch,
          elseBranch,
        });
        continue;
      }

      // 2. WHILE / SELAMA / FOR / UNTUK
      const whileMatch = text.match(/^(?:selama|while)\s+(.*?)(?:\s+(?:lakukan|do))?$/i);
      const forMatch = text.match(/^(?:untuk|for)\s+(.*?)(?:\s+(?:lakukan|do))?$/i);

      if (whileMatch || forMatch) {
        const isFor = !!forMatch;
        const condition = (whileMatch ? whileMatch[1] : forMatch ? forMatch[1] : 'Loop?').trim();
        const lineNum = lineObj.lineNum;
        index++; // consume WHILE/FOR

        const body = parseBlock((l) =>
          isFor
            ? /^(?:akhir[\s\-_]*untuk|end[\s\-_]*for|selesai[\s\-_]*untuk|akhir[\s\-_]*selama|end[\s\-_]*while)$/i.test(l)
            : /^(?:akhir[\s\-_]*selama|end[\s\-_]*while|selesai[\s\-_]*selama)$/i.test(l)
        );

        // Check closing
        if (index < rawLines.length) {
          index++; // consume closing loop
        } else {
          errors.push({
            line: lineNum,
            message: `Blok Perulangan pada baris ${lineNum} belum ditutup`,
          });
        }

        nodes.push({
          id: genId('loop'),
          type: 'loop',
          condition,
          label: condition.endsWith('?') ? condition : `${condition} ?`,
          lineNumber: lineNum,
          body,
        });
        continue;
      }

      // Check unexpected else or endif at top level of block
      if (/^(?:lainnya|selain\s*itu|else|akhir[\s\-_]*jika|end[\s\-_]*if|akhir[\s\-_]*selama|end[\s\-_]*while)$/i.test(text)) {
        errors.push({
          line: lineObj.lineNum,
          message: `Ditemukan penutup '${text}' tanpa blok pembuka yang cocok`,
        });
        index++;
        continue;
      }

      // 3. START / MULAI / BEGIN
      if (/^(?:mulai|start|begin)\b/i.test(text)) {
        const quoteMatch = text.match(/["'](.*?)["']/);
        const nameMatch = text.match(/^(?:mulai|start|begin)\s+([a-zA-Z0-9_.\-]+)$/i);
        const label = quoteMatch ? quoteMatch[1] : nameMatch ? nameMatch[1] : text;
        nodes.push({
          id: genId('term'),
          type: 'terminator',
          label,
          subType: 'start',
          lineNumber: lineObj.lineNum,
        });
        index++;
        continue;
      }

      // 4. END / SELESAI / STOP
      if (/^(?:selesai|end|stop|tamat)\b/i.test(text)) {
        const quoteMatch = text.match(/["'](.*?)["']/);
        const nameMatch = text.match(/^(?:selesai|end|stop|tamat)\s+([a-zA-Z0-9_.\-]+)$/i);
        const label = quoteMatch ? quoteMatch[1] : nameMatch ? nameMatch[1] : text;
        nodes.push({
          id: genId('term'),
          type: 'terminator',
          label,
          subType: 'end',
          lineNumber: lineObj.lineNum,
        });
        index++;
        continue;
      }

      // 5. INPUT / BACA / MASUKKAN
      if (/^(?:masukkan|baca|input|read|ambil|terima)\b/i.test(text)) {
        nodes.push({
          id: genId('io'),
          type: 'inputOutput',
          label: text,
          subType: 'input',
          lineNumber: lineObj.lineNum,
        });
        index++;
        continue;
      }

      // 6. OUTPUT / TAMPILKAN / CETAK / PRINT
      if (/^(?:tampilkan|cetak|print|output|write|tulis)\b/i.test(text)) {
        nodes.push({
          id: genId('io'),
          type: 'inputOutput',
          label: text,
          subType: 'output',
          lineNumber: lineObj.lineNum,
        });
        index++;
        continue;
      }

      // 7. General Process / Assignment
      nodes.push({
        id: genId('proc'),
        type: 'process',
        label: text,
        lineNumber: lineObj.lineNum,
      });
      index++;
    }

    return nodes;
  }

  const ast = parseBlock();
  return { ast, errors };
}

interface GraphBuildResult {
  firstId: string | null;
  nodes: ParseResult['nodes'];
  edges: ParseResult['edges'];
}

/**
 * Transforms AST into React Flow nodes and edges with control-flow linkages
 */
export function buildGraphFromAST(
  astList: ASTNode[],
  nextTargetId: string | null = null,
  isLoopTarget = false
): GraphBuildResult {
  const nodes: ParseResult['nodes'] = [];
  const edges: ParseResult['edges'] = [];

  if (astList.length === 0) {
    return { firstId: nextTargetId, nodes, edges };
  }

  for (let i = 0; i < astList.length; i++) {
    const item = astList[i];
    const isLast = i === astList.length - 1;

    // What node does this item flow into next?
    const followingItem = isLast ? null : astList[i + 1];

    if (item.type === 'terminator') {
      nodes.push({
        id: item.id,
        type: 'terminator',
        data: {
          label: item.label,
          nodeType: 'terminator',
          subType: item.subType,
          lineNumber: item.lineNumber,
        },
        position: { x: 0, y: 0 },
      });

      // End terminator doesn't connect forward unless forced
      if (item.subType !== 'end') {
        const nextId = followingItem ? followingItem.id : nextTargetId;
        if (nextId) {
          edges.push({
            id: `e_${item.id}_${nextId}`,
            source: item.id,
            target: nextId,
            type: 'smoothstep',
          });
        }
      }
    } else if (item.type === 'inputOutput') {
      nodes.push({
        id: item.id,
        type: 'inputOutput',
        data: {
          label: item.label,
          nodeType: 'inputOutput',
          subType: item.subType,
          lineNumber: item.lineNumber,
        },
        position: { x: 0, y: 0 },
      });

      const nextId = followingItem ? followingItem.id : nextTargetId;
      if (nextId) {
        const isLoop = !followingItem && isLoopTarget;
        edges.push({
          id: `e_${item.id}_${nextId}`,
          source: item.id,
          target: nextId,
          type: 'smoothstep',
          data: isLoop ? { isLoopReturn: true } : undefined,
        });
      }
    } else if (item.type === 'process') {
      nodes.push({
        id: item.id,
        type: 'process',
        data: {
          label: item.label,
          nodeType: 'process',
          lineNumber: item.lineNumber,
        },
        position: { x: 0, y: 0 },
      });

      const nextId = followingItem ? followingItem.id : nextTargetId;
      if (nextId) {
        const isLoop = !followingItem && isLoopTarget;
        edges.push({
          id: `e_${item.id}_${nextId}`,
          source: item.id,
          target: nextId,
          type: 'smoothstep',
          data: isLoop ? { isLoopReturn: true } : undefined,
        });
      }
    } else if (item.type === 'decision') {
      nodes.push({
        id: item.id,
        type: 'decision',
        data: {
          label: item.label,
          nodeType: 'decision',
          subType: 'decision',
          lineNumber: item.lineNumber,
        },
        position: { x: 0, y: 0 },
      });

      // Target where both branches rejoin
      const mergeTargetId = followingItem ? followingItem.id : nextTargetId;

      // Determine which branch is the main continuing flow
      const isElseMain = item.elseBranch.length > item.thenBranch.length;
      const thenSourceHandle = isElseMain ? 'right' : 'bottom';
      const elseSourceHandle = isElseMain ? 'bottom' : 'right';

      // Build THEN branch (Always labelled 'Ya')
      if (item.thenBranch.length > 0) {
        const thenResult = buildGraphFromAST(item.thenBranch, mergeTargetId);
        nodes.push(...thenResult.nodes);
        edges.push(...thenResult.edges);

        if (thenResult.firstId) {
          edges.push({
            id: `e_${item.id}_then_${thenResult.firstId}`,
            source: item.id,
            target: thenResult.firstId,
            sourceHandle: thenSourceHandle,
            label: 'Ya',
            type: 'smoothstep',
            style: { stroke: '#10b981', strokeWidth: 2 },
          });
        }
      } else if (mergeTargetId) {
        // Empty then branch
        edges.push({
          id: `e_${item.id}_then_${mergeTargetId}`,
          source: item.id,
          target: mergeTargetId,
          sourceHandle: thenSourceHandle,
          label: 'Ya',
          type: 'smoothstep',
        });
      }

      // Build ELSE branch (Always labelled 'Tidak')
      if (item.elseBranch.length > 0) {
        const elseResult = buildGraphFromAST(item.elseBranch, mergeTargetId);
        nodes.push(...elseResult.nodes);
        edges.push(...elseResult.edges);

        if (elseResult.firstId) {
          edges.push({
            id: `e_${item.id}_else_${elseResult.firstId}`,
            source: item.id,
            target: elseResult.firstId,
            sourceHandle: elseSourceHandle,
            label: 'Tidak',
            type: 'smoothstep',
            style: { stroke: '#f43f5e', strokeWidth: 2 },
          });
        }
      } else if (mergeTargetId) {
        // No else branch: jump straight to merge target
        edges.push({
          id: `e_${item.id}_noelse_${mergeTargetId}`,
          source: item.id,
          target: mergeTargetId,
          sourceHandle: elseSourceHandle,
          label: 'Tidak',
          type: 'smoothstep',
          style: { stroke: '#f43f5e', strokeWidth: 2 },
        });
      }
    } else if (item.type === 'loop') {
      nodes.push({
        id: item.id,
        type: 'decision',
        data: {
          label: item.label,
          nodeType: 'decision',
          subType: 'loop',
          lineNumber: item.lineNumber,
        },
        position: { x: 0, y: 0 },
      });

      const exitTargetId = followingItem ? followingItem.id : nextTargetId;

      // Loop body connects back to loop condition node
      if (item.body.length > 0) {
        const bodyResult = buildGraphFromAST(item.body, item.id, true);
        nodes.push(...bodyResult.nodes);
        edges.push(...bodyResult.edges);

        if (bodyResult.firstId) {
          edges.push({
            id: `e_${item.id}_body_${bodyResult.firstId}`,
            source: item.id,
            target: bodyResult.firstId,
            sourceHandle: 'bottom',
            label: 'Ya',
            type: 'smoothstep',
            style: { stroke: '#10b981', strokeWidth: 2 },
          });
        }
      }

      // False branch exits the loop
      if (exitTargetId) {
        edges.push({
          id: `e_${item.id}_exit_${exitTargetId}`,
          source: item.id,
          target: exitTargetId,
          sourceHandle: 'right',
          label: 'Tidak',
          type: 'smoothstep',
          style: { stroke: '#f43f5e', strokeWidth: 2 },
        });
      }
    }
  }

  return {
    firstId: astList[0]?.id || nextTargetId,
    nodes,
    edges,
  };
}

/**
 * Main parser entry point: string -> ParseResult
 */
export function parsePseudocode(code: string): ParseResult {
  if (!code || code.trim().length === 0) {
    return { nodes: [], edges: [], errors: [] };
  }

  const { ast, errors } = parsePseudocodeToAST(code);
  const graph = buildGraphFromAST(ast);

  return {
    nodes: graph.nodes,
    edges: graph.edges,
    errors,
  };
}
