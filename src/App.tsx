import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { PresetToolbar } from './components/PresetToolbar';
import { StructurePresetToolbar } from './components/StructurePresetToolbar';
import { PseudocodeEditor, type PseudocodeEditorRef } from './components/PseudocodeEditor';
import { FlowchartPreview, type FlowchartPreviewRef } from './components/FlowchartPreview';
import { StructureChartPreview, type StructureChartPreviewRef } from './components/StructureChartPreview';
import { IpoEditor } from './components/IpoEditor';
import { IpoPreview, type IpoPreviewRef } from './components/IpoPreview';
import { ProjectModal } from './components/ProjectModal';
import { ShareModal } from './components/ShareModal';
import { AdminPage } from './components/AdminPage';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { parsePseudocode } from './utils/parser';
import { parseStructureChart } from './utils/structureParser';
import { FLOWCHART_TEMPLATES } from './utils/templates';
import { STRUCTURE_TEMPLATES } from './utils/structureTemplates';
import { IPO_TEMPLATES } from './utils/ipoTemplates';
import { type FlowDensity, type FlowEdgeStyle } from './utils/layout';
import type { IpoFunction, IpoConnection } from './types/ipoChart';
import {
  getAutoSave,
  setAutoSave,
  exportProjectToJSON,
  createCloudShare,
  fetchSharedProject,
  type UniversalShareData,
} from './utils/storage';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash === '#admin' ||
    search.includes('admin=true') ||
    search.includes('admin')
  );
};

