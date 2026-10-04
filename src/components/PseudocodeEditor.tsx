import React, { useRef, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Trash2,
  RotateCcw,
  Code2,
  ListTree,
} from 'lucide-react';
import type { ParseError } from '../types/flowchart';

export interface PseudocodeEditorRef {
  insertSnippet: (snippet: string) => void;
  highlightLine: (lineNumber: number) => void;
}

interface PseudocodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors: ParseError[];
  onResetDefault: () => void;
}

export const PseudocodeEditor = forwardRef<PseudocodeEditorRef, PseudocodeEditorProps>(
  ({ value, onChange, errors, onResetDefault }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const [blinkLine, setBlinkLine] = useState<number | null>(null);
    const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [scrollTop, setScrollTop] = useState<number>(0);
    const [scrollLeft, setScrollLeft] = useState<number>(0);
    const [showIndentGuides, setShowIndentGuides] = useState<boolean>(true);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      insertSnippet: (snippet: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
          onChange(value + (value.endsWith('\n') ? '' : '\n') + snippet);
          return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;

        // If inserting at start of line or with proper line break
        const before = currentText.substring(0, start);
        const after = currentText.substring(end);

        // Ensure newline before snippet if before doesn't end with newline and is not empty
        const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
        const newText = before + prefix + snippet + after;

        onChange(newText);

        // Restore cursor position right after snippet
        setTimeout(() => {
          textarea.focus();
          const newPos = start + prefix.length + snippet.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 10);
      },

      highlightLine: (lineNumber: number) => {
        if (!lineNumber || lineNumber <= 0) return;
        setBlinkLine(lineNumber);

        if (blinkTimeoutRef.current) {
          clearTimeout(blinkTimeoutRef.current);
        }
        blinkTimeoutRef.current = setTimeout(() => {
          setBlinkLine(null);
        }, 2500);

        const textarea = textareaRef.current;
        if (!textarea) return;

        const allLines = value.split('\n');
        if (lineNumber > allLines.length) return;

        // Compute character index range for the line
        let charStart = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
          charStart += allLines[i].length + 1; // +1 for \n
        }
        const charEnd = charStart + allLines[lineNumber - 1].length;

        // Center the line smoothly in view
        const LINE_HEIGHT = 22;
        const targetTop = Math.max(0, (lineNumber - 4) * LINE_HEIGHT);
        textarea.scrollTo({ top: targetTop, behavior: 'smooth' });
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
        setScrollTop(targetTop);

        // Focus and select the statement so user can directly edit
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(charStart, charEnd);
        }, 40);
      },
    }));

    // Synchronize scroll between line numbers, indent guides, and textarea
    const handleScroll = () => {
      if (textareaRef.current) {
        setScrollTop(textareaRef.current.scrollTop);
        setScrollLeft(textareaRef.current.scrollLeft);
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
      }
    };

    // Calculate VS Code-style indentation guide segments
    const indentGuides = useMemo(() => {
      if (!showIndentGuides) return [];

      const allLines = value.split('\n');
      const segments: { lineIndex: number; col: number; isActive: boolean }[] = [];

      // Calculate leading spaces for each line (expand tabs to 2 spaces)
      const lineIndents: number[] = allLines.map((line) => {
        const expanded = line.replace(/\t/g, '  ');
        const match = expanded.match(/^(\s*)/);
        return match ? match[1].length : 0;
      });

      // Handle blank lines: inherit minimum indent of surrounding non-empty lines
      for (let i = 0; i < allLines.length; i++) {
        if (!allLines[i].trim()) {
          let nextIndent = 0;
          for (let j = i + 1; j < allLines.length; j++) {
            if (allLines[j].trim()) {
              nextIndent = lineIndents[j];
              break;
            }
          }
          const prevIndent = i > 0 ? lineIndents[i - 1] : 0;
          lineIndents[i] = Math.min(prevIndent, nextIndent);
        }
      }

      // Identify active column from blinkLine
      const activeLineIndent =
        blinkLine && blinkLine <= lineIndents.length ? lineIndents[blinkLine - 1] : -1;

      // Generate segments at column stops 0, 2, 4, 6, ... for each line
      for (let i = 0; i < allLines.length; i++) {
        const indentSpaces = lineIndents[i];
        if (indentSpaces >= 2) {
          // Place guides at col = 0, 2, 4, ... up to indentSpaces - 2
          for (let col = 0; col < indentSpaces; col += 2) {
            const isActive = activeLineIndent >= 2 && col === activeLineIndent - 2;
            segments.push({
              lineIndex: i,
              col,
              isActive,
            });
          }
        }
      }

      return segments;
    }, [value, blinkLine, showIndentGuides]);

    // Handle indentation on Tab and Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Insert 4 spaces
        const updated = value.substring(0, start) + '    ' + value.substring(end);
        onChange(updated);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      } else if (e.key === 'Enter') {
        // Auto-indent: check current line indent
        const start = textarea.selectionStart;
        const currentLine = value.substring(0, start).split('\n').pop() || '';
        const match = currentLine.match(/^(\s+)/);
        const indent = match ? match[1] : '';

        // Check if current line opened a block (JIKA, MAKA, SELAMA, LAKUKAN)
        const isBlockOpen = /(?:maka|then|lakukan|do)\s*$/i.test(currentLine.trim());
        const extraIndent = isBlockOpen ? '    ' : '';

        if (indent || extraIndent) {
          e.preventDefault();
          const toInsert = '\n' + indent + extraIndent;
          const updated = value.substring(0, start) + toInsert + value.substring(start);
          onChange(updated);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + toInsert.length;
          }, 0);
        }
      }
    };

    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, 1);

    const handleCopy = () => {
      navigator.clipboard.writeText(value);
    };

    const handleClear = () => {
      if (window.confirm('Kosongkan editor pseudocode?')) {
        onChange('');
      }
    };

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Editor Top Bar */}
        <div className="h-9 px-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Editor Pseudocode</span>
            <span className="text-[10px] text-slate-400">({lineCount} baris)</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Indent Guides Toggle Button */}
            <button
              onClick={() => setShowIndentGuides((prev) => !prev)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                showIndentGuides
                  ? 'bg-slate-200 text-indigo-600 font-medium'
                  : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
              }`}
              title={
                showIndentGuides
                  ? 'Garis Panduan Indentasi (VS Code): Aktif'
                  : 'Garis Panduan Indentasi: Nonaktif'
              }
            >
              <ListTree className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Salin Pseudocode"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetDefault}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Reset ke Contoh Template Awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClear}
              className="p-1 hover:bg-rose-100 rounded text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Kosongkan Editor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editor Code Area */}
        <div className="flex-1 relative flex min-h-0 overflow-hidden font-mono text-xs bg-white">
          {/* Line Numbers Column */}
          <div
            ref={lineNumbersRef}
            className="w-10 bg-slate-50 border-r border-slate-200 py-3 text-right select-none text-slate-400 overflow-hidden font-mono shrink-0 z-20"
            style={{ lineHeight: '22px' }}
          >
            {Array.from({ length: lineCount }).map((_, i) => {
              const lineNum = i + 1;
              const hasError = errors.some((err) => err.line === lineNum);
              const isBlinking = blinkLine === lineNum;

              return (
                <div
                  key={i}
                  className={`h-[22px] transition-all flex items-center justify-end pr-1.5 ${
                    isBlinking
                      ? 'bg-emerald-500 text-white font-extrabold ring-2 ring-emerald-400 rounded-xs scale-105 shadow-xs animate-pulse z-20'
                      : hasError
                      ? 'text-rose-600 font-bold bg-rose-100/50 rounded-xs'
                      : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          {/* Text Area & Indent Guides Layer Container */}
          <div className="flex-1 relative min-h-0 h-full overflow-hidden bg-white">
            {/* VS Code Style Indentation Guides Layer */}
            {showIndentGuides && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
                style={{
                  transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
                }}
              >
                {indentGuides.map((seg, idx) => (
                  <div
                    key={idx}
                    className={`absolute w-[1px] transition-colors pointer-events-none ${
                      seg.isActive
                        ? 'bg-indigo-500/70 shadow-2xs'
                        : 'bg-slate-300/60'
                    }`}
                    style={{
                      left: `calc(12px + ${seg.col}ch)`,
                      top: `${seg.lineIndex * 22 + 12}px`,
                      height: '22px',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Text Area (bg-transparent so indent guides show cleanly underneath) */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                if (blinkLine !== null) setBlinkLine(null);
                onChange(e.target.value);
              }}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder={`Tulis pseudocode Anda di sini...\nContoh:\nMULAI\nMASUKKAN nilai\nJIKA nilai > 70 MAKA\n    TAMPILKAN "Lulus"\nLAINNYA\n    TAMPILKAN "Gagal"\nAKHIR-JIKA\nSELESAI`}
              className="w-full h-full p-3 bg-transparent text-slate-800 resize-none outline-none border-0 leading-[22px] whitespace-pre font-mono overflow-auto selection:bg-indigo-100 z-10"
              style={{ lineHeight: '22px' }}
            />

            {/* Animated Green Blink Line Overlay (Rendered above textarea with z-30 pointer-events-none) */}
            {blinkLine && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-30 transition-all duration-150"
                style={{
                  top: `${(blinkLine - 1) * 22 + 12 - scrollTop}px`,
                  height: '22px',
                }}
              >
                <div className="w-full h-full bg-emerald-400/25 border-y-2 border-emerald-500 flex items-center justify-between px-2">
                  <div className="w-1.5 h-full bg-emerald-500 rounded-full" />
                  <span className="bg-emerald-600 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 animate-bounce">
                    ✏️ Edit di sini
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status & Error Bar */}
        <div className="border-t border-slate-200 px-3 py-2 bg-slate-50 text-xs">
          {errors.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-[11px]">Sintaks valid & diagram terhubung dengan baik</span>
            </div>
          ) : (
            <div className="space-y-1">
              {errors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">
                    {err.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PseudocodeEditor.displayName = 'PseudocodeEditor';
