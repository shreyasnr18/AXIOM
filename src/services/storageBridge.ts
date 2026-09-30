/**
 * Project Axiom — Storage Bridge
 * Seamlessly interfaces with Tauri native Rust IPC commands or falls back to browser storage
 */

import { DEFAULT_WORKSPACE_AXIOM, WorkspaceAxiom } from '../types/schema';

const STORAGE_KEY = 'axiom_workspace_blueprint';
const DEFAULT_WORKSPACE_PATH = 'workspace/workspace.axiom';

export interface StorageStatus {
  isTauri: boolean;
  activePath: string;
  storageBackend: 'Tauri Native Rust Core (ZTA Sandbox)' | 'Local-First Edge Browser Storage';
}

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const isTauri = isTauriEnvironment();
  return {
    isTauri,
    activePath: DEFAULT_WORKSPACE_PATH,
    storageBackend: isTauri 
      ? 'Tauri Native Rust Core (ZTA Sandbox)' 
      : 'Local-First Edge Browser Storage',
  };
}

export async function readWorkspaceFile(filePath: string = DEFAULT_WORKSPACE_PATH): Promise<WorkspaceAxiom> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const content = await invoke<string>('load_workspace_blueprint', { filePath });
      return JSON.parse(content) as WorkspaceAxiom;
    } catch (err) {
      console.warn('[StorageBridge] Tauri native read failed or file pending, using default:', err);
    }
  }

  // Fallback to browser local persistence or initial template
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData) as WorkspaceAxiom;
      if (!parsed.workflowCanvas || !parsed.workflowCanvas.nodes || parsed.workflowCanvas.nodes.length === 0) {
        parsed.workflowCanvas = DEFAULT_WORKSPACE_AXIOM.workflowCanvas;
      }
      return parsed;
    } catch (e) {
      console.error('[StorageBridge] Failed to parse local cached blueprint, falling back to default:', e);
    }
  }

  return DEFAULT_WORKSPACE_AXIOM;
}

export async function writeWorkspaceFile(
  blueprint: WorkspaceAxiom, 
  filePath: string = DEFAULT_WORKSPACE_PATH
): Promise<{ success: boolean; error?: string }> {
  const serialized = JSON.stringify(blueprint, null, 2);

  // Always mirror in localStorage for fail-safe resilience
  localStorage.setItem(STORAGE_KEY, serialized);

  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_workspace_blueprint', { filePath, content: serialized });
      return { success: true };
    } catch (err: any) {
      console.error('[StorageBridge] Tauri save command error:', err);
      return { success: false, error: err?.toString() || 'Unknown IPC save error' };
    }
  }

  return { success: true };
}
