import type { IpoFunction, IpoConnection } from '../types/ipoChart';

/**
 * Escapes XML special characters, strips invalid XML 1.0 control characters,
 * and neutralizes leading spreadsheet formula triggers (=, +, @).
 */
function escapeXml(str: string): string {
  const safeFormula = /^[=+@]/.test(str) ? ` ${str}` : str;
  return (
    safeFormula
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  );
}

/**
 * Converts 1-based column index (1 -> A, 2 -> B, 27 -> AA) to Excel column letter.
 */
function colLetter(colIndex1: number): string {
  let n = colIndex1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/**
 * Estimates how many visual wrapped lines a string will take in a column of `colWidth` chars.
 */
function estimateVisualLines(text: string, colWidth: number): number {
  if (!text) return 1;
  const effectiveWidth = Math.max(10, colWidth - 4);
  const paragraphs = text.split(/\r?\n/);
  let totalLines = 0;
  for (const p of paragraphs) {
    const trimmedLen = p.length;
    if (trimmedLen === 0) {
      totalLines += 1;
    } else {
      totalLines += Math.ceil(trimmedLen / effectiveWidth);
    }
  }
  return Math.max(1, totalLines);
}

// --- Minimal CRC32 + Uncompressed ZIP Builder for .xlsx (ECMA-376 OpenXML) ---

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function buildZipArchive(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = entry.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + file name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // Compression method: 0 (STORE)
    lv.setUint16(10, 0, true); // Mod time
    lv.setUint16(12, 0x21, true); // Mod date
    lv.setUint32(14, crc, true); // CRC-32
    lv.setUint32(18, size, true); // Compressed size
    lv.setUint32(22, size, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // File name length
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    localChunks.push(localHeader, dataBytes);

    // Central directory file header (46 bytes + file name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // Compression method: 0 (STORE)
    cv.setUint16(12, 0, true); // Mod time
    cv.setUint16(14, 0x21, true); // Mod date
    cv.setUint32(16, crc, true); // CRC-32
    cv.setUint32(20, size, true); // Compressed size
    cv.setUint32(24, size, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // File name length
    cv.setUint16(30, 0, true); // Extra length
    cv.setUint16(32, 0, true); // Comment length
    cv.setUint16(34, 0, true); // Disk number
    cv.setUint16(36, 0, true); // Internal attrs
    cv.setUint32(38, 0, true); // External attrs
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    centralChunks.push(centralHeader);
    offset += localHeader.length + size;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const c of centralChunks) centralDirSize += c.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, centralDirOffset, true);
  ev.setUint16(20, 0, true);

  const totalSize = centralDirOffset + centralDirSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let pos = 0;
  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(eocd, pos);
  return output;
}

/**
 * Style indices defined in buildStylesXml():
 * 0 = Default normal
 * 1 = Project Title Banner (14pt Bold #0F172A, Fill #EEF2FF, Center/Left)
 * 2 = Project Subtitle Banner (10pt Italic #475569, Fill #F8FAFC, Border bottom)
 * 3 = Function Card Header Left (11pt Bold Consolas #1E1B4B, Fill #E0E7FF, Border all)
 * 4 = Function Card Header Right "IPO CHART" (10pt Bold #4338CA, Fill #E0E7FF, Right-aligned, Border all)
 * 5 = Table Column Header INPUT / PROCESS / OUTPUT (10pt Bold #1E293B, Fill #F1F5F9, Border all)
 * 6 = Input / Output Data Cell (10pt Consolas #0F172A, WrapText, Top-aligned, Border all)
 * 7 = Process Data Cell (10pt Calibri #0F172A, WrapText, Top-aligned, Border all)
 * 8 = Empty "- None -" Cell (10pt Italic #94A3B8, WrapText, Top-aligned, Border all)
 * 9 = Sheet 2 Section Title (12pt Bold #0F172A, Fill #DCFCE7, Border all)
 * 10 = Sheet 2 Table Header (10pt Bold #065F46, Fill #ECFDF5, Center/Left, Border all)
 * 11 = Sheet 2 Data Cell Center (10pt Calibri #1E293B, WrapText, Top/Center, Border all)
 */
function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="10">
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF1E1B4B"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF1E1B4B"/><name val="Consolas"/></font>
    <font><b/><sz val="10"/><color rgb="FF4338CA"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Consolas"/></font>
    <font><i/><sz val="10"/><color rgb="FF94A3B8"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF065F46"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF065F46"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0E7FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="thin"><color rgb="FF94A3B8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="5" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="6" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="7" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="8" fillId="7" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="9" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;
}

