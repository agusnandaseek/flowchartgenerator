import type { IpoFunction } from '../types/ipoChart';

// A4 Portrait dimensions in PostScript points (1 pt = 1/72 inch, 210mm x 297mm)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 34; // Left & Right margin (~12mm) -> Full width table = 527.28pt
const MARGIN_TOP = 38;
const MARGIN_BOTTOM = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 527.28pt

const COL_INPUT_W = Number((CONTENT_WIDTH * 0.25).toFixed(2)); // 25%
const COL_PROCESS_W = Number((CONTENT_WIDTH * 0.5).toFixed(2)); // 50%
const COL_OUTPUT_W = Number((CONTENT_WIDTH - COL_INPUT_W - COL_PROCESS_W).toFixed(2)); // 25%

type PdfFont = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
// F1 = Helvetica, F2 = Helvetica-Bold, F3 = Helvetica-Oblique, F4 = Courier, F5 = Courier-Bold

/**
 * Converts a JS string into a PDF literal string `(...)` using WinAnsi-safe ASCII/octal escaping.
 */
function pdfString(str: string): string {
  // Normalize common Unicode characters to WinAnsi equivalents
  const normalized = str
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '\x95')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  let out = '(';
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code === 0x28) {
      out += '\\(';
    } else if (code === 0x29) {
      out += '\\)';
    } else if (code === 0x5c) {
      out += '\\\\';
    } else if (code >= 0x20 && code <= 0x7e) {
      out += normalized[i];
    } else if (code >= 0x80 && code <= 0xff) {
      out += '\\' + code.toString(8).padStart(3, '0');
    } else {
      out += '?';
    }
  }
  out += ')';
  return out;
}

/**
 * Estimates the width in points of a string in Helvetica or Courier.
 */
function measureTextWidth(text: string, fontSize: number, font: PdfFont): number {
  if (!text) return 0;
  if (font === 'F4' || font === 'F5') {
    return text.length * fontSize * 0.6;
  }
  const boldFactor = font === 'F2' ? 1.07 : 1.0;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ('ilI.,:;!| '.includes(ch)) total += 0.28;
    else if ('mwMW@%'.includes(ch)) total += 0.82;
    else if (ch >= 'A' && ch <= 'Z') total += 0.66;
    else total += 0.53;
  }
  return total * fontSize * boldFactor;
}

/**
 * Wraps a text string (preserving explicit `\n` newlines and breaking long words if needed)
 * so every returned line fits within `maxWidthPt` points.
 */
function wrapTextToWidth(
  text: string,
  maxWidthPt: number,
  fontSize: number,
  font: PdfFont
): string[] {
  if (!text) return [''];
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmedRight = para.replace(/\s+$/, '');
    if (!trimmedRight) {
      lines.push('');
      continue;
    }

    const words = trimmedRight.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      // If a single word is wider than maxWidthPt (e.g. a very long camelCase identifier), hard-wrap it
      if (measureTextWidth(word, fontSize, font) > maxWidthPt) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        let chunk = '';
        for (let i = 0; i < word.length; i++) {
          const nextChunk = chunk + word[i];
          if (measureTextWidth(nextChunk, fontSize, font) > maxWidthPt && chunk.length > 0) {
            lines.push(chunk);
            chunk = word[i];
          } else {
            chunk = nextChunk;
          }
        }
        if (chunk) {
          currentLine = chunk;
        }
        continue;
      }

      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (measureTextWidth(candidate, fontSize, font) <= maxWidthPt) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [''];
}

// --- Low-level PDF Page Stream Commands ---

function rgbFill(r: number, g: number, b: number): string {
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`;
}

function rgbStroke(r: number, g: number, b: number): string {
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`;
}

