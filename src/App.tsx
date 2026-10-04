import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { PresetToolbar } from './components/PresetToolbar';
import { StructurePresetToolbar } from './components/StructurePresetToolbar';
import { PseudocodeEditor, type PseudocodeEditorRef } from './components/PseudocodeEditor';
import { FlowchartPreview, type FlowchartPreviewRef } from './components/FlowchartPreview';
import { StructureChartPreview, type StructureChartPreviewRef } from './components/StructureChartPreview';
import { HelpModal } from './components/HelpModal';
import { ProjectModal } from './components/ProjectModal';
import { ShareModal } from './components/ShareModal';
import { parsePseudocode } from './utils/parser';
import { parseStructureChart } from './utils/structureParser';
import { FLOWCHART_TEMPLATES } from './utils/templates';
import { STRUCTURE_TEMPLATES } from './utils/structureTemplates';
import { type FlowDensity, type FlowEdgeStyle } from './utils/layout';
import {
  getAutoSave,
  setAutoSave,
  exportProjectToJSON,
  createCloudShare,
  fetchSharedProject,
} from './utils/storage';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function App() {
  const [activeMode, setActiveMode] = useState<'flowchart' | 'structure'>('flowchart');

  // --- FLOWCHART MODE STATE ---
  const autoSaved = useMemo(() => getAutoSave(), []);

  const [projectName, setProjectName] = useState<string>(
    autoSaved?.name || 'Hitung Luas Persegi Panjang'
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
    autoSavedStructure?.name || 'Record Order System (BINUS)'
  );
  const [structureCode, setStructureCode] = useState<string>(
    autoSavedStructure?.code || STRUCTURE_TEMPLATES[0].code
  );

  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isFullscreenFlowchart, setIsFullscreenFlowchart] = useState<boolean>(false);

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

  const editorRef = useRef<PseudocodeEditorRef>(null);
  const previewRef = useRef<FlowchartPreviewRef>(null);

  const handleToggleFullscreen = () => {
    setIsFullscreenFlowchart((prev) => !prev);
  };

  // Check URL parameter for shared project on mount (?p=<id> or ?project=<id> or #/p/<id> or /p/<id>)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pathMatch = window.location.pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
    const sharedId =
      searchParams.get('p') ||
      searchParams.get('project') ||
      (window.location.hash.startsWith('#/p/') ? window.location.hash.replace('#/p/', '') : null) ||
      (pathMatch ? pathMatch[1] : null);

    if (sharedId) {
      setIsLoadingShared(true);
      fetchSharedProject(sharedId)
        .then((data) => {
          if (data) {
            setProjectName(data.name);
            setCode(data.code);
            setDirection(data.direction);
            if (data.density) setDensity(data.density);
            if (data.edgeStyle) setEdgeStyle(data.edgeStyle);
            if (data.nodePositions && Object.keys(data.nodePositions).length > 0) {
              setCustomNodePositions(data.nodePositions);
            }
            showToast(`Memuat proyek bersama & tata letak: "${data.name}"`, 'success');
          } else {
            showToast(`Proyek dengan kode "${sharedId}" tidak ditemukan atau tautan telah kedaluwarsa.`, 'error');
          }
        })
        .catch((err) => {
          console.error(err);
          showToast('Gagal memuat proyek dari tautan bersama.', 'error');
        })
        .finally(() => {
          setIsLoadingShared(false);
        });
    }
  }, []);

  // Auto-save whenever code, name, direction, density, edgeStyle, or nodePositions change
  useEffect(() => {
    setAutoSave({
      code,
      name: projectName,
      direction,
      density,
      edgeStyle,
      nodePositions: customNodePositions || undefined,
    });
  }, [code, projectName, direction, density, edgeStyle, customNodePositions]);

  // Debounced parsing for fluid editing
  const [debouncedCode, setDebouncedCode] = useState<string>(code);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 200);
    return () => clearTimeout(timer);
  }, [code]);

  // Parse pseudocode into graph nodes and edges
  const { nodes, edges, errors } = useMemo(() => {
    return parsePseudocode(debouncedCode);
  }, [debouncedCode]);

  // Preset button insertion handler
  const handleInsertSnippet = (snippet: string) => {
    if (editorRef.current) {
      editorRef.current.insertSnippet(snippet);
    } else {
      setCode((prev) => prev + '\n' + snippet);
    }
  };

  // Template selector
  const handleSelectTemplate = (templateCode: string) => {
    setCode(templateCode);
  };

  // Reset to default
  const handleResetDefault = () => {
    setCode(FLOWCHART_TEMPLATES[0].code);
    setProjectName('Hitung Luas Persegi Panjang');
  };

  // Auto-save Structure Chart
  useEffect(() => {
    try {
      localStorage.setItem(
        'structure_chart_studio_autosave',
        JSON.stringify({
          code: structureCode,
          name: structureProjectName,
        })
      );
    } catch {}
  }, [structureCode, structureProjectName]);

  // Debounced parsing for Structure Chart
  const [debouncedStructureCode, setDebouncedStructureCode] = useState<string>(structureCode);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStructureCode(structureCode);
    }, 200);
    return () => clearTimeout(timer);
  }, [structureCode]);

  const { nodes: structureNodes, edges: structureEdges, errors: structureErrors } = useMemo(() => {
    return parseStructureChart(debouncedStructureCode);
  }, [debouncedStructureCode]);

  const structureEditorRef = useRef<PseudocodeEditorRef>(null);
  const structurePreviewRef = useRef<StructureChartPreviewRef>(null);

  const handleInsertStructureSnippet = (snippet: string) => {
    if (structureEditorRef.current) {
      structureEditorRef.current.insertSnippet(snippet);
    } else {
      setStructureCode((prev) => prev + '\n' + snippet);
    }
  };

  const handleSelectStructureTemplate = (templateCode: string) => {
    setStructureCode(templateCode);
  };

  const handleResetStructureDefault = () => {
    setStructureCode(STRUCTURE_TEMPLATES[0].code);
    setStructureProjectName('Record Order System (BINUS)');
  };

  const handleNodeSelectFlowchart = useCallback((lineNumber: number) => {
    editorRef.current?.highlightLine(lineNumber);
  }, []);

  const handleNodeSelectStructure = useCallback((lineNumber: number) => {
    structureEditorRef.current?.highlightLine(lineNumber);
  }, []);

  // Direction toggle (TB vs LR)
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
    } else {
      if (structurePreviewRef.current) {
        await structurePreviewRef.current.exportImage('png', structureProjectName);
        showToast('Berhasil mengekspor Structure Chart PNG!', 'success');
      }
    }
  };

  // Export JSON file
  const handleExportJSON = () => {
    if (activeMode === 'flowchart') {
      const livePositions = previewRef.current?.getNodePositions() || customNodePositions || {};
      exportProjectToJSON({
        name: projectName,
        code,
        direction,
        density,
        edgeStyle,
        nodePositions: livePositions,
      });
    } else {
      const dataStr = JSON.stringify(
        {
          appName: 'Structure Chart Studio',
          version: '1.0.0',
          projectName: structureProjectName,
          code: structureCode,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      );
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${structureProjectName.toLowerCase().replace(/\s+/g, '_')}_structure.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Load project from storage or JSON import
  const handleLoadProject = (p: {
    name: string;
    code: string;
    direction: 'TB' | 'LR';
    density?: FlowDensity;
    edgeStyle?: FlowEdgeStyle;
    nodePositions?: Record<string, { x: number; y: number }>;
  }) => {
    setProjectName(p.name);
    setCode(p.code);
    setDirection(p.direction);
    if (p.density) setDensity(p.density);
    if (p.edgeStyle) setEdgeStyle(p.edgeStyle);
    if (p.nodePositions) {
      setCustomNodePositions(p.nodePositions);
    }
  };

  // Create public cloud share link
  const handleShareProject = async () => {
    setIsSharing(true);
    try {
      const livePositions = previewRef.current?.getNodePositions() || customNodePositions || {};
      const result = await createCloudShare({
        name: projectName,
        code,
        direction,
        density,
        edgeStyle,
        nodePositions: livePositions,
      });

      // Update browser URL query without reload
      const newUrl = `${window.location.origin}${window.location.pathname}?p=${result.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      // Also copy directly to clipboard
      try {
        await navigator.clipboard.writeText(newUrl);
        showToast(`Tautan & tata letak berhasil disimpan ke cloud! Kode: ${result.id}`, 'success');
      } catch {
        showToast(`Tautan berhasil dibuat! Kode: ${result.id}`, 'success');
      }

      setShareData({
        isOpen: true,
        shareUrl: newUrl,
        projectId: result.id,
        projectName,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server sibuk';
      showToast('Gagal membagikan: ' + message, 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100">
      {/* Top Navigation Bar with Mode Switcher */}
      <Header
        activeMode={activeMode}
        onChangeMode={setActiveMode}
        projectName={activeMode === 'flowchart' ? projectName : structureProjectName}
        onSetProjectName={activeMode === 'flowchart' ? setProjectName : setStructureProjectName}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        direction={direction}
        onToggleDirection={handleToggleDirection}
        onSelectTemplate={activeMode === 'flowchart' ? handleSelectTemplate : handleSelectStructureTemplate}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onOpenHelp={() => setIsHelpOpen(true)}
        isFullscreenFlowchart={isFullscreenFlowchart}
        onToggleFullscreen={handleToggleFullscreen}
        onShareProject={activeMode === 'flowchart' ? handleShareProject : undefined}
        isSharing={isSharing}
      />

      {/* Main Content: Split Screen Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT SECTION: Preset Toolbar & Code Editor (40%) - Hidden when Fullscreen */}
        {!isFullscreenFlowchart && (
          <section className="w-full md:w-[40%] h-1/2 md:h-full flex flex-col min-h-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
            {activeMode === 'flowchart' ? (
              <>
                {/* Flowchart Elements Toolbar */}
                <PresetToolbar onInsertSnippet={handleInsertSnippet} />

                {/* Flowchart Pseudocode Editor */}
                <PseudocodeEditor
                  ref={editorRef}
                  value={code}
                  onChange={setCode}
                  errors={errors}
                  onResetDefault={handleResetDefault}
                />
              </>
            ) : (
              <>
                {/* Structure Chart Notations Toolbar */}
                <StructurePresetToolbar onInsertSnippet={handleInsertStructureSnippet} />

                {/* Structure Chart Hierarchy Editor */}
                <PseudocodeEditor
                  ref={structureEditorRef}
                  value={structureCode}
                  onChange={setStructureCode}
                  errors={structureErrors}
                  onResetDefault={handleResetStructureDefault}
                />
              </>
            )}
          </section>
        )}

        {/* RIGHT SECTION: Canvas Preview (60% or 100% when Fullscreen) */}
        <section className="flex-1 w-full h-full relative flex flex-col min-h-0 min-w-0">
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
          ) : (
            <StructureChartPreview
              ref={structurePreviewRef}
              rawNodes={structureNodes}
              rawEdges={structureEdges}
              isFullscreen={isFullscreenFlowchart}
              onToggleFullscreen={handleToggleFullscreen}
              onNodeSelect={handleNodeSelectStructure}
            />
          )}
        </section>
      </div>

      {/* Project Management & JSON Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentCode={code}
        projectName={projectName}
        onSetProjectName={setProjectName}
        direction={direction}
        density={density}
        edgeStyle={edgeStyle}
        nodePositions={customNodePositions || previewRef.current?.getNodePositions() || {}}
        onLoadProject={handleLoadProject}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData((prev) => ({ ...prev, isOpen: false }))}
        shareUrl={shareData.shareUrl}
        projectId={shareData.projectId}
        projectName={shareData.projectName}
      />

      {/* Help & Documentation Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        initialTab={activeMode}
      />

      {/* Loading Shared Project Overlay */}
      {isLoadingShared && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-4 shadow-xl border border-slate-200 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-700">
              Memuat diagram flowchart dari tautan bersama...
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