interface CellSpec {
  col: number; // 1-based
  value: string;
  style: number;
}

interface RowSpec {
  rowNum: number; // 1-based
  height: number;
  cells: CellSpec[];
}

function buildWorksheetXml(
  colWidths: number[],
  rows: RowSpec[],
  merges: string[]
): string {
  const colsXml = colWidths
    .map(
      (w, idx) =>
        `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`
    )
    .join('');

  const rowsXml = rows
    .map((r) => {
      const cellsXml = r.cells
        .map((c) => {
          const ref = `${colLetter(c.col)}${r.rowNum}`;
          return `<c r="${ref}" s="${c.style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
            c.value
          )}</t></is></c>`;
        })
        .join('');
      return `<row r="${r.rowNum}" ht="${r.height}" customHeight="1">${cellsXml}</row>`;
    })
    .join('');

  const mergesXml =
    merges.length > 0
      ? `<mergeCells count="${merges.length}">${merges
          .map((m) => `<mergeCell ref="${m}"/>`)
          .join('')}</mergeCells>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0" showGridLines="1"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  ${mergesXml}
  <pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
</worksheet>`;
}

/**
 * Builds Sheet 1 ("IPO Charts") matching the exact 3-column academic IPO Chart in IpoPreview.tsx
 * with auto-adjusted column widths (25% : 50% : 25% ratio) and auto-adjusted row heights.
 */