export function App() {
  const [currentRoute, setCurrentRoute] = useState<'studio' | 'admin'>(() => {
    return checkIsAdminRoute() ? 'admin' : 'studio';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(checkIsAdminRoute() ? 'admin' : 'studio');
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigateToStudio = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute('studio');
  };

  const [activeMode, setActiveMode] = useState<'flowchart' | 'structure' | 'ipo'>('flowchart');

  // --- FLOWCHART MODE STATE ---
  const autoSaved = useMemo(() => getAutoSave(), []);

  const [projectName, setProjectName] = useState<string>(
    autoSaved?.name || 'Autentikasi Pengguna & OTP'
  );
  const [code, setCode] = useState<string>(
    autoSaved?.code || FLOWCHART_TEMPLATES[0].code
  );
  const [direction, setDirection] = useState<'TB' | 'LR'>(
    autoSaved?.direction || 'TB'
  );
  const [density, setDensity] = useState<FlowDensity>(autoSaved?.density || 'compact');
  const [edgeStyle, setEdgeStyle] = useState<FlowEdgeStyle>(autoSaved?.edgeStyle || 'step');
  const [customNodePositions, setCustomNodePositions] = useState<Record<string, { x: number; y: number }> | null>(
    autoSaved?.nodePositions || null
  );

  // --- STRUCTURE CHART MODE STATE ---
  const autoSavedStructure = useMemo(() => {
    try {
      const raw = localStorage.getItem('structure_chart_studio_autosave');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const [structureProjectName, setStructureProjectName] = useState<string>(
    autoSavedStructure?.name || 'Sistem Manajemen Logistik & Pengiriman'
  );
  const [structureCode, setStructureCode] = useState<string>(
    autoSavedStructure?.code || STRUCTURE_TEMPLATES[0].code
  );

  // --- IPO CHART MODE STATE ---
  const autoSavedIpo = useMemo(() => {
    try {
      const raw = localStorage.getItem('ipo_chart_studio_autosave');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const [ipoProjectName, setIpoProjectName] = useState<string>(
    autoSavedIpo?.projectName || IPO_TEMPLATES[0].data.projectName
  );
  const [ipoFunctions, setIpoFunctions] = useState<IpoFunction[]>(
    autoSavedIpo?.functions || IPO_TEMPLATES[0].data.functions
  );
  const [ipoConnections, setIpoConnections] = useState<IpoConnection[]>(
    autoSavedIpo?.connections || IPO_TEMPLATES[0].data.connections
  );
  const [ipoNodePositions, setIpoNodePositions] = useState<Record<string, { x: number; y: number }> | null>(
    autoSavedIpo?.ipoNodePositions || null
  );

  const [tutorialTourStep, setTutorialTourStep] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isFullscreenFlowchart, setIsFullscreenFlowchart] = useState<boolean>(false);
  const [isTutorialOpenOverride, setIsTutorialOpenOverride] = useState<boolean>(false);

  // Sharing & Notification States
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isLoadingShared, setIsLoadingShared] = useState<boolean>(false);
  const [shareData, setShareData] = useState<{
    isOpen: boolean;
    shareUrl: string;
    projectId: string;
    projectName: string;
  }>({
    isOpen: false,
    shareUrl: '',
    projectId: '',
    projectName: '',
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLoadProjectFromShareUrl = useCallback(async (urlStr: string) => {
    try {
      let token: string | null = null;
      try {
        const urlObj = new URL(urlStr);
        token = urlObj.searchParams.get('p') || urlObj.searchParams.get('project');
      } catch {
        const match = urlStr.match(/[?&]p=([^&]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        showToast('Tautan tidak valid.', 'error');
        return;
      }

      setIsLoadingShared(true);
      const remoteData = await fetchSharedProject(token);
      if (remoteData) {
        if (remoteData.mode === 'structure') {
          setActiveMode('structure');
          setStructureProjectName(remoteData.name);
          if (remoteData.structureCode) setStructureCode(remoteData.structureCode);
          showToast(`Proyek Structure Chart "${remoteData.name}" berhasil dimuat!`, 'success');
        } else if (remoteData.mode === 'ipo') {
          setActiveMode('ipo');
          setIpoProjectName(remoteData.name);
          if (remoteData.functions) setIpoFunctions(remoteData.functions);
          if (remoteData.connections) setIpoConnections(remoteData.connections);
          if (remoteData.ipoNodePositions) setIpoNodePositions(remoteData.ipoNodePositions);
          showToast(`Proyek IPO Chart "${remoteData.name}" berhasil dimuat!`, 'success');
        } else {
          setActiveMode('flowchart');
          setProjectName(remoteData.name);
          if (remoteData.code) setCode(remoteData.code);
          setDirection(remoteData.direction || 'TB');
          if (remoteData.density) setDensity(remoteData.density);
          if (remoteData.edgeStyle) setEdgeStyle(remoteData.edgeStyle);
          if (remoteData.nodePositions) setCustomNodePositions(remoteData.nodePositions);
          showToast(`Proyek Flowchart "${remoteData.name}" berhasil dimuat!`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to load project from share url:', err);
      showToast('Gagal memuat proyek dari tautan.', 'error');
    } finally {
      setIsLoadingShared(false);
    }
  }, []);

  const handleLoadProjectFromAdmin = useCallback(async (shareUrl: string) => {
    handleNavigateToStudio();
    await handleLoadProjectFromShareUrl(shareUrl);
  }, [handleLoadProjectFromShareUrl]);

  const editorRef = useRef<PseudocodeEditorRef>(null);
  const previewRef = useRef<FlowchartPreviewRef>(null);
  const structureEditorRef = useRef<PseudocodeEditorRef>(null);
  const structurePreviewRef = useRef<StructureChartPreviewRef>(null);
  const ipoPreviewRef = useRef<IpoPreviewRef>(null);

  const handleToggleFullscreen = () => {
    setIsFullscreenFlowchart((prev) => !prev);
  };

  // Check URL parameter for shared project on mount (Flowchart, Structure Chart, or IPO Chart!)
  useEffect(() => {
    const handleUrlProject = async () => {
      let projectId: string | null = null;
      const urlParams = new URLSearchParams(window.location.search);
      const queryP = urlParams.get('p') || urlParams.get('project');
      if (queryP) {
        projectId = queryP;
      } else {
        const hash = window.location.hash;
        if (hash.startsWith('#/p/') || hash.startsWith('#/project/')) {
          projectId = hash.replace(/^#\/(p|project)\//, '');
        } else {
          const pathname = window.location.pathname;
          const match = pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
          if (match) {
            projectId = match[1];
          }
        }
      }

      if (projectId) {
        setIsLoadingShared(true);
        try {
          const remoteData = await fetchSharedProject(projectId);
          if (remoteData) {
            if (remoteData.mode === 'structure') {
              setActiveMode('structure');
              setStructureProjectName(remoteData.name);
              if (remoteData.structureCode) {
                setStructureCode(remoteData.structureCode);
              }
              showToast(`Proyek Structure Chart "${remoteData.name}" berhasil dimuat dari cloud!`, 'success');
            } else if (remoteData.mode === 'ipo') {
              setActiveMode('ipo');
              setIpoProjectName(remoteData.name);
              if (remoteData.functions) {
                setIpoFunctions(remoteData.functions);
              }
              if (remoteData.connections) {
                setIpoConnections(remoteData.connections);
              }
              if (remoteData.ipoNodePositions) {
                setIpoNodePositions(remoteData.ipoNodePositions);
              }
              showToast(`Proyek IPO Chart "${remoteData.name}" berhasil dimuat dari cloud!`, 'success');
            } else {
              setActiveMode('flowchart');
              setProjectName(remoteData.name);
              if (remoteData.code) {
                setCode(remoteData.code);
              }
              setDirection(remoteData.direction || 'TB');
              if (remoteData.density) setDensity(remoteData.density);
              if (remoteData.edgeStyle) setEdgeStyle(remoteData.edgeStyle);
              if (remoteData.nodePositions) setCustomNodePositions(remoteData.nodePositions);
              showToast(`Proyek Flowchart "${remoteData.name}" berhasil dimuat dari cloud!`, 'success');
            }

            if (window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            showToast('Proyek yang dibagikan tidak ditemukan atau telah kedaluwarsa.', 'error');
          }
        } catch (err) {
          console.error('Error fetching shared project from cloud:', err);
          showToast('Gagal memuat proyek bersama dari cloud.', 'error');
        } finally {
          setIsLoadingShared(false);
        }
      }
    };

    handleUrlProject();
  }, []);

  // Autosave Flowchart
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSave({
        name: projectName,
        code,
        direction,
        density,
        edgeStyle,
        nodePositions: customNodePositions || previewRef.current?.getNodePositions(),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [code, projectName, direction, density, edgeStyle, customNodePositions]);

  // Autosave Structure Chart
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'structure_chart_studio_autosave',
          JSON.stringify({
            name: structureProjectName,
            code: structureCode,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error('Failed to autosave structure chart:', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [structureCode, structureProjectName]);

  // Autosave IPO Chart (including customNodePositions!)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'ipo_chart_studio_autosave',
          JSON.stringify({
            projectName: ipoProjectName,
            functions: ipoFunctions,
            connections: ipoConnections,
            ipoNodePositions,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error('Failed to autosave IPO chart:', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ipoProjectName, ipoFunctions, ipoConnections, ipoNodePositions]);

  // Debounce Flowchart parser
  const [debouncedCode, setDebouncedCode] = useState(code);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 200);
    return () => clearTimeout(timer);
  }, [code]);

  const { nodes, edges, errors } = useMemo(() => {
    return parsePseudocode(debouncedCode);
  }, [debouncedCode]);

  // Debounce Structure Chart parser
  const [debouncedStructureCode, setDebouncedStructureCode] = useState(structureCode);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStructureCode(structureCode);
    }, 200);
    return () => clearTimeout(timer);
  }, [structureCode]);

  const { nodes: structureNodes, edges: structureEdges, errors: structureErrors } = useMemo(() => {
    return parseStructureChart(debouncedStructureCode);
  }, [debouncedStructureCode]);

  // Handlers for snippet insertion & templates
  const handleInsertSnippet = (snippet: string) => {
    if (editorRef.current) {
      editorRef.current.insertSnippet(snippet);
    } else {
      setCode((prev) => prev + '\n' + snippet);
    }
  };

  const handleInsertStructureSnippet = (snippet: string) => {
    if (structureEditorRef.current) {
      structureEditorRef.current.insertSnippet(snippet);
    } else {
      setStructureCode((prev) => prev + '\n' + snippet);
    }
  };

  const handleSelectTemplate = (templateCode: string) => {
    setCode(templateCode);
    setCustomNodePositions(null);
  };

  const handleSelectStructureTemplate = (templateCode: string) => {
    setStructureCode(templateCode);
  };

  const handleSelectIpoTemplate = (templateId: string) => {
    const tpl = IPO_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setIpoProjectName(tpl.data.projectName);
      setIpoFunctions(tpl.data.functions);
      setIpoConnections(tpl.data.connections);
      setIpoNodePositions(null);
      showToast(`Template "${tpl.title}" berhasil dimuat!`, 'success');
    }
  };

  const handleResetDefault = () => {
    setCode(FLOWCHART_TEMPLATES[0].code);
    setProjectName('Hitung Luas Persegi Panjang');
    setCustomNodePositions(null);
  };

  const handleResetStructureDefault = () => {
    setStructureCode(STRUCTURE_TEMPLATES[0].code);
    setStructureProjectName('Record Order System (BINUS)');
  };

  const handleResetIpoBlank = () => {
    setIpoProjectName('Functional Design Baru');
    setIpoFunctions([]);
    setIpoConnections([]);
    setIpoNodePositions(null);
    showToast('Proyek IPO berhasil di-reset ke kanvas kosong.', 'info');
  };

  const handleNodeSelectFlowchart = useCallback((lineNumber: number) => {
    editorRef.current?.highlightLine(lineNumber);
  }, []);

  const handleNodeSelectStructure = useCallback((lineNumber: number) => {
    structureEditorRef.current?.highlightLine(lineNumber);
  }, []);

  // Direction toggle
  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'TB' ? 'LR' : 'TB'));
  };

  // Export as PNG via preview ref
  const handleExportPNG = async () => {
    if (activeMode === 'flowchart') {
      if (previewRef.current) {
        await previewRef.current.exportImage('png', projectName);
        showToast('Berhasil mengekspor Flowchart PNG!', 'success');
      }
    } else if (activeMode === 'structure') {
      if (structurePreviewRef.current) {
        await structurePreviewRef.current.exportImage('png', structureProjectName);
        showToast('Berhasil mengekspor Structure Chart PNG!', 'success');
      }
    } else {
      if (ipoPreviewRef.current) {
        await ipoPreviewRef.current.exportAllCharts(`${ipoProjectName.toLowerCase().replace(/\s+/g, '_')}_ipo_charts`);
        showToast('Berhasil mengekspor IPO Charts PNG!', 'success');
      }
    }
  };

  // Export JSON file (Universal for all modes)
  const handleExportJSON = () => {
    if (activeMode === 'flowchart') {
      const livePositions = previewRef.current?.getNodePositions() || customNodePositions || {};
      exportProjectToJSON({
        mode: 'flowchart',
        name: projectName,
        code,
        direction,
        density,
        edgeStyle,
        nodePositions: livePositions,
      });
    } else if (activeMode === 'structure') {
      exportProjectToJSON({
        mode: 'structure',
        name: structureProjectName,
        structureCode,
      });
    } else {
      exportProjectToJSON({
        mode: 'ipo',
        name: ipoProjectName,
        functions: ipoFunctions,
        connections: ipoConnections,
        ipoNodePositions,
      });
    }
  };

  // Load project from storage or JSON import (Universal for all modes)
  const handleLoadUniversalProject = (p: UniversalShareData) => {
    if (p.mode === 'structure') {
      setActiveMode('structure');
      setStructureProjectName(p.name);
      if (p.structureCode) setStructureCode(p.structureCode);
      else if (p.code) setStructureCode(p.code);
      showToast(`Proyek Structure Chart "${p.name}" berhasil dimuat!`, 'success');
    } else if (p.mode === 'ipo') {
      setActiveMode('ipo');
      setIpoProjectName(p.name);
      if (p.functions) setIpoFunctions(p.functions);
      if (p.connections) setIpoConnections(p.connections);
      if (p.ipoNodePositions) setIpoNodePositions(p.ipoNodePositions);
      showToast(`Proyek IPO Chart "${p.name}" berhasil dimuat!`, 'success');
    } else {
      setActiveMode('flowchart');
      setProjectName(p.name);
      if (p.code) setCode(p.code);
      if (p.direction) setDirection(p.direction);
      if (p.density) setDensity(p.density);
      if (p.edgeStyle) setEdgeStyle(p.edgeStyle);
      if (p.nodePositions) setCustomNodePositions(p.nodePositions);
      showToast(`Proyek Flowchart "${p.name}" berhasil dimuat!`, 'success');
    }
    setIsProjectModalOpen(false);
  };

  // Universal Share project handler (Flowchart, Structure Chart, or IPO Chart!)
  const handleShareProject = async () => {
    setIsSharing(true);
    try {
      let sharePayload;
      if (activeMode === 'structure') {
        sharePayload = {
          mode: 'structure' as const,
          name: structureProjectName,
          structureCode,
        };
      } else if (activeMode === 'ipo') {
        sharePayload = {
          mode: 'ipo' as const,
          name: ipoProjectName,
          functions: ipoFunctions,
          connections: ipoConnections,
          ipoNodePositions: ipoNodePositions || undefined,
        };
      } else {
        const livePositions = previewRef.current?.getNodePositions() || customNodePositions || {};
        sharePayload = {
          mode: 'flowchart' as const,
          name: projectName,
          code,
          direction,
          density,
          edgeStyle,
          nodePositions: livePositions,
        };
      }

      const { id, url } = await createCloudShare(sharePayload);

      setShareData({
        isOpen: true,
        shareUrl: url,
        projectId: id,
        projectName:
          activeMode === 'structure'
            ? structureProjectName
            : activeMode === 'ipo'
            ? ipoProjectName
            : projectName,
      });
      showToast('Tautan berbagi berhasil dibuat!', 'success');
    } catch (err: unknown) {
      console.error('Failed to create cloud share:', err);
      showToast('Gagal membagikan ke cloud. Pastikan internet aktif.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUpdateIpoConnection = useCallback(
    (connId: string, updates: Partial<IpoConnection>) => {
      setIpoConnections((prev) =>
        prev.map((c) => (c.id === connId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const handleDeleteIpoConnection = useCallback((connId: string) => {
    setIpoConnections((prev) => prev.filter((c) => c.id !== connId));
  }, []);

  if (currentRoute === 'admin') {
    return (
      <AdminPage
        onBackToStudio={handleNavigateToStudio}
        onLoadProject={handleLoadProjectFromAdmin}
      />
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100">
      {/* Top Navigation Bar with Mode Switcher */}
      <Header
        activeMode={activeMode}
        onChangeMode={setActiveMode}
        projectName={
          activeMode === 'flowchart'
            ? projectName
            : activeMode === 'structure'
            ? structureProjectName
            : ipoProjectName
        }
        onSetProjectName={(name) => {
          if (activeMode === 'flowchart') setProjectName(name);
          else if (activeMode === 'structure') setStructureProjectName(name);
          else setIpoProjectName(name);
        }}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        direction={direction}
        onToggleDirection={handleToggleDirection}
        onSelectTemplate={
          activeMode === 'flowchart'
            ? handleSelectTemplate
            : handleSelectStructureTemplate
        }
        onSelectIpoTemplate={handleSelectIpoTemplate}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onOpenHelp={() => setIsTutorialOpenOverride(true)}
        isFullscreenFlowchart={isFullscreenFlowchart}
        onToggleFullscreen={handleToggleFullscreen}
        onShareProject={handleShareProject}
        isSharing={isSharing}
        highlightExport={tutorialTourStep === 3}
      />

      {/* Main Content: Split Screen Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT SECTION: Builder / Code Editor (40%) - Hidden when Fullscreen */}
        {!isFullscreenFlowchart && (
          <section
            className={`w-full md:w-[40%] h-1/2 md:h-full flex flex-col min-h-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 shrink-0 transition-all ${
              tutorialTourStep === 0 ? 'ring-4 ring-indigo-400 ring-inset shadow-xl' : ''
            }`}
          >
            {activeMode === 'flowchart' ? (
              <>
                {/* Flowchart Elements Toolbar */}
                <div className={tutorialTourStep === 1 ? 'ring-2 ring-indigo-500 rounded-lg animate-pulse' : ''}>
                  <PresetToolbar onInsertSnippet={handleInsertSnippet} />
                </div>

                {/* Flowchart Pseudocode Editor */}
                <PseudocodeEditor
                  ref={editorRef}
                  value={code}
                  onChange={setCode}
                  errors={errors}
                  onResetDefault={handleResetDefault}
                />
              </>
            ) : activeMode === 'structure' ? (
              <>
                {/* Structure Chart Notations Toolbar */}
                <div className={tutorialTourStep === 1 ? 'ring-2 ring-indigo-500 rounded-lg animate-pulse' : ''}>
                  <StructurePresetToolbar onInsertSnippet={handleInsertStructureSnippet} />
                </div>

                {/* Structure Chart Hierarchy Editor */}
                <PseudocodeEditor
                  ref={structureEditorRef}
                  value={structureCode}
                  onChange={setStructureCode}
                  errors={structureErrors}
                  onResetDefault={handleResetStructureDefault}
                />
              </>
            ) : (
              /* IPO Chart Builder */
              <div className={`h-full flex flex-col min-h-0 ${tutorialTourStep === 1 ? 'ring-2 ring-indigo-500 rounded-lg animate-pulse' : ''}`}>
                <IpoEditor
                  functions={ipoFunctions}
                  connections={ipoConnections}
                  onChangeFunctions={setIpoFunctions}
                  onChangeConnections={setIpoConnections}
                  onLoadTemplate={handleSelectIpoTemplate}
                  onResetBlank={handleResetIpoBlank}
                />
              </div>
            )}
          </section>
        )}

        {/* RIGHT SECTION: Canvas Preview (60% or 100% when Fullscreen) */}
        <section
          className={`flex-1 w-full h-full relative flex flex-col min-h-0 min-w-0 transition-all ${
            tutorialTourStep === 2 ? 'ring-4 ring-indigo-400 ring-inset shadow-xl' : ''
          }`}
        >
          {activeMode === 'flowchart' ? (
            <FlowchartPreview
              ref={previewRef}
              rawNodes={nodes}
              rawEdges={edges}
              direction={direction}
              density={density}
              onChangeDensity={setDensity}
              edgeStyle={edgeStyle}
              onChangeEdgeStyle={setEdgeStyle}
              isFullscreen={isFullscreenFlowchart}
              onToggleFullscreen={handleToggleFullscreen}
              customNodePositions={customNodePositions}
              onPositionsChange={setCustomNodePositions}
              onNodeSelect={handleNodeSelectFlowchart}
            />
          ) : activeMode === 'structure' ? (
            <StructureChartPreview
              ref={structurePreviewRef}
              rawNodes={structureNodes}
              rawEdges={structureEdges}
              isFullscreen={isFullscreenFlowchart}
              onToggleFullscreen={handleToggleFullscreen}
              onNodeSelect={handleNodeSelectStructure}
            />
          ) : (
            <IpoPreview
              ref={ipoPreviewRef}
              functions={ipoFunctions}
              connections={ipoConnections}
              projectName={ipoProjectName}
              customNodePositions={ipoNodePositions}
              onPositionsChange={setIpoNodePositions}
              onUpdateConnection={handleUpdateIpoConnection}
              onDeleteConnection={handleDeleteIpoConnection}
              isFullscreen={isFullscreenFlowchart}
              onToggleFullscreen={handleToggleFullscreen}
            />
          )}
        </section>
      </div>

      {/* Project Management & JSON Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        activeMode={activeMode}
        projectName={
          activeMode === 'structure'
            ? structureProjectName
            : activeMode === 'ipo'
            ? ipoProjectName
            : projectName
        }
        onSetProjectName={(name) => {
          if (activeMode === 'structure') setStructureProjectName(name);
          else if (activeMode === 'ipo') setIpoProjectName(name);
          else setProjectName(name);
        }}
        currentCode={code}
        direction={direction}
        density={density}
        edgeStyle={edgeStyle}
        nodePositions={customNodePositions || previewRef.current?.getNodePositions() || {}}
        structureCode={structureCode}
        ipoFunctions={ipoFunctions}
        ipoConnections={ipoConnections}
        ipoNodePositions={ipoNodePositions}
        onLoadUniversalProject={handleLoadUniversalProject}
      />

      {/* Universal Share Modal (Flowchart, Structure Chart, or IPO Chart) */}
      <ShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData((prev) => ({ ...prev, isOpen: false }))}
        shareUrl={shareData.shareUrl}
        projectId={shareData.projectId}
        projectName={shareData.projectName}
        mode={activeMode}
      />

      {/* Task-Based Interactive Tutorial per Menu & Cheatsheet */}
      <InteractiveTutorial
        activeMode={activeMode}
        isOpenOverride={isTutorialOpenOverride}
        onCloseOverride={() => setIsTutorialOpenOverride(false)}
        onShowToast={showToast}
        onStepChange={setTutorialTourStep}
      />

      {/* Loading Shared Project Overlay */}
      {isLoadingShared && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-4 shadow-xl border border-slate-200 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-700">
              Memuat proyek dari cloud...
            </span>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Loader2 className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
