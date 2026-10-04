import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import {
  getSavedProjects,
  saveProject,
  deleteProject,
  exportProjectToJSON,
  importProjectFromJSON,
  createCloudShare,
  type SavedProject,
} from '../utils/storage';
import type { FlowDensity, FlowEdgeStyle } from '../utils/layout';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  projectName: string;
  onSetProjectName: (name: string) => void;
  direction: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
  onLoadProject: (project: {
    name: string;
    code: string;
    direction: 'TB' | 'LR';
    density?: FlowDensity;
    edgeStyle?: FlowEdgeStyle;
    nodePositions?: Record<string, { x: number; y: number }>;
  }) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  projectName,
  onSetProjectName,
  direction,
  density,
  edgeStyle,
  nodePositions,
  onLoadProject,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>(() => getSavedProjects());
  const [saveName, setSaveName] = useState<string>(projectName || 'Project Flowchart Baru');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShareProject = async (p: SavedProject) => {
    setSharingId(p.id);
    try {
      const res = await createCloudShare({
        name: p.name,
        code: p.code,
        direction: p.direction,
        density: p.density,
        edgeStyle: p.edgeStyle,
        nodePositions: p.nodePositions,
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
      setProjects(getSavedProjects());
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server sibuk';
      alert('Gagal membagikan proyek: ' + message);
    } finally {
      setSharingId(null);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    const saved = saveProject(saveName, currentCode, direction, undefined, density, edgeStyle, nodePositions);
    onSetProjectName(saved.name);
    setProjects(getSavedProjects());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus proyek "${name}"?`)) {
      const updated = deleteProject(id);
      setProjects(updated);
    }
  };

  const handleLoad = (p: SavedProject) => {
    onLoadProject({
      name: p.name,
      code: p.code,
      direction: p.direction,
      density: p.density,
      edgeStyle: p.edgeStyle,
      nodePositions: p.nodePositions,
    });
    onClose();
  };

  const handleExportJSON = () => {
    exportProjectToJSON({
      name: projectName || 'flowchart',
      code: currentCode,
      direction,
      density,
      edgeStyle,
      nodePositions,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectFromJSON(file);
      onLoadProject(imported);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Manajemen Proyek & Berkas</h2>
              <p className="text-[11px] text-slate-500">Simpan di browser lokal atau ekspor / impor berkas JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Section 1: Save Current Project */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5 text-indigo-600" />
                Simpan Proyek Saat Ini
              </span>
              {saveSuccess && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Berhasil disimpan!
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
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </form>
          </div>

          {/* Section 2: Export / Import JSON */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 font-medium transition-all group"
            >
              <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Ekspor File JSON</div>
                <div className="text-[10px] text-slate-400">Unduh .json pseudocode</div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-slate-800 font-medium transition-all group"
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

          {/* Section 3: Saved Projects List */}
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
                <p className="text-xs font-medium">Belum ada proyek yang disimpan secara lokal.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ketik nama di atas lalu klik "Simpan" untuk menyimpan.</p>
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
                  const lines = p.code.split('\n').filter((l) => l.trim().length > 0).length;

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
                            {lines} baris
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoad(p)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors"
                        >
                          Buka
                        </button>
                        <button
                          onClick={() => handleShareProject(p)}
                          disabled={sharingId === p.id}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
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
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
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
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
