import React, { useState } from 'react';
import {
  X,
  Database,
  Search,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Download,
  Workflow,
  Network,
  Table2,
  Clock,
  Globe2,
} from 'lucide-react';
import {
  getShareHistory,
  deleteShareHistoryItem,
  clearShareHistory,
  type ShareHistoryItem,
  type AppMode,
} from '../utils/storage';

interface ShareHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProjectUrl?: (url: string) => void;
}

export const ShareHistoryModal: React.FC<ShareHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadProjectUrl,
}) => {
  const [history, setHistory] = useState<ShareHistoryItem[]>(() => getShareHistory());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | AppMode>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync state whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setHistory(getShareHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const counts = {
    all: history.length,
    flowchart: history.filter((h) => h.mode === 'flowchart').length,
    structure: history.filter((h) => h.mode === 'structure').length,
    ipo: history.filter((h) => h.mode === 'ipo').length,
  };

  const filteredHistory = history.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.mode === activeFilter;
    const matchesSearch =
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = async (item: ShareHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = item.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus tautan ini dari riwayat database?')) {
      const updated = deleteShareHistoryItem(id);
      setHistory(updated);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Yakin ingin mengosongkan semua riwayat tautan berbagi?')) {
      clearShareHistory();
      setHistory([]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `share_history_database_${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Database Riwayat Tautan Berbagi</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-xs font-bold">
                  {history.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Semua tautan unik publik yang pernah digenerate beserta waktu pembuatannya
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              onClick={() => setActiveFilter('flowchart')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'flowchart'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Flowchart ({counts.flowchart})</span>
            </button>
            <button
              onClick={() => setActiveFilter('structure')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'structure'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Structure ({counts.structure})</span>
            </button>
            <button
              onClick={() => setActiveFilter('ipo')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'ipo'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>IPO Chart ({counts.ipo})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau kode link..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Database Table Body */}
        <div className="overflow-y-auto grow p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Globe2 className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500">Belum ada riwayat tautan berbagi yang cocok.</p>
              <p className="text-[11px] text-slate-400">
                Klik tombol <strong>Bagikan</strong> di bagian atas untuk menghasilkan tautan unik baru.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-32">Menu / Mode</th>
                    <th className="py-2.5 px-3">Nama Proyek</th>
                    <th className="py-2.5 px-3 w-48">Tautan & Kode</th>
                    <th className="py-2.5 px-3 w-44">Waktu Generate</th>
                    <th className="py-2.5 px-3 text-right w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((item) => {
                    const isCopied = copiedId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Mode */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.mode === 'ipo' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Table2 className="w-3 h-3 text-emerald-600" />
                              IPO Chart
                            </span>
                          ) : item.mode === 'structure' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Network className="w-3 h-3 text-blue-600" />
                              Structure
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Workflow className="w-3 h-3 text-indigo-600" />
                              Flowchart
                            </span>
                          )}
                        </td>

                        {/* Project Name */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[220px]" title={item.projectName}>
                            {item.projectName}
                          </span>
                        </td>

                        {/* Link & Code */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700 shrink-0">
                              {item.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={item.url}>
                              {item.url}
                            </span>
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatDateTime(item.createdAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(item)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title={isCopied ? 'Tersalin!' : 'Salin Tautan'}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {/* Open button */}
                            <button
                              onClick={() => {
                                if (onLoadProjectUrl) {
                                  onLoadProjectUrl(item.url);
                                  onClose();
                                } else {
                                  window.open(item.url, '_blank');
                                }
                              }}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                              title="Buka Proyek Tautan Ini"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Hapus dari Database Riwayat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Tersimpan secara aman di database lokal browser.</span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title="Ekspor seluruh database riwayat ke berkas JSON"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor JSON</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title="Hapus semua riwayat tautan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Semua</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