function drawRect(
  x: number,
  topY: number,
  w: number,
  h: number,
  fillRgb?: [number, number, number],
  strokeRgb?: [number, number, number],
  lineWidth = 0.75
): string {
  const cmds: string[] = [];
  const pdfBottomY = PAGE_HEIGHT - topY - h;
  if (fillRgb && strokeRgb) {
    cmds.push(rgbFill(...fillRgb));
    cmds.push(rgbStroke(...strokeRgb));
    cmds.push(`${lineWidth.toFixed(2)} w`);
    cmds.push(`${x.toFixed(2)} ${pdfBottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
  } else if (fillRgb) {
    cmds.push(rgbFill(...fillRgb));
    cmds.push(`${x.toFixed(2)} ${pdfBottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  } else if (strokeRgb) {
    cmds.push(rgbStroke(...strokeRgb));
    cmds.push(`${lineWidth.toFixed(2)} w`);
    cmds.push(`${x.toFixed(2)} ${pdfBottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }
  return cmds.join('\n');
}

function drawLine(
  x1: number,
  topY1: number,
  x2: number,
  topY2: number,
  strokeRgb: [number, number, number],
  lineWidth = 0.75
): string {
  const y1 = PAGE_HEIGHT - topY1;
  const y2 = PAGE_HEIGHT - topY2;
  return [
    rgbStroke(...strokeRgb),
    `${lineWidth.toFixed(2)} w`,
    `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
  ].join('\n');
}

function drawCircle(
  cx: number,
  topCy: number,
  r: number,
  fillRgb: [number, number, number]
): string {
  const cy = PAGE_HEIGHT - topCy;
  const k = 0.5522847498 * r;
  return [
    rgbFill(...fillRgb),
    `${(cx - r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx - r).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx - k).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx + k).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx + r).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx + k).toFixed(2)} ${(cy - r).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} c`,
    `${(cx - k).toFixed(2)} ${(cy - r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    'f',
  ].join('\n');
}

function drawText(
  text: string,
  x: number,
  topBaselineY: number,
  font: PdfFont,
  fontSize: number,
  colorRgb: [number, number, number]
): string {
  const pdfY = PAGE_HEIGHT - topBaselineY;
  return [
    'BT',
    `/${font} ${fontSize.toFixed(2)} Tf`,
    rgbFill(...colorRgb),
    `${x.toFixed(2)} ${pdfY.toFixed(2)} Td`,
    `${pdfString(text)} Tj`,
    'ET',
  ].join('\n');
}

interface PreparedBulletItem {
  lines: string[];
}

interface PreparedProcessItem {
  numLabel: string;
  lines: string[];
}

interface PreparedFunctionCard {
  index: number;
  fnName: string;
  role: string;
  inputs: PreparedBulletItem[];
  processes: PreparedProcessItem[];
  outputs: PreparedBulletItem[];
  bodyHeight: number;
  totalHeight: number;
}

const FN_HEADER_H = 26;
const COL_HEADER_H = 20;
const CELL_PAD_TOP = 10;
const CELL_PAD_BOTTOM = 10;
const CELL_PAD_X = 10;
const LINE_HEIGHT = 13.5;
const ITEM_GAP = 5;
const CARD_GAP = 16;

function prepareFunctionCard(fn: IpoFunction, index: number): PreparedFunctionCard {
  const fnName = fn.name?.trim() ? `${fn.name.trim()}()` : '(untitledFunction)';
  const role = fn.role?.trim() || '';

  const inputAvailW = COL_INPUT_W - CELL_PAD_X * 2 - 10; // 10pt for bullet dot + gap
  const outputAvailW = COL_OUTPUT_W - CELL_PAD_X * 2 - 10;
  const processAvailW = COL_PROCESS_W - CELL_PAD_X * 2 - 16; // 16pt for "1. " number prefix

  const inputs: PreparedBulletItem[] = fn.inputs.map((inp) => ({
    lines: wrapTextToWidth(inp.name?.trim() || '(unnamed)', inputAvailW, 9, 'F4'),
  }));

  const outputs: PreparedBulletItem[] = fn.outputs.map((out) => ({
    lines: wrapTextToWidth(out.name?.trim() || '(unnamed)', outputAvailW, 9, 'F4'),
  }));

  const processes: PreparedProcessItem[] = fn.processes.map((pr, idx) => ({
    numLabel: `${idx + 1}.`,
    lines: wrapTextToWidth(pr.description?.trim() || '(no description)', processAvailW, 9.5, 'F1'),
  }));

  const calcBulletsHeight = (items: PreparedBulletItem[]) => {
    if (items.length === 0) return LINE_HEIGHT;
    let h = 0;
    items.forEach((item, i) => {
      h += item.lines.length * LINE_HEIGHT;
      if (i < items.length - 1) h += ITEM_GAP;
    });
    return h;
  };

  const calcProcessesHeight = (items: PreparedProcessItem[]) => {
    if (items.length === 0) return LINE_HEIGHT;
    let h = 0;
    items.forEach((item, i) => {
      h += item.lines.length * LINE_HEIGHT;
      if (i < items.length - 1) h += ITEM_GAP + 1;
    });
    return h;
  };

  const hIn = calcBulletsHeight(inputs);
  const hPr = calcProcessesHeight(processes);
  const hOut = calcBulletsHeight(outputs);

  const contentMaxH = Math.max(hIn, hPr, hOut, LINE_HEIGHT);
  const bodyHeight = Math.ceil(CELL_PAD_TOP + contentMaxH + CELL_PAD_BOTTOM);
  const totalHeight = FN_HEADER_H + COL_HEADER_H + bodyHeight;

  return {
    index,
    fnName,
    role,
    inputs,
    processes,
    outputs,
    bodyHeight,
    totalHeight,
  };
}

function renderCardToCommands(
  card: PreparedFunctionCard,
  topY: number,
  isContinuation = false
): string {
  const cmds: string[] = [];
  const x0 = MARGIN_X;
  const x1 = MARGIN_X + COL_INPUT_W;
  const x2 = MARGIN_X + COL_INPUT_W + COL_PROCESS_W;

  // 1. Function Header Bar
  cmds.push(
    drawRect(
      x0,
      topY,
      CONTENT_WIDTH,
      FN_HEADER_H,
      [241, 245, 249], // bg-slate-100
      [203, 213, 225], // border-slate-300
      0.85
    )
  );

  // Indigo index badge
  const badgeX = x0 + 10;
  const badgeY = topY + 5.5;
  const badgeW = 16;
  const badgeH = 15;
  cmds.push(drawRect(badgeX, badgeY, badgeW, badgeH, [79, 70, 229])); // bg-indigo-600
  const idxStr = String(card.index);
  const idxW = measureTextWidth(idxStr, 8.5, 'F5');
  cmds.push(
    drawText(
      idxStr,
      badgeX + (badgeW - idxW) / 2,
      topY + 16,
      'F5',
      8.5,
      [255, 255, 255]
    )
  );

  // Function Name
  const nameX = badgeX + badgeW + 7;
  const displayFnName = isContinuation ? `${card.fnName} (Lanjutan)` : card.fnName;
  cmds.push(drawText(displayFnName, nameX, topY + 16.5, 'F5', 10.5, [15, 23, 42]));

  // Role Pill Badge (if present)
  if (card.role) {
    const fnNameW = measureTextWidth(displayFnName, 10.5, 'F5');
    const roleText = `Role: ${card.role}`;
    const roleTextW = measureTextWidth(roleText, 8.5, 'F2');
    const pillX = nameX + fnNameW + 10;
    const pillW = roleTextW + 14;
    if (pillX + pillW < x0 + CONTENT_WIDTH - 68) {
      cmds.push(
        drawRect(
          pillX,
          topY + 5.5,
          pillW,
          15,
          [254, 243, 199], // bg-amber-100
          [245, 158, 11], // border-amber-500
          0.6
        )
      );
      cmds.push(drawText(roleText, pillX + 7, topY + 16, 'F2', 8.5, [146, 64, 14]));
    }
  }

  // Right-aligned "IPO CHART" label
  const rightLabel = 'IPO CHART';
  const rightLabelW = measureTextWidth(rightLabel, 8, 'F2');
  cmds.push(
    drawText(
      rightLabel,
      x0 + CONTENT_WIDTH - rightLabelW - 10,
      topY + 16,
      'F2',
      8,
      [100, 116, 139]
    )
  );

  // 2. 3-Column Header Row (INPUT | PROCESS | OUTPUT)
  const colHdrY = topY + FN_HEADER_H;
  cmds.push(
    drawRect(
      x0,
      colHdrY,
      CONTENT_WIDTH,
      COL_HEADER_H,
      [248, 250, 252], // bg-slate-50
      [203, 213, 225],
      0.85
    )
  );
  cmds.push(drawLine(x1, colHdrY, x1, colHdrY + COL_HEADER_H, [203, 213, 225], 0.85));
  cmds.push(drawLine(x2, colHdrY, x2, colHdrY + COL_HEADER_H, [203, 213, 225], 0.85));

  cmds.push(drawText('INPUT', x0 + CELL_PAD_X, colHdrY + 13.5, 'F2', 8.5, [51, 65, 85]));
  cmds.push(drawText('PROCESS', x1 + CELL_PAD_X, colHdrY + 13.5, 'F2', 8.5, [51, 65, 85]));
  cmds.push(drawText('OUTPUT', x2 + CELL_PAD_X, colHdrY + 13.5, 'F2', 8.5, [51, 65, 85]));

  // 3. 3-Column Body Row
  const bodyY = colHdrY + COL_HEADER_H;
  cmds.push(
    drawRect(
      x0,
      bodyY,
      CONTENT_WIDTH,
      card.bodyHeight,
      [255, 255, 255],
      [203, 213, 225],
      0.85
    )
  );
  cmds.push(drawLine(x1, bodyY, x1, bodyY + card.bodyHeight, [203, 213, 225], 0.85));
  cmds.push(drawLine(x2, bodyY, x2, bodyY + card.bodyHeight, [203, 213, 225], 0.85));

  // Render INPUT column
  let curInY = bodyY + CELL_PAD_TOP + 8.5;
  if (card.inputs.length === 0) {
    cmds.push(drawText('- None -', x0 + CELL_PAD_X, curInY, 'F3', 8.5, [148, 163, 184]));
  } else {
    card.inputs.forEach((item) => {
      // Blue bullet dot
      cmds.push(drawCircle(x0 + CELL_PAD_X + 2.5, curInY - 3, 2.2, [59, 130, 246]));
      item.lines.forEach((line) => {
        cmds.push(drawText(line, x0 + CELL_PAD_X + 9, curInY, 'F4', 9, [15, 23, 42]));
        curInY += LINE_HEIGHT;
      });
      curInY += ITEM_GAP;
    });
  }

  // Render PROCESS column
  let curPrY = bodyY + CELL_PAD_TOP + 8.5;
  if (card.processes.length === 0) {
    cmds.push(drawText('- None -', x1 + CELL_PAD_X, curPrY, 'F3', 8.5, [148, 163, 184]));
  } else {
    card.processes.forEach((item) => {
      cmds.push(drawText(item.numLabel, x1 + CELL_PAD_X, curPrY, 'F2', 9.5, [51, 65, 85]));
      item.lines.forEach((line) => {
        cmds.push(drawText(line, x1 + CELL_PAD_X + 16, curPrY, 'F1', 9.5, [30, 41, 59]));
        curPrY += LINE_HEIGHT;
      });
      curPrY += ITEM_GAP + 1;
    });
  }

  // Render OUTPUT column
  let curOutY = bodyY + CELL_PAD_TOP + 8.5;
  if (card.outputs.length === 0) {
    cmds.push(drawText('- None -', x2 + CELL_PAD_X, curOutY, 'F3', 8.5, [148, 163, 184]));
  } else {
    card.outputs.forEach((item) => {
      // Emerald bullet dot
      cmds.push(drawCircle(x2 + CELL_PAD_X + 2.5, curOutY - 3, 2.2, [16, 185, 129]));
      item.lines.forEach((line) => {
        cmds.push(drawText(line, x2 + CELL_PAD_X + 9, curOutY, 'F4', 9, [15, 23, 42]));
        curOutY += LINE_HEIGHT;
      });
      curOutY += ITEM_GAP;
    });
  }

  return cmds.join('\n');
}

/**
 * Splits an oversized Function card (one whose single table exceeds an entire A4 page)
 * into multiple page-sized sub-cards so even a 60-step function never overflows the page.
 */
function splitOversizedCard(card: PreparedFunctionCard, maxAvailHeight: number): PreparedFunctionCard[] {
  const maxBodyH = maxAvailHeight - FN_HEADER_H - COL_HEADER_H;
  const maxProcsPerSlice = Math.max(1, Math.floor((maxBodyH - CELL_PAD_TOP - CELL_PAD_BOTTOM) / (LINE_HEIGHT * 2.5)));

  if (card.processes.length <= 1) {
    return [card];
  }

  const slices: PreparedFunctionCard[] = [];
  for (let i = 0; i < card.processes.length; i += maxProcsPerSlice) {
    const procChunk = card.processes.slice(i, i + maxProcsPerSlice);
    const isFirst = i === 0;
    const chunkInputs = isFirst ? card.inputs : [];
    const chunkOutputs = isFirst ? card.outputs : [];

    let hIn = LINE_HEIGHT;
    if (chunkInputs.length > 0) {
      hIn = chunkInputs.reduce((acc, it, idx) => acc + it.lines.length * LINE_HEIGHT + (idx < chunkInputs.length - 1 ? ITEM_GAP : 0), 0);
    }
    let hOut = LINE_HEIGHT;
    if (chunkOutputs.length > 0) {
      hOut = chunkOutputs.reduce((acc, it, idx) => acc + it.lines.length * LINE_HEIGHT + (idx < chunkOutputs.length - 1 ? ITEM_GAP : 0), 0);
    }
    const hPr = procChunk.reduce(
      (acc, it, idx) => acc + it.lines.length * LINE_HEIGHT + (idx < procChunk.length - 1 ? ITEM_GAP + 1 : 0),
      0
    );

    const bodyHeight = Math.ceil(CELL_PAD_TOP + Math.max(hIn, hPr, hOut, LINE_HEIGHT) + CELL_PAD_BOTTOM);
    slices.push({
      index: card.index,
      fnName: card.fnName,
      role: card.role,
      inputs: chunkInputs,
      processes: procChunk,
      outputs: chunkOutputs,
      bodyHeight,
      totalHeight: FN_HEADER_H + COL_HEADER_H + bodyHeight,
    });
  }
  return slices;
}

/**
 * Generates and downloads an A4 Portrait multi-page vector PDF of all IPO Charts.
 * Ensures no Function's IPO Chart is cut across pages unless a single function alone exceeds 1 full A4 page.
 */
export function exportIpoToPdf(projectName: string, functions: IpoFunction[]): void {
  const actualFunctions = functions.filter((f) => f.type !== 'database');
  const usableBottomY = PAGE_HEIGHT - MARGIN_BOTTOM;

  const pagesCommands: string[][] = [];
  let currentPageCmds: string[] = [];
  let curY = MARGIN_TOP;

  // Draw Document Header on Page 1
  const title = projectName?.trim() || 'Functional Design IPO Charts';
  const subtitle = `Input - Process - Output Specifications (${actualFunctions.length} Function${
    actualFunctions.length !== 1 ? 's' : ''
  })`;

  currentPageCmds.push(drawText(title, MARGIN_X, curY + 14, 'F2', 14, [15, 23, 42]));
  curY += 20;
  currentPageCmds.push(drawText(subtitle, MARGIN_X, curY + 10, 'F1', 9.5, [100, 116, 139]));
  curY += 16;
  currentPageCmds.push(drawLine(MARGIN_X, curY, MARGIN_X + CONTENT_WIDTH, curY, [226, 232, 240], 1));
  curY += 14;

  if (actualFunctions.length === 0) {
    currentPageCmds.push(
      drawText(
        'Belum ada Function untuk ditampilkan.',
        MARGIN_X,
        curY + 14,
        'F3',
        10,
        [148, 163, 184]
      )
    );
    pagesCommands.push(currentPageCmds);
  } else {
    const fullPageAvailH = usableBottomY - MARGIN_TOP;

    actualFunctions.forEach((fn, idx) => {
      const prepared = prepareFunctionCard(fn, idx + 1);

      // If this single card is taller than an entire A4 page, split it cleanly
      if (prepared.totalHeight > fullPageAvailH) {
        const slices = splitOversizedCard(prepared, fullPageAvailH);
        slices.forEach((slice, sIdx) => {
          if (curY + slice.totalHeight > usableBottomY && curY > MARGIN_TOP + 10) {
            pagesCommands.push(currentPageCmds);
            currentPageCmds = [];
            curY = MARGIN_TOP;
          }
          currentPageCmds.push(renderCardToCommands(slice, curY, sIdx > 0));
          curY += slice.totalHeight + CARD_GAP;
        });
        return;
      }

      // Check if the entire Function IPO Chart fits on the current page.
      // If NOT, start a new A4 Portrait page so the table is NEVER cut in half!
      if (curY + prepared.totalHeight > usableBottomY && curY > MARGIN_TOP + 10) {
        pagesCommands.push(currentPageCmds);
        currentPageCmds = [];
        curY = MARGIN_TOP;
      }

      currentPageCmds.push(renderCardToCommands(prepared, curY, false));
      curY += prepared.totalHeight + CARD_GAP;
    });

    if (currentPageCmds.length > 0) {
      pagesCommands.push(currentPageCmds);
    }
  }

  // Add page footer ("projectName  •  Page X of N") to every page
  const totalPages = pagesCommands.length;
  pagesCommands.forEach((cmds, pIdx) => {
    const footerY = PAGE_HEIGHT - 20;
    cmds.push(drawLine(MARGIN_X, footerY - 10, MARGIN_X + CONTENT_WIDTH, footerY - 10, [226, 232, 240], 0.6));
    cmds.push(
      drawText(
        `${title} — IPO Chart Specification`,
        MARGIN_X,
        footerY,
        'F1',
        8,
        [148, 163, 184]
      )
    );
    const pageLabel = `Halaman ${pIdx + 1} dari ${totalPages}`;
    const pageLabelW = measureTextWidth(pageLabel, 8, 'F2');
    cmds.push(
      drawText(
        pageLabel,
        MARGIN_X + CONTENT_WIDTH - pageLabelW,
        footerY,
        'F2',
        8,
        [100, 116, 139]
      )
    );
  });

  // --- Assemble PDF 1.4 Document ---
  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3..7: Fonts F1..F5
  //For each page p (0..totalPages-1):
  //   pageObjId = 8 + p * 2
  //   contentObjId = 8 + p * 2 + 1
  const objects: string[] = [];
  const pageObjIds: number[] = [];

  for (let p = 0; p < totalPages; p++) {
    pageObjIds.push(8 + p * 2);
  }

  // 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);

  // 2: Pages
  const kidsRefs = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${totalPages} >>\nendobj`
  );

  // 3..7: Standard Type1 Fonts with WinAnsiEncoding
  objects.push(
    `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`
  );
  objects.push(
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`
  );
  objects.push(
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj`
  );
  objects.push(
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj`
  );
  objects.push(
    `7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>\nendobj`
  );

  // Page & Content stream objects
  for (let p = 0; p < totalPages; p++) {
    const pageObjId = 8 + p * 2;
    const contentObjId = 8 + p * 2 + 1;
    const streamData = pagesCommands[p].join('\n');

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${PAGE_WIDTH.toFixed(
        2
      )} ${PAGE_HEIGHT.toFixed(
        2
      )} ] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R /F5 7 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );

    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`
    );
  }

  // Build final PDF string with exact byte offsets in xref
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0]; // index 0 is free object

  for (const objStr of objects) {
    offsets.push(pdf.length);
    pdf += objStr + '\n';
  }

  const xrefOffset = pdf.length;
  const totalObjs = objects.length + 1;
  pdf += `xref\n0 ${totalObjs}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i < totalObjs; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const encoder = new TextEncoder();
  const pdfBytes = encoder.encode(pdf);

  const safeName =
    (projectName || 'ipo_chart')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'ipo_chart';

  const blob = new Blob([pdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}_ipo_chart_a4.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
