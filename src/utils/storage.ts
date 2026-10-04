import type { FlowDensity, FlowEdgeStyle } from './layout';
import type { IpoFunction, IpoConnection } from '../types/ipoChart';

export type AppMode = 'flowchart' | 'structure' | 'ipo';

export interface SavedProject {
  id: string;
  name: string;
  mode?: AppMode;
  // Flowchart
  code?: string;
  direction?: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
  // Structure Chart
  structureCode?: string;
  // IPO Chart
  functions?: IpoFunction[];
  connections?: IpoConnection[];
  ipoNodePositions?: Record<string, { x: number; y: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface UniversalShareData {
  mode?: AppMode;
  name: string;
  // Flowchart data
  code?: string;
  direction?: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
  // Structure Chart data
  structureCode?: string;
  // IPO Chart data
  functions?: IpoFunction[];
  connections?: IpoConnection[];
  ipoNodePositions?: Record<string, { x: number; y: number }>;
}

export interface ShareHistoryItem {
  id: string;
  url: string;
  projectName: string;
  mode: AppMode;
  createdAt: string;
}

const FLOWCHART_STORAGE_KEY = 'flowchart_studio_projects';
const STRUCTURE_STORAGE_KEY = 'structure_chart_studio_projects';
const IPO_STORAGE_KEY = 'ipo_chart_studio_projects';

const AUTOSAVE_KEY = 'flowchart_studio_autosave';
const SHARE_HISTORY_KEY = 'program_design_share_history';

export function getStorageKeyForMode(mode: AppMode = 'flowchart'): string {
  if (mode === 'ipo') return IPO_STORAGE_KEY;
  if (mode === 'structure') return STRUCTURE_STORAGE_KEY;
  return FLOWCHART_STORAGE_KEY;
}

export function getSavedProjects(mode: AppMode = 'flowchart'): SavedProject[] {
  try {
    const raw = localStorage.getItem(getStorageKeyForMode(mode));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load saved projects for ${mode} from localStorage:`, err);
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
  nodePositions?: Record<string, { x: number; y: number }>,
  mode: AppMode = 'flowchart',
  extra?: {
    structureCode?: string;
    functions?: IpoFunction[];
    connections?: IpoConnection[];
    ipoNodePositions?: Record<string, { x: number; y: number }>;
  }
): SavedProject {
  const projects = getSavedProjects(mode);
  const now = new Date().toISOString();

  let targetId = id;
  if (!targetId) {
    targetId = `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }

  const existingIdx = projects.findIndex((p) => p.id === targetId);

  const fallbackName =
    mode === 'ipo'
      ? 'Project IPO Baru'
      : mode === 'structure'
      ? 'Project Structure Baru'
      : 'Project Flowchart Baru';

  const updatedItem: SavedProject = {
    id: targetId,
    mode,
    name: name.trim() || fallbackName,
    code,
    direction,
    density: density || 'compact',
    edgeStyle: edgeStyle || 'step',
    nodePositions,
    structureCode: extra?.structureCode,
    functions: extra?.functions,
    connections: extra?.connections,
    ipoNodePositions: extra?.ipoNodePositions,
    createdAt: existingIdx >= 0 ? projects[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    projects[existingIdx] = updatedItem;
  } else {
    projects.unshift(updatedItem);
  }

  try {
    localStorage.setItem(getStorageKeyForMode(mode), JSON.stringify(projects));
  } catch (err) {
    console.error(`Failed to save project for ${mode} to localStorage:`, err);
  }

  return updatedItem;
}

export function deleteProject(id: string, mode: AppMode = 'flowchart'): SavedProject[] {
  const projects = getSavedProjects(mode).filter((p) => p.id !== id);
  try {
    localStorage.setItem(getStorageKeyForMode(mode), JSON.stringify(projects));
  } catch (err) {
    console.error(`Failed to delete project for ${mode} from localStorage:`, err);
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

export function getShareHistory(): ShareHistoryItem[] {
  try {
    const raw = localStorage.getItem(SHARE_HISTORY_KEY);
    if (!raw) {
      const initialSeed: ShareHistoryItem[] = [
        {
          id: 'BY69FXN3Y',
          url: `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?p=BY69FXN3Y`,
          projectName: 'Hotel Room Booking & Billing System',
          mode: 'ipo',
          createdAt: '2026-10-04T09:11:37.000Z',
        },
        {
          id: '6VYGTRSTQ',
          url: `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?p=6VYGTRSTQ`,
          projectName: 'Sistem Manajemen Logistik & Pengiriman',
          mode: 'structure',
          createdAt: '2026-10-04T09:11:15.000Z',
        },
        {
          id: 'AAFZ4TGQT',
          url: `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?p=AAFZ4TGQT`,
          projectName: 'Autentikasi Pengguna & OTP',
          mode: 'flowchart',
          createdAt: '2026-10-04T09:10:56.000Z',
        },
      ];
      try {
        localStorage.setItem(SHARE_HISTORY_KEY, JSON.stringify(initialSeed));
      } catch {}
      return initialSeed;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load share history from localStorage:', err);
    return [];
  }
}

import { saveShareToFirebase, deleteShareFromFirebase } from './firebase';

export function saveShareHistoryItem(item: ShareHistoryItem): ShareHistoryItem[] {
  const history = getShareHistory();
  const filtered = history.filter((h) => h.id !== item.id);
  const updated = [item, ...filtered];
  try {
    localStorage.setItem(SHARE_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save share history item:', err);
  }
  // Sync to Firebase in background
  try {
    saveShareToFirebase(item);
  } catch (err) {
    console.warn('Firebase sync warning:', err);
  }
  return updated;
}

export function deleteShareHistoryItem(id: string): ShareHistoryItem[] {
  const history = getShareHistory().filter((h) => h.id !== id);
  try {
    localStorage.setItem(SHARE_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to delete share history item:', err);
  }
  // Delete from Firebase in background
  try {
    deleteShareFromFirebase(id);
  } catch (err) {
    console.warn('Firebase delete warning:', err);
  }
  return history;
}

export function clearShareHistory(): void {
  try {
    localStorage.removeItem(SHARE_HISTORY_KEY);
  } catch {}
}

/**
 * Creates a public unique share link using cloud storage,
 * supporting Flowchart, Structure Chart, and IPO Chart!
 */
export async function createCloudShare(
  project: UniversalShareData
): Promise<{ id: string; url: string }> {
  const payload = JSON.stringify({
    appName: 'Program Design Studio',
    version: '2.0.0',
    mode: project.mode,
    projectName: project.name,
    code: project.code,
    direction: project.direction || 'TB',
    density: project.density || 'compact',
    edgeStyle: project.edgeStyle || 'step',
    nodePositions: project.nodePositions || {},
    structureCode: project.structureCode,
    functions: project.functions,
    connections: project.connections,
    ipoNodePositions: project.ipoNodePositions,
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

  // Cache in local projects if it was a flowchart
  if (project.mode === 'flowchart' && project.code) {
    saveProject(
      project.name,
      project.code,
      project.direction || 'TB',
      id,
      project.density,
      project.edgeStyle,
      project.nodePositions
    );
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?p=${id}`;

  // Automatically record to share history database
  saveShareHistoryItem({
    id,
    url: shareUrl,
    projectName: project.name?.trim() || 'Proyek Tanpa Nama',
    mode: project.mode || 'flowchart',
    createdAt: new Date().toISOString(),
  });

  return { id, url: shareUrl };
}

/**
 * Loads a shared project by unique ID supporting Flowchart, Structure Chart, and IPO Chart!
 */
export async function fetchSharedProject(
  id: string
): Promise<UniversalShareData | null> {
  const cleanId = id.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) return null;

  try {
    const res = await fetch(`https://dpaste.com/${cleanId}.txt`);
    if (res.ok) {
      const text = await res.text();
      const parsed = JSON.parse(text);

      if (parsed) {
        // Detect mode: 'structure' | 'ipo' | 'flowchart'
        let mode: AppMode = 'flowchart';
        if (parsed.mode === 'structure' || (!parsed.code && parsed.structureCode)) {
          mode = 'structure';
        } else if (parsed.mode === 'ipo' || Array.isArray(parsed.functions)) {
          mode = 'ipo';
        }

        const projectData: UniversalShareData = {
          mode,
          name: parsed.projectName || parsed.name || 'Proyek Bersama',
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
          structureCode: parsed.structureCode || (mode === 'structure' ? parsed.code : undefined),
          functions: parsed.functions,
          connections: parsed.connections,
          ipoNodePositions: parsed.ipoNodePositions,
        };

        // Cache in local storage if flowchart
        if (projectData.mode === 'flowchart' && projectData.code) {
          saveProject(
            projectData.name,
            projectData.code,
            projectData.direction || 'TB',
            cleanId,
            projectData.density,
            projectData.edgeStyle,
            projectData.nodePositions
          );
        }

        return projectData;
      }
    }
  } catch (err) {
    console.warn('Gagal mengambil data proyek dari cloud, mencoba cache lokal:', err);
  }

  // Fallback to local storage
  const localProjects = getSavedProjects();
  const foundLocal = localProjects.find((p) => p.id === cleanId);
  if (foundLocal) {
    return {
      mode: 'flowchart',
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

export function exportProjectToJSON(data: {
  name: string;
  mode?: AppMode;
  code?: string;
  direction?: 'TB' | 'LR';
  density?: FlowDensity;
  edgeStyle?: FlowEdgeStyle;
  nodePositions?: Record<string, { x: number; y: number }>;
  structureCode?: string;
  functions?: IpoFunction[];
  connections?: IpoConnection[];
  ipoNodePositions?: Record<string, { x: number; y: number }> | null;
}) {
  const currentMode = data.mode || 'flowchart';

  let payload: Record<string, unknown> = {
    appName:
      currentMode === 'ipo'
        ? 'IPO Chart Studio'
        : currentMode === 'structure'
        ? 'Structure Chart Studio'
        : 'Flowchart Logic Studio',
    version: '2.0.0',
    mode: currentMode,
    projectName: data.name,
    exportedAt: new Date().toISOString(),
  };

  if (currentMode === 'flowchart') {
    payload = {
      ...payload,
      code: data.code || '',
      direction: data.direction || 'TB',
      density: data.density || 'compact',
      edgeStyle: data.edgeStyle || 'step',
      nodePositions: data.nodePositions || {},
    };
  } else if (currentMode === 'structure') {
    const structCode = data.structureCode || data.code || '';
    payload = {
      ...payload,
      code: structCode,
      structureCode: structCode,
    };
  } else if (currentMode === 'ipo') {
    payload = {
      ...payload,
      functions: data.functions || [],
      connections: data.connections || [],
      ipoNodePositions: data.ipoNodePositions || {},
    };
  }

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = data.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  a.download = `${safeName || currentMode}_${currentMode}.json`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectFromJSON(file: File): Promise<UniversalShareData> {
  return new Promise((resolve, reject) => {
    // Security check: Batasi ukuran file hingga 5 MB untuk mencegah memory exhaustion / DoS
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Ukuran file terlalu besar. Maksimum ukuran file adalah 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          reject(new Error('Format berkas JSON tidak valid atau berkas kosong.'));
          return;
        }

        const projectName =
          parsed.projectName || parsed.name || file.name.replace(/\.json$/i, '');

        // 1. Deteksi Berkas IPO Chart
        if (
          parsed.mode === 'ipo' ||
          Array.isArray(parsed.functions) ||
          (parsed.appName && String(parsed.appName).toLowerCase().includes('ipo'))
        ) {
          if (!Array.isArray(parsed.functions)) {
            reject(
              new Error('Format JSON IPO tidak valid: properti "functions" tidak ditemukan.')
            );
            return;
          }

          // Normalize functions to guarantee compatibility
          const normalizedFunctions: IpoFunction[] = parsed.functions.map(
            (fn: Record<string, unknown>, fIdx: number) => {
              const fnId = typeof fn.id === 'string' ? fn.id : `fn_${Date.now()}_${fIdx}`;
              const fnName = typeof fn.name === 'string' ? fn.name : `Fungsi ${fIdx + 1}`;

              const rawInputs = Array.isArray(fn.inputs) ? fn.inputs : [];
              const inputs = rawInputs.map((inp: unknown, iIdx: number) => {
                if (typeof inp === 'string') {
                  return { id: `in_${fnId}_${iIdx}`, name: inp };
                }
                const inpObj = inp as Record<string, unknown>;
                return {
                  id: typeof inpObj?.id === 'string' ? inpObj.id : `in_${fnId}_${iIdx}`,
                  name: String(inpObj?.name || inpObj?.label || `Input ${iIdx + 1}`),
                };
              });

              const rawProcesses = Array.isArray(fn.processes)
                ? fn.processes
                : Array.isArray(fn.process)
                ? (fn.process as unknown[])
                : [];
              const processes = rawProcesses.map((prc: unknown, pIdx: number) => {
                if (typeof prc === 'string') {
                  return { id: `prc_${fnId}_${pIdx}`, description: prc };
                }
                const prcObj = prc as Record<string, unknown>;
                return {
                  id: typeof prcObj?.id === 'string' ? prcObj.id : `prc_${fnId}_${pIdx}`,
                  description: String(
                    prcObj?.description || prcObj?.process || prcObj?.name || `Proses ${pIdx + 1}`
                  ),
                };
              });

              const rawOutputs = Array.isArray(fn.outputs) ? fn.outputs : [];
              const outputs = rawOutputs.map((out: unknown, oIdx: number) => {
                if (typeof out === 'string') {
                  return { id: `out_${fnId}_${oIdx}`, name: out };
                }
                const outObj = out as Record<string, unknown>;
                return {
                  id: typeof outObj?.id === 'string' ? outObj.id : `out_${fnId}_${oIdx}`,
                  name: String(outObj?.name || outObj?.label || `Output ${oIdx + 1}`),
                };
              });

              return {
                id: fnId,
                name: fnName,
                inputs,
                processes,
                outputs,
              };
            }
          );

          resolve({
            mode: 'ipo',
            name: projectName,
            functions: normalizedFunctions,
            connections: Array.isArray(parsed.connections) ? parsed.connections : [],
            ipoNodePositions:
              parsed.ipoNodePositions && typeof parsed.ipoNodePositions === 'object'
                ? parsed.ipoNodePositions
                : undefined,
          });
          return;
        }

        // 2. Deteksi Berkas Structure Chart
        if (
          parsed.mode === 'structure' ||
          (parsed.appName && String(parsed.appName).toLowerCase().includes('structure')) ||
          typeof parsed.structureCode === 'string'
        ) {
          const structCode = parsed.structureCode || parsed.code;
          if (typeof structCode !== 'string') {
            reject(
              new Error(
                'Format JSON Structure Chart tidak valid: properti "code" atau "structureCode" tidak ditemukan.'
              )
            );
            return;
          }
          resolve({
            mode: 'structure',
            name: projectName,
            structureCode: structCode,
            code: structCode,
          });
          return;
        }

        // 3. Deteksi Berkas Flowchart
        if (typeof parsed.code !== 'string') {
          reject(
            new Error(
              'Format berkas JSON tidak dikenali: tidak ditemukan properti "code" atau "functions".'
            )
          );
          return;
        }

        resolve({
          mode: 'flowchart',
          name: projectName,
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
        reject(new Error('Gagal membaca file JSON: format file rusak atau bukan JSON yang valid.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membuka file.'));
    reader.readAsText(file);
  });
}