function buildIpoChartsSheet(
  projectName: string,
  functions: IpoFunction[]
): string {
  const actualFunctions = functions.filter((f) => f.type !== 'database');

  // Dynamically compute optimal column widths while maintaining the 25% / 50% / 25% visual balance
  let maxInputLen = 28;
  let maxOutputLen = 28;
  let maxProcessLineLen = 58;

  for (const fn of actualFunctions) {
    for (const inp of fn.inputs) {
      maxInputLen = Math.max(maxInputLen, (inp.name?.length || 0) + 6);
    }
    for (const out of fn.outputs) {
      maxOutputLen = Math.max(maxOutputLen, (out.name?.length || 0) + 6);
    }
    for (const pr of fn.processes) {
      const lines = (pr.description || '').split(/\r?\n/);
      for (const l of lines) {
        maxProcessLineLen = Math.max(maxProcessLineLen, Math.min(88, l.length + 6));
      }
    }
  }

  const colAWidth = Math.min(48, Math.max(32, maxInputLen));
  const colCWidth = Math.min(48, Math.max(32, maxOutputLen));
  const colBWidth = Math.min(92, Math.max(66, maxProcessLineLen, Math.round((colAWidth + colCWidth) * 1.05)));

  const colWidths = [colAWidth, colBWidth, colCWidth];
  const rows: RowSpec[] = [];
  const merges: string[] = [];
  let r = 1;

  // Row 1: Project Title Banner
  const titleText = projectName?.trim() || 'Functional Design IPO Charts';
  rows.push({
    rowNum: r,
    height: 30,
    cells: [
      { col: 1, value: titleText, style: 1 },
      { col: 2, value: '', style: 1 },
      { col: 3, value: '', style: 1 },
    ],
  });
  merges.push(`A${r}:C${r}`);
  r++;

  // Row 2: Subtitle Banner
  const subtitleText = `Input – Process – Output Specifications (${actualFunctions.length} Function${
    actualFunctions.length !== 1 ? 's' : ''
  })`;
  rows.push({
    rowNum: r,
    height: 22,
    cells: [
      { col: 1, value: subtitleText, style: 2 },
      { col: 2, value: '', style: 2 },
      { col: 3, value: '', style: 2 },
    ],
  });
  merges.push(`A${r}:C${r}`);
  r++;

  // Row 3: Blank spacer
  rows.push({
    rowNum: r,
    height: 12,
    cells: [],
  });
  r++;

  if (actualFunctions.length === 0) {
    rows.push({
      rowNum: r,
      height: 32,
      cells: [
        { col: 1, value: 'Belum ada Function untuk ditampilkan.', style: 8 },
        { col: 2, value: '', style: 8 },
        { col: 3, value: '', style: 8 },
      ],
    });
    merges.push(`A${r}:C${r}`);
  } else {
    actualFunctions.forEach((fn, idx) => {
      const fnTitle = fn.name?.trim() ? `${fn.name.trim()}()` : '(untitledFunction)';
      const roleBadge = fn.role?.trim() ? `   •   Role: ${fn.role.trim()}` : '';
      const leftHeader = `[${idx + 1}]  ${fnTitle}${roleBadge}`;

      // Function Header Row (A..B merged for Function Name + Role, C for "IPO CHART")
      rows.push({
        rowNum: r,
        height: 26,
        cells: [
          { col: 1, value: leftHeader, style: 3 },
          { col: 2, value: '', style: 3 },
          { col: 3, value: 'IPO CHART', style: 4 },
        ],
      });
      merges.push(`A${r}:B${r}`);
      r++;

      // 3-Column Header Row (INPUT | PROCESS | OUTPUT)
      rows.push({
        rowNum: r,
        height: 22,
        cells: [
          { col: 1, value: 'INPUT', style: 5 },
          { col: 2, value: 'PROCESS', style: 5 },
          { col: 3, value: 'OUTPUT', style: 5 },
        ],
      });
      r++;

      // 3-Column Content Row (Formatted identically to the IPO Chart table in the app)
      const hasInputs = fn.inputs.length > 0;
      const hasProcesses = fn.processes.length > 0;
      const hasOutputs = fn.outputs.length > 0;

      const inputText = hasInputs
        ? fn.inputs.map((inp) => `• ${inp.name?.trim() || '(unnamed)'}`).join('\n')
        : '- None -';

      const processText = hasProcesses
        ? fn.processes
            .map((pr, pIdx) => `${pIdx + 1}. ${pr.description?.trim() || '(no description)'}`)
            .join('\n\n')
        : '- None -';

      const outputText = hasOutputs
        ? fn.outputs.map((out) => `• ${out.name?.trim() || '(unnamed)'}`).join('\n')
        : '- None -';

      const linesA = estimateVisualLines(inputText, colAWidth);
      const linesB = estimateVisualLines(processText, colBWidth);
      const linesC = estimateVisualLines(outputText, colCWidth);
      const maxVisualLines = Math.max(linesA, linesB, linesC, 2);

      // Compute exact row height in points so all wrapped lines are visible immediately
      const calculatedHeight = Math.min(409, Math.max(36, maxVisualLines * 16 + 14));

      rows.push({
        rowNum: r,
        height: calculatedHeight,
        cells: [
          { col: 1, value: inputText, style: hasInputs ? 6 : 8 },
          { col: 2, value: processText, style: hasProcesses ? 7 : 8 },
          { col: 3, value: outputText, style: hasOutputs ? 6 : 8 },
        ],
      });
      r++;

      // Spacer row between Function IPO tables
      rows.push({
        rowNum: r,
        height: 14,
        cells: [],
      });
      r++;
    });
  }

  return buildWorksheetXml(colWidths, rows, merges);
}

/**
 * Builds Sheet 2 ("Relationships & Blocks") summarizing all Function/Database blocks and Connections.
 */
