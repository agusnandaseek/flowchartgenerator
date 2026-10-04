import type { FlowDensity, FlowEdgeStyle } from './layout';

export interface SavedProject {
  id: string;
  name: string;
  code: string;
  direction: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'flowchart_studio_projects';
const AUTOSAVE_KEY = 'flowchart_studio_autosave';

export function getSavedProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved projects from localStorage:', err);
    return [];
  }
}

export function saveProject(
  name: string,
  code: string,
  direction: 'TB' | 'LR',
  id?: string,
  density?: FlowDensity,
  edgeStyle?: FlowEdgeStyle,
  nodePositions?: Record<string, { x: number; y: number }>
): SavedProject {
  const projects = getSavedProjects();
  const now = new Date().toISOString();

  let targetId = id;
  if (!targetId) {
    targetId = `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }

  const existingIdx = projects.findIndex((p) => p.id === targetId);

  const updatedItem: SavedProject = {
    id: targetId,
    name: name.trim() || 'Project Flowchart',
    code,
    direction,
    density: density || 'compact',
    edgeStyle: edgeStyle || 'step',
    nodePositions,
    createdAt: existingIdx >= 0 ? projects[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    projects[existingIdx] = updatedItem;
  } else {
    projects.unshift(updatedItem);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save project to localStorage:', err);
  }

  return updatedItem;
}

export function deleteProject(id: string): SavedProject[] {
  const projects = getSavedProjects().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to delete project from localStorage:', err);
  }
  return projects;
}

export function getAutoSave(): {
  code: string;
  name: string;
  direction: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
} | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAutoSave(data: {
  code: string;
  name: string;
  direction: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
}) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Creates a public unique share link using cloud storage,
 * saving the full layout state (pseudocode, direction, density, edgeStyle, and exact nodePositions)
 */
export async function createCloudShare(project: {
  name: string;
  code: string;
  direction?: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
}): Promise<{ id: string; url: string }> {
  const payload = JSON.stringify({
    appName: 'Pseudocode Flowchart Studio',
    version: '1.1.0',
    projectName: project.name,
    code: project.code,
    direction: project.direction || 'TB',
    density: project.density || 'compact',
    edgeStyle: project.edgeStyle || 'step',
    nodePositions: project.nodePositions || {},
    createdAt: new Date().toISOString(),
  });

  const body = new URLSearchParams();
  body.append('content', payload);
  body.append('syntax', 'json');
  body.append('expiry_days', '365');

  const res = await fetch('https://dpaste.com/api/v2/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error('Gagal menghubungi server cloud dpaste');
  }

  const dpasteUrl = await res.text();
  const id = dpasteUrl.trim().split('/').filter(Boolean).pop() || '';

  // Save also in local projects so user remembers it
  saveProject(
    project.name,
    project.code,
    project.direction || 'TB',
    id,
    project.density,
    project.edgeStyle,
    project.nodePositions
  );

  const shareUrl = `${window.location.origin}${window.location.pathname}?p=${id}`;
  return { id, url: shareUrl };
}

/**
 * Loads a shared project by unique ID (prioritizing cloud for fresh synced state,
 * with local fallback)
 */
export async function fetchSharedProject(
  id: string
): Promise<{
  name: string;
  code: string;
  direction: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
} | null> {
  const cleanId = id.trim();

  // 1. Fetch from cloud storage first to get latest synced state
  try {
    const res = await fetch(`https://dpaste.com/${cleanId}.txt`);
    if (res.ok) {
      const text = await res.text();
      const parsed = JSON.parse(text);

      if (parsed && typeof parsed.code === 'string') {
        const projectData = {
          name: parsed.projectName || 'Flowchart Bersama',
          code: parsed.code,
          direction: (parsed.direction === 'LR' ? 'LR' : 'TB') as 'TB' | 'LR',
          density: (['compact', 'normal', 'spacious'].includes(parsed.density)
            ? parsed.density
            : 'compact') as FlowDensity,
          edgeStyle: (['step', 'straight', 'smoothstep'].includes(parsed.edgeStyle)
            ? parsed.edgeStyle
            : 'step') as FlowEdgeStyle,
          nodePositions:
            parsed.nodePositions && typeof parsed.nodePositions === 'object'
              ? (parsed.nodePositions as Record<string, { x: number; y: number }>)
              : undefined,
        };

        // Cache into local storage
        saveProject(
          projectData.name,
          projectData.code,
          projectData.direction,
          cleanId,
          projectData.density,
          projectData.edgeStyle,
          projectData.nodePositions
        );

        return projectData;
      }
    }
  } catch (err) {
    console.warn('Gagal mengambil data proyek dari cloud, mencoba cache lokal:', err);
  }

  // 2. Fallback to local storage if cloud fetch failed (offline/cached)
  const localProjects = getSavedProjects();
  const foundLocal = localProjects.find((p) => p.id === cleanId);
  if (foundLocal) {
    return {
      name: foundLocal.name,
      code: foundLocal.code,
      direction: foundLocal.direction,
      density: foundLocal.density,
      edgeStyle: foundLocal.edgeStyle,
      nodePositions: foundLocal.nodePositions,
    };
  }

  return null;
}

export function exportProjectToJSON(project: {
  name: string;
  code: string;
  direction?: string;
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
}) {
  const payload = {
    appName: 'Pseudocode Flowchart Studio',
    version: '1.1.0',
    projectName: project.name,
    direction: project.direction || 'TB',
    density: project.density || 'compact',
    edgeStyle: project.edgeStyle || 'step',
    nodePositions: project.nodePositions || {},
    code: project.code,
    exportedAt: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  a.download = `${safeName || 'flowchart'}.json`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectFromJSON(
  file: File
): Promise<{
  name: string;
  code: string;
  direction: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed.code !== 'string') {
          reject(new Error('Format file JSON tidak valid. Properti "code" tidak ditemukan.'));
          return;
        }

        resolve({
          name: parsed.projectName || file.name.replace(/\.json$/i, ''),
          code: parsed.code,
          direction: parsed.direction === 'LR' ? 'LR' : 'TB',
          density: ['compact', 'normal', 'spacious'].includes(parsed.density)
            ? parsed.density
            : 'compact',
          edgeStyle: ['step', 'straight', 'smoothstep'].includes(parsed.edgeStyle)
            ? parsed.edgeStyle
            : 'step',
          nodePositions:
            parsed.nodePositions && typeof parsed.nodePositions === 'object'
              ? parsed.nodePositions
              : undefined,
        });
      } catch {
        reject(new Error('Gagal membaca file JSON: format tidak valid.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membuka file.'));
    reader.readAsText(file);
  });
}
