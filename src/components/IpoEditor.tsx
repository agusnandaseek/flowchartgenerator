import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Layers,
  ArrowRight,
  Link2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import type {
  IpoFunction,
  IpoConnection,
  IpoInput,
  IpoProcess,
  IpoOutput,
} from '../types/ipoChart';
import { validateIpoProject } from '../utils/ipoValidation';
import { IPO_TEMPLATES } from '../utils/ipoTemplates';

interface IpoEditorProps {
  functions: IpoFunction[];
  connections: IpoConnection[];
  onChangeFunctions: (functions: IpoFunction[]) => void;
  onChangeConnections: (connections: IpoConnection[]) => void;
  onLoadTemplate: (templateId: string) => void;
  onResetBlank: () => void;
}

const generateId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

export const IpoEditor: React.FC<IpoEditorProps> = ({
  functions,
  connections,
  onChangeFunctions,
  onChangeConnections,
  onLoadTemplate,
  onResetBlank,
}) => {
  const [activeTab, setActiveTab] = useState<'functions' | 'connections'>('functions');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Validate state
  const { functionErrors, connectionErrors } = validateIpoProject(functions, connections);

  // --- FUNCTION MANAGEMENT ---
  const handleAddFunction = () => {
    const newFn: IpoFunction = {
      id: generateId('fn'),
      name: '',
      inputs: [],
      processes: [],
      outputs: [],
    };
    onChangeFunctions([...functions, newFn]);
  };

  const handleUpdateFunctionName = (fnId: string, name: string) => {
    onChangeFunctions(
      functions.map((fn) => (fn.id === fnId ? { ...fn, name } : fn))
    );
  };

  const handleDeleteFunction = (fnId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus function ini?')) return;
    onChangeFunctions(functions.filter((fn) => fn.id !== fnId));
    // Clean up connections referencing this function
    onChangeConnections(
      connections.filter(
        (c) => c.sourceFunctionId !== fnId && c.targetFunctionId !== fnId
      )
    );
  };

  const handleDuplicateFunction = (fnId: string) => {
    const fnToDup = functions.find((f) => f.id === fnId);
    if (!fnToDup) return;

    const duplicatedFn: IpoFunction = {
      id: generateId('fn'),
      name: `${fnToDup.name}Copy`,
      inputs: fnToDup.inputs.map((inp) => ({ id: generateId('in'), name: inp.name })),
      processes: fnToDup.processes.map((pr) => ({ id: generateId('pr'), description: pr.description })),
      outputs: fnToDup.outputs.map((out) => ({ id: generateId('out'), name: out.name })),
    };

    const idx = functions.findIndex((f) => f.id === fnId);
    const newFns = [...functions];
    newFns.splice(idx + 1, 0, duplicatedFn);
    onChangeFunctions(newFns);
  };

  const handleMoveFunction = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= functions.length) return;
    const newFns = [...functions];
    const temp = newFns[index];
    newFns[index] = newFns[targetIdx];
    newFns[targetIdx] = temp;
    onChangeFunctions(newFns);
  };

  // --- INPUT MANAGEMENT ---
  const handleAddInput = (fnId: string) => {
    const newInput: IpoInput = { id: generateId('in'), name: '' };
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId ? { ...fn, inputs: [...fn.inputs, newInput] } : fn
      )
    );
  };

  const handleUpdateInput = (fnId: string, inpId: string, name: string) => {
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId
          ? {
              ...fn,
              inputs: fn.inputs.map((i) => (i.id === inpId ? { ...i, name } : i)),
            }
          : fn
      )
    );
  };

  const handleDeleteInput = (fnId: string, inpId: string) => {
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId
          ? { ...fn, inputs: fn.inputs.filter((i) => i.id !== inpId) }
          : fn
      )
    );
  };

  const handleMoveInput = (fnId: string, index: number, direction: 'up' | 'down') => {
    onChangeFunctions(
      functions.map((fn) => {
        if (fn.id !== fnId) return fn;
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= fn.inputs.length) return fn;
        const newInputs = [...fn.inputs];
        const temp = newInputs[index];
        newInputs[index] = newInputs[targetIdx];
        newInputs[targetIdx] = temp;
        return { ...fn, inputs: newInputs };
      })
    );
  };

  // --- PROCESS MANAGEMENT ---
  const handleAddProcess = (fnId: string) => {
    const newProcess: IpoProcess = { id: generateId('pr'), description: '' };
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId ? { ...fn, processes: [...fn.processes, newProcess] } : fn
      )
    );
  };

  const handleUpdateProcess = (fnId: string, prId: string, description: string) => {
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId
          ? {
              ...fn,
              processes: fn.processes.map((p) =>
                p.id === prId ? { ...p, description } : p
              ),
            }
          : fn
      )
    );
  };

  const handleDeleteProcess = (fnId: string, prId: string) => {
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId
          ? { ...fn, processes: fn.processes.filter((p) => p.id !== prId) }
          : fn
      )
    );
  };

  const handleMoveProcess = (fnId: string, index: number, direction: 'up' | 'down') => {
    onChangeFunctions(
      functions.map((fn) => {
        if (fn.id !== fnId) return fn;
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= fn.processes.length) return fn;
        const newProcesses = [...fn.processes];
        const temp = newProcesses[index];
        newProcesses[index] = newProcesses[targetIdx];
        newProcesses[targetIdx] = temp;
        return { ...fn, processes: newProcesses };
      })
    );
  };

  // --- OUTPUT MANAGEMENT ---
  const handleAddOutput = (fnId: string) => {
    const newOutput: IpoOutput = { id: generateId('out'), name: '' };
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId ? { ...fn, outputs: [...fn.outputs, newOutput] } : fn
      )
    );
  };

  const handleUpdateOutput = (fnId: string, outId: string, name: string) => {
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId
          ? {
              ...fn,
              outputs: fn.outputs.map((o) => (o.id === outId ? { ...o, name } : o)),
            }
          : fn
      )
    );
  };

  const handleDeleteOutput = (fnId: string, outId: string) => {
    onChangeFunctions(
      functions.map((fn) =>
        fn.id === fnId
          ? { ...fn, outputs: fn.outputs.filter((o) => o.id !== outId) }
          : fn
      )
    );
  };

  const handleMoveOutput = (fnId: string, index: number, direction: 'up' | 'down') => {
    onChangeFunctions(
      functions.map((fn) => {
        if (fn.id !== fnId) return fn;
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= fn.outputs.length) return fn;
        const newOutputs = [...fn.outputs];
        const temp = newOutputs[index];
        newOutputs[index] = newOutputs[targetIdx];
        newOutputs[targetIdx] = temp;
        return { ...fn, outputs: newOutputs };
      })
    );
  };

  // --- CONNECTION MANAGEMENT ---
  const handleAddConnection = () => {
    if (functions.length < 2) {
      alert('Dibutuhkan minimal 2 function untuk membuat connection.');
      return;
    }
    const srcFn = functions[0];
    const tgtFn = functions[1];
    const newConn: IpoConnection = {
      id: generateId('conn'),
      sourceFunctionId: srcFn.id,
      sourceOutputId: srcFn.outputs[0]?.id || '',
      targetFunctionId: tgtFn.id,
      targetInputId: tgtFn.inputs[0]?.id || '',
      label: '',
    };
    onChangeConnections([...connections, newConn]);
  };

  const handleUpdateConnection = (connId: string, patch: Partial<IpoConnection>) => {
    onChangeConnections(
      connections.map((c) => (c.id === connId ? { ...c, ...patch } : c))
    );
  };

  const handleDeleteConnection = (connId: string) => {
    onChangeConnections(connections.filter((c) => c.id !== connId));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 select-none">
      {/* Top Controls Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Sub-tab switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('functions')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'functions'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Functions ({functions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'connections'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connections ({connections.length})</span>
              {Object.keys(connectionErrors).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {activeTab === 'functions' ? (
              <button
                onClick={handleAddFunction}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Tambahkan function baru ke IPO chart"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Function</span>
              </button>
            ) : (
              <button
                onClick={handleAddConnection}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Tambahkan hubungan relasi antar-function"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Connection</span>
              </button>
            )}
          </div>
        </div>

        {/* Template & Reset Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1 text-slate-500 min-w-0">
            <FolderOpen className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-600 shrink-0">Template:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTemplate(val);
                if (val) {
                  onLoadTemplate(val);
                }
              }}
              className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-medium outline-none cursor-pointer truncate max-w-[170px]"
            >
              <option value="">Pilih Contoh...</option>
              {IPO_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Reset semua function dan connection ke kanvas kosong?')) {
                onResetBlank();
                setSelectedTemplate('');
              }
            }}
            className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
            title="Reset ke proyek baru"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 min-h-0">
        {/* TAB 1: FUNCTIONS BUILDER */}
        {activeTab === 'functions' && (
          <>
            {functions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700 mb-1">Belum Ada Function</h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Klik tombol di bawah untuk membuat Function Card pertama Anda.
                </p>
                <button
                  onClick={handleAddFunction}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Function</span>
                </button>
              </div>
            ) : (
              functions.map((fn, fnIdx) => {
                const fnErrs = functionErrors[fn.id] || [];

                return (
                  <div
                    key={fn.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Function Card Header */}
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {fnIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={fn.name}
                            onChange={(e) => handleUpdateFunctionName(fn.id, e.target.value)}
                            placeholder="Function Name (e.g. calculateItemTotal)"
                            className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleMoveFunction(fnIdx, 'up')}
                          disabled={fnIdx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                          title="Geser fungsi ke atas"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveFunction(fnIdx, 'down')}
                          disabled={fnIdx === functions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                          title="Geser fungsi ke bawah"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateFunction(fn.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Duplikasi Function"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFunction(fn.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Function"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content: Input, Process, Output */}
                    <div className="p-3 space-y-3.5">
                      {/* SECTION: INPUT */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            INPUT ({fn.inputs.length})
                          </label>
                          <button
                            onClick={() => handleAddInput(fn.id)}
                            className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Input</span>
                          </button>
                        </div>

                        {fn.inputs.length === 0 ? (
                          <div className="py-2 px-2.5 bg-slate-50 border border-dashed border-slate-200 rounded text-[11px] text-slate-400 italic">
                            Belum ada input. Klik "+ Add Input" untuk menambahkan parameter masukan.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {fn.inputs.map((inp, inpIdx) => (
                              <div key={inp.id} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={inp.name}
                                  onChange={(e) => handleUpdateInput(fn.id, inp.id, e.target.value)}
                                  placeholder="Input variable (e.g. quantity)"
                                  className="flex-1 bg-white border border-slate-200 focus:border-blue-500 rounded px-2 py-0.5 text-xs font-mono text-slate-800 outline-none"
                                />
                                <button
                                  onClick={() => handleMoveInput(fn.id, inpIdx, 'up')}
                                  disabled={inpIdx === 0}
                                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                  title="Geser ke atas"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveInput(fn.id, inpIdx, 'down')}
                                  disabled={inpIdx === fn.inputs.length - 1}
                                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                  title="Geser ke bawah"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInput(fn.id, inp.id)}
                                  className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Hapus input"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION: PROCESS */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            PROCESS ({fn.processes.length})
                          </label>
                          <button
                            onClick={() => handleAddProcess(fn.id)}
                            className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Process</span>
                          </button>
                        </div>

                        {fn.processes.length === 0 ? (
                          <div className="py-2 px-2.5 bg-slate-50 border border-dashed border-slate-200 rounded text-[11px] text-slate-400 italic">
                            Belum ada proses. Klik "+ Add Process" untuk menuliskan langkah logika/kalkulasi.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {fn.processes.map((pr, prIdx) => (
                              <div key={pr.id} className="flex items-start gap-1">
                                <textarea
                                  value={pr.description}
                                  onChange={(e) => handleUpdateProcess(fn.id, pr.id, e.target.value)}
                                  placeholder="Process description (e.g. Multiply quantity by price)"
                                  rows={2}
                                  className="flex-1 bg-white border border-slate-200 focus:border-amber-500 rounded px-2 py-1 text-xs text-slate-800 outline-none resize-y min-h-[42px]"
                                />
                                <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                  <button
                                    onClick={() => handleMoveProcess(fn.id, prIdx, 'up')}
                                    disabled={prIdx === 0}
                                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="Geser ke atas"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveProcess(fn.id, prIdx, 'down')}
                                    disabled={prIdx === fn.processes.length - 1}
                                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="Geser ke bawah"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProcess(fn.id, pr.id)}
                                    className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="Hapus proses"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION: OUTPUT */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            OUTPUT ({fn.outputs.length})
                          </label>
                          <button
                            onClick={() => handleAddOutput(fn.id)}
                            className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Output</span>
                          </button>
                        </div>

                        {fn.outputs.length === 0 ? (
                          <div className="py-2 px-2.5 bg-slate-50 border border-dashed border-slate-200 rounded text-[11px] text-slate-400 italic">
                            Belum ada output. Klik "+ Add Output" untuk menambahkan data keluaran.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {fn.outputs.map((out, outIdx) => (
                              <div key={out.id} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={out.name}
                                  onChange={(e) => handleUpdateOutput(fn.id, out.id, e.target.value)}
                                  placeholder="Output variable (e.g. itemTotal)"
                                  className="flex-1 bg-white border border-slate-200 focus:border-emerald-500 rounded px-2 py-0.5 text-xs font-mono text-slate-800 outline-none"
                                />
                                <button
                                  onClick={() => handleMoveOutput(fn.id, outIdx, 'up')}
                                  disabled={outIdx === 0}
                                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                  title="Geser ke atas"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveOutput(fn.id, outIdx, 'down')}
                                  disabled={outIdx === fn.outputs.length - 1}
                                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                  title="Geser ke bawah"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOutput(fn.id, out.id)}
                                  className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Hapus output"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Structural Validation Feedback */}
                      {fnErrs.length > 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 space-y-0.5">
                          {fnErrs.map((err, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* TAB 2: CONNECTIONS BUILDER */}
        {activeTab === 'connections' && (
          <>
            {connections.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <Link2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700 mb-1">Belum Ada Connection</h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Hubungkan Output dari satu function ke Input function lain secara manual.
                </p>
                <button
                  onClick={handleAddConnection}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Connection</span>
                </button>
              </div>
            ) : (
              connections.map((conn, connIdx) => {
                const srcFn = functions.find((f) => f.id === conn.sourceFunctionId);
                const tgtFn = functions.find((f) => f.id === conn.targetFunctionId);
                const isInvalid = !!connectionErrors[conn.id];

                return (
                  <div
                    key={conn.id}
                    className={`bg-white rounded-xl border p-3 space-y-2.5 shadow-2xs transition-all ${
                      isInvalid ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] flex items-center justify-center font-bold">
                          {connIdx + 1}
                        </span>
                        Connection #{connIdx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteConnection(conn.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Invalid Reference Warning */}
                    {isInvalid && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Connection contains an invalid reference.</span>
                      </div>
                    )}

                    {/* Source Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Source Function & Output:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={conn.sourceFunctionId}
                          onChange={(e) => {
                            const newSrcId = e.target.value;
                            const newSrcFn = functions.find((f) => f.id === newSrcId);
                            handleUpdateConnection(conn.id, {
                              sourceFunctionId: newSrcId,
                              sourceOutputId: newSrcFn?.outputs[0]?.id || '',
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 outline-none"
                        >
                          <option value="">-- Pilih Function --</option>
                          {functions.map((fn) => (
                            <option key={fn.id} value={fn.id}>
                              {fn.name ? `${fn.name}()` : '(untitled)'}
                            </option>
                          ))}
                        </select>

                        <select
                          value={conn.sourceOutputId}
                          onChange={(e) =>
                            handleUpdateConnection(conn.id, { sourceOutputId: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 outline-none"
                        >
                          <option value="">-- Pilih Output --</option>
                          {srcFn?.outputs.map((out) => (
                            <option key={out.id} value={out.id}>
                              {out.name || '(unnamed)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-center my-0.5 text-slate-400">
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </div>

                    {/* Target Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Target Function & Input:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={conn.targetFunctionId}
                          onChange={(e) => {
                            const newTgtId = e.target.value;
                            const newTgtFn = functions.find((f) => f.id === newTgtId);
                            handleUpdateConnection(conn.id, {
                              targetFunctionId: newTgtId,
                              targetInputId: newTgtFn?.inputs[0]?.id || '',
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 outline-none"
                        >
                          <option value="">-- Pilih Function --</option>
                          {functions.map((fn) => (
                            <option key={fn.id} value={fn.id}>
                              {fn.name ? `${fn.name}()` : '(untitled)'}
                            </option>
                          ))}
                        </select>

                        <select
                          value={conn.targetInputId}
                          onChange={(e) =>
                            handleUpdateConnection(conn.id, { targetInputId: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 outline-none"
                        >
                          <option value="">-- Pilih Input --</option>
                          {tgtFn?.inputs.map((inp) => (
                            <option key={inp.id} value={inp.id}>
                              {inp.name || '(unnamed)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Optional Label */}
                    <div className="pt-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-0.5">
                        Label (Opsional):
                      </label>
                      <input
                        type="text"
                        value={conn.label || ''}
                        onChange={(e) =>
                          handleUpdateConnection(conn.id, { label: e.target.value })
                        }
                        placeholder="Contoh: itemTotal, discountedTotal"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};