function buildRelationshipsSheet(
  projectName: string,
  functions: IpoFunction[],
  connections: IpoConnection[]
): string {
  const colWidths = [8, 28, 16, 26, 26, 26, 26];
  const rows: RowSpec[] = [];
  const merges: string[] = [];
  let r = 1;

  const trackWidth = (col1: number, text: string) => {
    const idx = col1 - 1;
    if (idx >= 1 && idx < colWidths.length) {
      colWidths[idx] = Math.min(52, Math.max(colWidths[idx], (text?.length || 0) + 5));
    }
  };

  // Title Banner
  rows.push({
    rowNum: r,
    height: 28,
    cells: [
      { col: 1, value: `${projectName || 'IPO Project'} — Function Relationships & Blocks`, style: 1 },
      { col: 2, value: '', style: 1 },
      { col: 3, value: '', style: 1 },
      { col: 4, value: '', style: 1 },
      { col: 5, value: '', style: 1 },
      { col: 6, value: '', style: 1 },
      { col: 7, value: '', style: 1 },
    ],
  });
  merges.push(`A${r}:G${r}`);
  r++;

  rows.push({ rowNum: r++, height: 10, cells: [] });

  // Section 1: Daftar Relasi Antar Blok (Connections)
  rows.push({
    rowNum: r,
    height: 24,
    cells: [
      { col: 1, value: `DAFTAR RELASI ANTAR BLOK (${connections.length} Connection)`, style: 9 },
      { col: 2, value: '', style: 9 },
      { col: 3, value: '', style: 9 },
      { col: 4, value: '', style: 9 },
      { col: 5, value: '', style: 9 },
      { col: 6, value: '', style: 9 },
      { col: 7, value: '', style: 9 },
    ],
  });
  merges.push(`A${r}:G${r}`);
  r++;

  rows.push({
    rowNum: r++,
    height: 22,
    cells: [
      { col: 1, value: 'No', style: 10 },
      { col: 2, value: 'Label Relasi', style: 10 },
      { col: 3, value: 'Gaya Garis', style: 10 },
      { col: 4, value: 'Source Block', style: 10 },
      { col: 5, value: 'Source Output Pin', style: 10 },
      { col: 6, value: 'Target Block', style: 10 },
      { col: 7, value: 'Target Input Pin', style: 10 },
    ],
  });

  if (connections.length === 0) {
    rows.push({
      rowNum: r,
      height: 24,
      cells: [
        { col: 1, value: 'Belum ada relasi antar blok.', style: 8 },
        { col: 2, value: '', style: 8 },
        { col: 3, value: '', style: 8 },
        { col: 4, value: '', style: 8 },
        { col: 5, value: '', style: 8 },
        { col: 6, value: '', style: 8 },
        { col: 7, value: '', style: 8 },
      ],
    });
    merges.push(`A${r}:G${r}`);
    r++;
  } else {
    connections.forEach((conn, idx) => {
      const srcFn = functions.find((f) => f.id === conn.sourceFunctionId);
      const tgtFn = functions.find((f) => f.id === conn.targetFunctionId);
      const srcOut = srcFn?.outputs.find((o) => o.id === conn.sourceOutputId);
      const tgtIn = tgtFn?.inputs.find((i) => i.id === conn.targetInputId);

      const label =
        conn.label?.trim() ||
        srcOut?.name?.trim() ||
        tgtIn?.name?.trim() ||
        `Connection #${idx + 1}`;

      const srcName = srcFn
        ? srcFn.type === 'database'
          ? `[DB] ${srcFn.name || '(untitled db)'}`
          : `${srcFn.name || '(untitled)'}()`
        : '(unknown)';

      const tgtName = tgtFn
        ? tgtFn.type === 'database'
          ? `[DB] ${tgtFn.name || '(untitled db)'}`
          : `${tgtFn.name || '(untitled)'}()`
        : '(unknown)';

      const srcPin =
        srcFn?.type === 'database'
          ? 'Read from Database'
          : srcOut?.name || 'Langsung (Tanpa Pin)';

      const tgtPin =
        tgtFn?.type === 'database'
          ? 'Save to Database'
          : tgtIn?.name || 'Langsung (Tanpa Pin)';

      trackWidth(2, label);
      trackWidth(4, srcName);
      trackWidth(5, srcPin);
      trackWidth(6, tgtName);
      trackWidth(7, tgtPin);

      rows.push({
        rowNum: r++,
        height: 22,
        cells: [
          { col: 1, value: String(idx + 1), style: 11 },
          { col: 2, value: label, style: 6 },
          { col: 3, value: conn.lineStyle === 'dashed' ? 'Dashed (---)' : 'Solid (───)', style: 11 },
          { col: 4, value: srcName, style: 6 },
          { col: 5, value: srcPin, style: 7 },
          { col: 6, value: tgtName, style: 6 },
          { col: 7, value: tgtPin, style: 7 },
        ],
      });
    });
  }

  rows.push({ rowNum: r++, height: 14, cells: [] });

  // Section 2: Ringkasan Blok (Functions & Databases)
  rows.push({
    rowNum: r,
    height: 24,
    cells: [
      { col: 1, value: `DAFTAR BLOK FUNCTION & DATABASE (${functions.length} Blok)`, style: 9 },
      { col: 2, value: '', style: 9 },
      { col: 3, value: '', style: 9 },
      { col: 4, value: '', style: 9 },
      { col: 5, value: '', style: 9 },
      { col: 6, value: '', style: 9 },
      { col: 7, value: '', style: 9 },
    ],
  });
  merges.push(`A${r}:G${r}`);
  r++;

  rows.push({
    rowNum: r++,
    height: 22,
    cells: [
      { col: 1, value: 'No', style: 10 },
      { col: 2, value: 'Nama Blok', style: 10 },
      { col: 3, value: 'Tipe', style: 10 },
      { col: 4, value: 'Role / Aktor', style: 10 },
      { col: 5, value: 'Jumlah Input', style: 10 },
      { col: 6, value: 'Jumlah Process', style: 10 },
      { col: 7, value: 'Jumlah Output', style: 10 },
    ],
  });

  functions.forEach((fn, idx) => {
    const isDb = fn.type === 'database';
    const blockName = isDb ? fn.name || '(untitled db)' : `${fn.name || '(untitled)'}()`;
    const roleStr = isDb ? '-' : fn.role?.trim() || '-';
    trackWidth(2, blockName);
    trackWidth(4, roleStr);

    rows.push({
      rowNum: r++,
      height: 22,
      cells: [
        { col: 1, value: String(idx + 1), style: 11 },
        { col: 2, value: blockName, style: 6 },
        { col: 3, value: isDb ? 'Database' : 'Function', style: 11 },
        { col: 4, value: roleStr, style: 7 },
        { col: 5, value: isDb ? '-' : String(fn.inputs.length), style: 11 },
        { col: 6, value: isDb ? '-' : String(fn.processes.length), style: 11 },
        { col: 7, value: isDb ? '-' : String(fn.outputs.length), style: 11 },
      ],
    });
  });

  return buildWorksheetXml(colWidths, rows, merges);
}

/**
 * Generates and triggers download of an `.xlsx` workbook containing:
 * - Sheet 1: "IPO Charts" (3-column academic IPO tables adjusted to match the program)
 * - Sheet 2: "Function Relationships" (Connections & Block summary)
 */
export function exportIpoToExcel(
  projectName: string,
  functions: IpoFunction[],
  connections: IpoConnection[]
): void {
  const encoder = new TextEncoder();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="IPO Charts" sheetId="1" r:id="rId1"/>
    <sheet name="Function Relationships" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = buildStylesXml();
  const sheet1Xml = buildIpoChartsSheet(projectName, functions);
  const sheet2Xml = buildRelationshipsSheet(projectName, functions, connections);

  const zipBytes = buildZipArchive([
    { path: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { path: '_rels/.rels', data: encoder.encode(rootRelsXml) },
    { path: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { path: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
    { path: 'xl/styles.xml', data: encoder.encode(stylesXml) },
    { path: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheet1Xml) },
    { path: 'xl/worksheets/sheet2.xml', data: encoder.encode(sheet2Xml) },
  ]);

  const safeName =
    (projectName || 'ipo_chart')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'ipo_chart';

  const blob = new Blob([zipBytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}_ipo_chart.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
