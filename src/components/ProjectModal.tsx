import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Save,
  Trash2,
  Download,
  Upload,
  Calendar,
  Code,
  Check,
  Share2,
  Loader2,
  Table2,
  Network,
  Workflow,
} from 'lucide-react';
import {
  getSavedProjects,
  saveProject,
  deleteProject,
  exportProjectToJSON,
  importProjectFromJSON,
  createCloudShare,
  type SavedProject,
  type UniversalShareData,
  type AppMode,
} from '../utils/storage';
import type { FlowDensity, FlowEdgeStyle } from '../utils/layout';
import type { IpoFunction, IpoConnection } from '../types/ipoChart';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: AppMode;
  projectName: string;
  onSetProjectName: (name: string) => void;
  // Flowchart data
  currentCode?: string;
  direction?: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
  // Structure Chart data
  structureCode?: string;
  // IPO Chart data
  ipoFunctions?: IpoFunction[];
  ipoConnections?: IpoConnection[];
  ipoNodePositions?: Record<string, { x: number; y: number }> | null;
  // Universal Load Handler
  onLoadUniversalProject: (project: UniversalShareData) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  activeMode,
  projectName,
  onSetProjectName,
  currentCode = '',
  direction = 'TB',
  density = 'compact',
  edgeStyle = 'step',
  nodePositions,
  structureCode = '',
  ipoFunctions = [],
  ipoConnections = [],
  ipoNodePositions,
  onLoadUniversalProject,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [saveName, setSaveName] = useState<string>(projectName || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal is opened or activeMode changes
  useEffect(() => {
    if (isOpen) {
      setProjects(getSavedProjects(activeMode));
      setSaveName(
        projectName ||
          (activeMode === 'ipo'
            ? 'Proyek IPO Baru'
            : activeMode === 'structure'
            ? 'Proyek Structure Baru'
            : 'Proyek Flowchart Baru')
      );
    }
  }, [isOpen, activeMode, projectName]);

  if (!isOpen) return null;

  const handleShareProject = async (p: SavedProject) => {
    setSharingId(p.id);
    try {
      const res = await createCloudShare({
        mode: p.mode || activeMode,
        name: p.name,
        code: p.code,
        direction: p.direction,
        density: p.density,
        edgeStyle: p.edgeStyle,
        nodePositions: p.nodePositions,
        structureCode: p.structureCode,
        functions: p.functions,
        connections: p.connections,
        ipoNodePositions: p.ipoNodePositions,
      });

      try {
        await navigator.clipboard.writeText(res.url);
      } catch {
        const input = document.createElement('input');
        input.value = res.url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      setProjects(getSavedProjects(activeMode));
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server sibuk';
      alert('Gagal membagikan proyek: ' + message);
    } finally {
      setSharingId(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    let saved: SavedProject;
    if (activeMode === 'ipo') {
      saved = saveProject(
        saveName,
        '',
        'TB',
        undefined,
        undefined,
        undefined,
        undefined,
        'ipo',
        {
          functions: ipoFunctions,
          connections: ipoConnections,
          ipoNodePositions: ipoNodePositions || undefined,
        }
      );
    } else if (activeMode === 'structure') {
      saved = saveProject(
        saveName,
        structureCode,
        'TB',
        undefined,
        undefined,
        undefined,
        undefined,
        'structure',
        {
          structureCode,
        }
      );
    } else {
      saved = saveProject(
        saveName,
        currentCode,
        direction,
        undefined,
        density,
        edgeStyle,
        nodePositions,
        'flowchart'
      );
    }

    onSetProjectName(saved.name);
    setProjects(getSavedProjects(activeMode));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus proyek "${name}"?`)) {
      const updated = deleteProject(id, activeMode);
      setProjects(updated);
    }
  };

  const handleLoad = (p: SavedProject) => {
    onLoadUniversalProject({
      mode: p.mode || activeMode,
      name: p.name,
      code: p.code,
      direction: p.direction,
      density: p.density,
      edgeStyle: p.edgeStyle,
      nodePositions: p.nodePositions,
      structureCode: p.structureCode,
      functions: p.functions,
      connections: p.connections,
      ipoNodePositions: p.ipoNodePositions,
    });
    onClose();
  };

  const handleExportCurrentJSON = () => {
    exportProjectToJSON({
      mode: activeMode,
      name: projectName,
      code: currentCode,
      direction,
      density,
      edgeStyle,
      nodePositions,
      structureCode,
      functions: ipoFunctions,
      connections: ipoConnections,
      ipoNodePositions,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectFromJSON(file);
      onLoadUniversalProject(imported);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengimpor file';
      alert(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs ${
                activeMode === 'ipo'
                  ? 'bg-emerald-600'
                  : activeMode === 'structure'
                  ? 'bg-blue-600'
                  : 'bg-indigo-600'
              }`}
            >
              {activeMode === 'ipo' ? (
                <Table2 className="w-4 h-4" />
              ) : activeMode === 'structure' ? (
                <Network className="w-4 h-4" />
              ) : (
                <Workflow className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Manajemen Proyek & Berkas</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                    activeMode === 'ipo'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : activeMode === 'structure'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {activeMode === 'ipo'
                    ? 'IPO Chart'
                    : activeMode === 'structure'
                    ? 'Structure Chart'
                    : 'Flowchart'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Simpan di browser lokal atau ekspor / impor berkas format JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Section 1: Save Current Project */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5 text-indigo-600" />
                Simpan Proyek Saat Ini
              </span>
              {saveSuccess && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Berhasil disimpan ke browser!
                </span>
              )}
            </div>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Masukkan nama proyek..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </form>
          </div>

          {/* Section 2: Export / Import JSON */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportCurrentJSON}
              className="flex items-center justify-center gap-2.5 p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 font-medium transition-all group cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Ekspor File JSON</div>
                <div className="text-[10px] text-slate-400">Unduh .json {activeMode}</div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-slate-800 font-medium transition-all group cursor-pointer shadow-2xs"
            >
              <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Impor File JSON</div>
                <div className="text-[10px] text-slate-400">Buka berkas .json tersimpan</div>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Section 3: Saved Projects List for Active Mode */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                Daftar Proyek Tersimpan ({projects.length})
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FolderOpen className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-medium">
                  Belum ada proyek {activeMode} yang disimpan secara lokal.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ketik nama di atas lalu klik "Simpan" untuk menyimpan secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {projects.map((p) => {
                  const dateStr = new Date(p.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  let subtitleText = '';
                  if (activeMode === 'ipo') {
                    const fnCount = p.functions?.length || 0;
                    const connCount = p.connections?.length || 0;
                    subtitleText = `${fnCount} fungsi, ${connCount} relasi`;
                  } else if (activeMode === 'structure') {
                    const lines = (p.structureCode || p.code || '')
                      .split('\n')
                      .filter((l) => l.trim().length > 0).length;
                    subtitleText = `${lines} baris modul`;
                  } else {
                    const lines = (p.code || '')
                      .split('\n')
                      .filter((l) => l.trim().length > 0).length;
                    subtitleText = `${lines} baris pseudocode`;
                  }

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateStr}
                          </span>
                          <span className="flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            {subtitleText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoad(p)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Buka
                        </button>
                        <button
                          onClick={() => handleShareProject(p)}
                          disabled={sharingId === p.id}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer ${
                            copiedId === p.id
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'
                          }`}
                          title="Salin Tautan Unik Publik Proyek Ini"
                        >
                          {sharingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : copiedId === p.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600 font-semibold">Tersalin!</span>
                            </>
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
