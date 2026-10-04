import React, { useState, useEffect, useMemo } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  fetchSharesFromFirebase,
  deleteShareFromFirebase,
  type User,
} from '../utils/firebase';
import {
  getShareHistory,
  deleteShareHistoryItem,
  clearShareHistory,
  type ShareHistoryItem,
} from '../utils/storage';
import {
  ShieldCheck,
  Flame,
  Mail,
  KeyRound,
  ArrowLeft,
  ExternalLink,
  Copy,
  Trash2,
  Download,
  Search,
  Database,
  LogOut,
  Check,
  Share2,
  RefreshCw,
  GitBranch,
  Network,
  TableProperties,
} from 'lucide-react';

interface AdminPageProps {
  onBackToStudio: () => void;
  onLoadProject: (shareUrl: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToStudio,
  onLoadProject,
}) => {
  // Auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Login form states
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Data states
  const [history, setHistory] = useState<ShareHistoryItem[]>([]);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'flowchart' | 'structure' | 'ipo'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Monitor sesi autentikasi resmi dari server Firebase (mirip SHORT LINK)
  useEffect(() => {
    if (!auth) {
      setIsCheckingSession(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        await loadData();
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsCheckingSession(false);
    });

    return () => unsubscribe();
  }, []);

  async function loadData() {
    setIsFetchingData(true);
    try {
      // 1. Ambil data dari Firebase Firestore
      const remoteItems = await fetchSharesFromFirebase();
      // 2. Ambil data dari Local Storage
      const localItems = getShareHistory();

      // Gabungkan data unik berdasarkan ID
      const map = new Map<string, ShareHistoryItem>();
      localItems.forEach((item) => map.set(item.id, item));
      remoteItems.forEach((item) => map.set(item.id, item));

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHistory(merged);
    } catch (err) {
      console.error('Gagal mengambil data share:', err);
      setHistory(getShareHistory());
    } finally {
      setIsFetchingData(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setIsLoadingAuth(true);

    const emailClean = emailInput.trim();
    const passClean = passwordInput.trim();

    if (!emailClean) {
      setAuthError('Silakan masukkan Email Admin!');
      setIsLoadingAuth(false);
      return;
    }

    if (!passClean) {
      setAuthError('Silakan masukkan Password!');
      setIsLoadingAuth(false);
      return;
    }

    if (!auth) {
      setAuthError('Firebase Auth belum diinisialisasi. Periksa koneksi internet atau konfigurasi Firebase.');
      setIsLoadingAuth(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailClean, passClean);
      if (userCredential && userCredential.user) {
        setCurrentUser(userCredential.user);
        setIsAuthenticated(true);
        setAuthError('');
        showToast(`⚡ Access Granted! Selamat datang, ${userCredential.user.email}`);
        await loadData();
      }
    } catch (fbErr: any) {
      let errorMsg = 'Email atau Password salah! Periksa kembali akun di Firebase Console.';
      if (fbErr.code === 'auth/invalid-email') {
        errorMsg = 'Format email tidak valid.';
      } else if (
        fbErr.code === 'auth/user-not-found' ||
        fbErr.code === 'auth/wrong-password' ||
        fbErr.code === 'auth/invalid-credential'
      ) {
        errorMsg = 'Email atau Password salah! Pastikan menggunakan akun admin yang sama dengan Web Porto & Short Link.';
      } else if (fbErr.code === 'auth/too-many-requests') {
        errorMsg = 'Terlalu banyak percobaan login gagal. Silakan tunggu beberapa saat.';
      } else if (fbErr.code === 'auth/network-request-failed') {
        errorMsg = 'Koneksi jaringan gagal. Pastikan perangkat terhubung ke internet.';
      }
      setAuthError(errorMsg);
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      if (auth) {
        await fbSignOut(auth);
      }
    } catch (e) {}
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast('👋 Berhasil Sign Out dari Admin Panel.');
  }

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast(`Tautan [${id}] berhasil disalin ke clipboard!`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Hapus catatan link ${id} dari database riwayat?`)) {
      deleteShareHistoryItem(id);
      await deleteShareFromFirebase(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showToast(`Tautan [${id}] berhasil dihapus dari database.`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Yakin ingin mengosongkan seluruh riwayat database tautan? Tindakan ini tidak dapat dibatalkan.')) {
      clearShareHistory();
      setHistory([]);
      showToast('Seluruh riwayat database lokal berhasil dibersihkan.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `share_history_database_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database riwayat berhasil diekspor ke file JSON.');
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return history.filter((item) => {
      const matchesTab = activeTab === 'all' || item.mode === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.projectName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [history, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: history.length,
      flowchart: history.filter((i) => i.mode === 'flowchart').length,
      structure: history.filter((i) => i.mode === 'structure').length,
      ipo: history.filter((i) => i.mode === 'ipo').length,
    };
  }, [history]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // ----------------------------------------------------
  // 1. STATE: CHECKING SESSION
  // ----------------------------------------------------
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] text-[#0A0A0A] flex items-center justify-center p-4">
        <div className="p-6 bg-white border-[3px] border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] rounded-2xl flex items-center gap-3 font-mono text-xs font-extrabold animate-pulse">
          <ShieldCheck className="w-6 h-6 text-[#3B6EF5] animate-spin" />
          <span>MEMVERIFIKASI SESI KEAMANAN FIREBASE...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. STATE: LOGIN SCREEN (NEOBRUTALISM ADMIN PORTAL)
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] text-[#0A0A0A] bg-[linear-gradient(to_right,#0a0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a0a_1px,transparent_1px)] bg-[size:24px_24px] flex flex-col justify-between p-4 sm:p-8 select-none">
        {/* Top Header */}
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={onBackToStudio}
            className="px-4 py-2 bg-white text-[#0A0A0A] border-[2.5px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] rounded-xl font-mono text-xs font-extrabold hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Kembali Ke Studio / Editor</span>
          </button>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#3B6EF5]" />
            <span className="font-mono text-xs font-extrabold text-[#0A0A0A]/70 hidden sm:inline">
              PROGRAM DESIGN STUDIO • ADMIN PORTAL
            </span>
          </div>
        </div>

        {/* Login Box */}
        <div className="w-full max-w-md mx-auto bg-white border-[3px] border-[#0A0A0A] shadow-[12px_12px_0px_#0A0A0A] rounded-2xl p-6 sm:p-8 space-y-6 my-8">
          <div className="flex items-center gap-3 border-b-[2.5px] border-[#0A0A0A] pb-4">
            <div className="p-2.5 bg-indigo-50 border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-xl flex items-center justify-center">
              <Database className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-extrabold text-2xl text-[#0A0A0A] leading-tight tracking-tight">
                  ADMIN PORTAL
                </h1>
                <span className="px-2 py-0.5 bg-[#FF5C8A] text-white font-mono text-[9px] font-extrabold rounded border border-[#0A0A0A] flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>FIREBASE AUTH</span>
                </span>
              </div>
              <p className="font-mono text-xs font-extrabold text-[#3B6EF5]">
                SHARE DATABASE CONTROL PANEL
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono font-extrabold text-[#0A0A0A] mb-1.5 uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#3B6EF5]" />
                <span>EMAIL ADMIN FIREBASE:</span>
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Masukkan Email Admin Anda"
                className="w-full px-4 py-2.5 bg-[#FAFAF7] border-[2.5px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] rounded-xl font-mono text-xs font-bold focus:outline-none focus:bg-white"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono font-extrabold text-[#0A0A0A] mb-1.5 uppercase flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#FF5C8A]" />
                <span>PASSWORD:</span>
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan Password Anda"
                className="w-full px-4 py-2.5 bg-[#FAFAF7] border-[2.5px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] rounded-xl font-mono text-xs font-bold focus:outline-none focus:bg-white"
              />
            </div>

            {authError && (
              <div className="p-3 bg-[#FF5C8A]/15 border-[2px] border-[#FF5C8A] rounded-xl">
                <p className="text-xs font-mono font-extrabold text-[#FF5C8A] leading-tight">
                  ⚠️ {authError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingAuth}
              className={`w-full py-3 bg-[#3B6EF5] text-white font-mono text-sm font-extrabold border-[2.5px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl hover:bg-[#2c5ad6] cursor-pointer flex items-center justify-center gap-2 transition-all ${
                isLoadingAuth
                  ? 'opacity-70 cursor-wait'
                  : 'hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]'
              }`}
            >
              {isLoadingAuth ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#4CE0D2]" />
                  <span>Sign In To Database Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-[#FFC93C]/20 border-[1.5px] border-[#0A0A0A] rounded-xl">
            <p className="font-mono text-[11px] font-bold text-[#0A0A0A] leading-tight">
              🔐 <strong>Satu Akun Terpusat:</strong> Gunakan email & password yang sama dengan Admin Panel Web Porto & Short Link Anda.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center font-mono text-xs font-bold text-[#0A0A0A]/50">
          © {new Date().getFullYear()} PUTU AGUS NANDA PRATAMA • ALL RIGHTS RESERVED
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. STATE: AUTHENTICATED ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white border-2 border-slate-700 shadow-xl rounded-xl font-mono text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStudio}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kembali ke lembar kerja diagram"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali Ke Studio</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
                  <span>ADMIN PANEL • DATABASE TAUTAN</span>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono font-semibold">
                    Live
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 font-mono">
                  Program Design Studio Central Repository
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[200px]">{currentUser?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Keluar dari akun admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tautan</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{counts.all}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Flowchart</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{counts.flowchart}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Structure Chart</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">{counts.structure}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
              <Network className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">IPO Chart</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{counts.ipo}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
              <TableProperties className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Database Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({counts.all})
              </button>
              <button
                onClick={() => setActiveTab('flowchart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'flowchart'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Flowchart ({counts.flowchart})
              </button>
              <button
                onClick={() => setActiveTab('structure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'structure'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Structure ({counts.structure})
              </button>
              <button
                onClick={() => setActiveTab('ipo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ipo'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                IPO Chart ({counts.ipo})
              </button>
            </div>

            {/* Search Input & Refresh Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, kode link, mode..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
              <button
                onClick={loadData}
                disabled={isFetchingData}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                title="Segarkan data dari Firebase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingData ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {filteredList.length === 0 ? (
              <div className="py-16 text-center">
                <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Tidak ada riwayat tautan ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery
                    ? 'Coba gunakan kata kunci pencarian yang berbeda.'
                    : 'Belum ada tautan berbagi yang pernah digenerate.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-32">Menu / Mode</th>
                    <th className="py-3.5 px-4">Nama Proyek</th>
                    <th className="py-3.5 px-4">Tautan & Kode Unik</th>
                    <th className="py-3.5 px-4 w-44">Waktu Generate</th>
                    <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredList.map((item) => {
                    const isCopied = copiedId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Mode Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.mode === 'ipo' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg font-bold text-[11px]">
                              <TableProperties className="w-3 h-3" />
                              IPO Chart
                            </span>
                          ) : item.mode === 'structure' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg font-bold text-[11px]">
                              <Network className="w-3 h-3" />
                              Structure
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg font-bold text-[11px]">
                              <GitBranch className="w-3 h-3" />
                              Flowchart
                            </span>
                          )}
                        </td>

                        {/* Project Name */}
                        <td className="py-3.5 px-4 font-sans font-semibold text-slate-800">
                          {item.projectName}
                        </td>

                        {/* Link & Code */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded font-bold text-[10px]">
                              {item.id}
                            </span>
                            <span className="text-slate-500 text-[11px] max-w-[260px] truncate" title={item.url}>
                              {item.url}
                            </span>
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                          {formatDate(item.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleCopy(item.url, item.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title="Salin tautan"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => onLoadProject(item.url)}
                              className="p-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg transition-all cursor-pointer"
                              title="Muat & Buka proyek di editor"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 rounded-lg transition-all cursor-pointer"
                              title="Hapus tautan ini"
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
            )}
          </div>

          {/* Table Footer Actions */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tersinkronisasi dengan Firebase & Database Lokal.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center font-mono text-xs text-slate-400">
        © {new Date().getFullYear()} PUTU AGUS NANDA PRATAMA • SECURE FIREBASE CLOUD REPOSITORY
      </footer>
    </div>
  );
};
