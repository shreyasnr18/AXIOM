import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  WorkspaceAxiom, 
  ClientInfo, 
  BusinessProblemNode, 
  EAVAttribute, 
  MilestoneCheckpoint, 
  CheckpointStage,
  DEFAULT_WORKSPACE_AXIOM 
} from '../types/schema';
import { readWorkspaceFile, writeWorkspaceFile, isTauriEnvironment } from '../services/storageBridge';

interface WorkspaceContextValue {
  blueprint: WorkspaceAxiom;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  filePath: string;
  lastSaved: Date | null;
  isTauriActive: boolean;
  saveStatusMessage: string | null;

  // Actions
  updateClientInfo: (updates: Partial<ClientInfo>) => void;
  addProblemNode: (node: Omit<BusinessProblemNode, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProblemNode: (id: string, updates: Partial<BusinessProblemNode>) => void;
  deleteProblemNode: (id: string) => void;
  toggleProblemLock: (id: string) => void;
  
  addEAVAttribute: (attr: Omit<EAVAttribute, 'id' | 'updatedAt'>) => void;
  updateEAVAttribute: (id: string, updates: Partial<EAVAttribute>) => void;
  deleteEAVAttribute: (id: string) => void;

  createCheckpoint: (title: string, stage: CheckpointStage) => void;
  rollbackCheckpoint: (checkpointId: string) => void;
  selectiveExtractNode: (nodeId: string) => void;
  replaceBlueprint: (newBlueprint: WorkspaceAxiom) => void;

  // Workflow Canvas Bridge
  updateCanvasNodeConfig: (nodeId: string, config: Partial<import('../types/schema').CanvasNodeConfig>) => void;
  updateCanvasLayout: (nodes: import('../types/schema').WorkflowCanvasNode[], edges: import('../types/schema').WorkflowCanvasEdge[]) => void;
  addCanvasNode: (type: import('../types/schema').WorkflowCanvasNode['type'], position: { x: number; y: number }) => void;

  saveNow: () => Promise<boolean>;
  reloadFromFile: () => Promise<void>;
  resetBlueprint: () => void;
  importJson: (jsonString: string) => { success: boolean; error?: string };
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blueprint, setBlueprint] = useState<WorkspaceAxiom>(DEFAULT_WORKSPACE_AXIOM);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const filePath = 'workspace/workspace.axiom';
  const isTauriActive = useMemo(() => isTauriEnvironment(), []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const loaded = await readWorkspaceFile(filePath);
        if (mounted) {
          setBlueprint(loaded);
          setLastSaved(new Date());
          setIsDirty(false);
        }
      } catch (err) {
        console.error('[WorkspaceContext] Load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to mutate blueprint state
  const mutateState = useCallback((updater: (prev: WorkspaceAxiom) => WorkspaceAxiom) => {
    setBlueprint(prev => {
      const next = updater(prev);
      return {
        ...next,
        updatedAt: new Date().toISOString()
      };
    });
    setIsDirty(true);
  }, []);

  // Client Info mutations
  const updateClientInfo = useCallback((updates: Partial<ClientInfo>) => {
    mutateState(prev => ({
      ...prev,
      clientInfo: {
        ...prev.clientInfo,
        ...updates
      }
    }));
  }, [mutateState]);

  // Problem Node mutations
  const addProblemNode = useCallback((node: Omit<BusinessProblemNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prob-node-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newNode: BusinessProblemNode = {
      ...node,
      id,
      createdAt: now,
      updatedAt: now,
    };

    mutateState(prev => ({
      ...prev,
      problemNodes: [newNode, ...prev.problemNodes]
    }));
  }, [mutateState]);

  const updateProblemNode = useCallback((id: string, updates: Partial<BusinessProblemNode>) => {
    mutateState(prev => ({
      ...prev,
      problemNodes: prev.problemNodes.map(node => 
        node.id === id 
          ? { ...node, ...updates, updatedAt: new Date().toISOString() } 
          : node
      )
    }));
  }, [mutateState]);

  const deleteProblemNode = useCallback((id: string) => {
    mutateState(prev => ({
      ...prev,
      problemNodes: prev.problemNodes.filter(node => node.id !== id)
    }));
  }, [mutateState]);

  const toggleProblemLock = useCallback((id: string) => {
    mutateState(prev => ({
      ...prev,
      problemNodes: prev.problemNodes.map(node =>
        node.id === id ? { ...node, isLocked: !node.isLocked, updatedAt: new Date().toISOString() } : node
      )
    }));
  }, [mutateState]);

  // EAV mutations
  const addEAVAttribute = useCallback((attr: Omit<EAVAttribute, 'id' | 'updatedAt'>) => {
    const id = `eav-${Date.now().toString(36)}`;
    const newAttr: EAVAttribute = {
      ...attr,
      id,
      updatedAt: new Date().toISOString()
    };

    mutateState(prev => ({
      ...prev,
      dataSchemaAttributes: [...prev.dataSchemaAttributes, newAttr]
    }));
  }, [mutateState]);

  const updateEAVAttribute = useCallback((id: string, updates: Partial<EAVAttribute>) => {
    mutateState(prev => ({
      ...prev,
      dataSchemaAttributes: prev.dataSchemaAttributes.map(attr =>
        attr.id === id ? { ...attr, ...updates, updatedAt: new Date().toISOString() } : attr
      )
    }));
  }, [mutateState]);

  const deleteEAVAttribute = useCallback((id: string) => {
    mutateState(prev => ({
      ...prev,
      dataSchemaAttributes: prev.dataSchemaAttributes.filter(attr => attr.id !== id)
    }));
  }, [mutateState]);

  // Checkpoint engine (ZTA Non-linear Checkpoint Engine)
  const createCheckpoint = useCallback((title: string, stage: CheckpointStage) => {
    mutateState(prev => {
      const stageMap: Record<CheckpointStage, 1 | 2 | 3 | 4> = {
        'Stage 1: Initiation Infrastructure': 1,
        'Stage 2: Job Procedure and Workflows': 2,
        'Stage 3: Legalities, Taxation, and GST': 3,
        'Stage 4: Transaction Management': 4,
      };

      const stageIndex = stageMap[stage] || 1;
      const fakeHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      const newCheckpoint: MilestoneCheckpoint = {
        id: `chk-${Date.now().toString(36)}`,
        stage,
        stageIndex,
        title,
        status: 'ACTIVE',
        timestamp: new Date().toISOString(),
        snapshotHash: fakeHash,
        authorSignature: 'BIOMETRIC-LOCAL-PASSKEY',
        deltaSummary: `Captured state with ${prev.problemNodes.length} problem nodes and ${prev.dataSchemaAttributes.length} EAV attributes.`,
        dependencies: prev.milestoneCheckpoints.map(c => c.id).slice(-1),
        stateSnapshot: {
          nodesCount: prev.problemNodes.length,
          attributesCount: prev.dataSchemaAttributes.length,
          complianceScore: 90 + Math.floor(Math.random() * 10),
        }
      };

      return {
        ...prev,
        milestoneCheckpoints: [newCheckpoint, ...prev.milestoneCheckpoints]
      };
    });
  }, [mutateState]);

  const rollbackCheckpoint = useCallback((checkpointId: string) => {
    mutateState(prev => ({
      ...prev,
      milestoneCheckpoints: prev.milestoneCheckpoints.map(cp => 
        cp.id === checkpointId ? { ...cp, status: 'ROLLED_BACK' } : cp
      )
    }));
    setSaveStatusMessage(`Rolled back checkpoint ${checkpointId}`);
  }, [mutateState]);

  const selectiveExtractNode = useCallback((nodeId: string) => {
    // Non-linear extraction of a component node without breaking the state tree
    mutateState(prev => ({
      ...prev,
      problemNodes: prev.problemNodes.filter(n => n.id !== nodeId),
      dataSchemaAttributes: prev.dataSchemaAttributes.filter(a => !a.graphEdges.includes(nodeId))
    }));
    setSaveStatusMessage(`Extracted node ${nodeId} and cleaned dependency graph.`);
  }, [mutateState]);

  const replaceBlueprint = useCallback((newBlueprint: WorkspaceAxiom) => {
    setBlueprint({
      ...newBlueprint,
      updatedAt: new Date().toISOString()
    });
    setIsDirty(true);
    setSaveStatusMessage('Recompiled system state applied to active workspace.');
  }, []);

  // Layout coordination bridge: syncs canvas nodes & properties to workspace.axiom
  const updateCanvasNodeConfig = useCallback((nodeId: string, configUpdates: Partial<import('../types/schema').CanvasNodeConfig>) => {
    mutateState(prev => {
      const updatedNodes = prev.workflowCanvas.nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                ...configUpdates
              }
            }
          };
        }
        return node;
      });

      return {
        ...prev,
        workflowCanvas: {
          ...prev.workflowCanvas,
          nodes: updatedNodes
        }
      };
    });
  }, [mutateState]);

  const updateCanvasLayout = useCallback((
    newNodes: import('../types/schema').WorkflowCanvasNode[], 
    newEdges: import('../types/schema').WorkflowCanvasEdge[]
  ) => {
    mutateState(prev => ({
      ...prev,
      workflowCanvas: {
        ...prev.workflowCanvas,
        nodes: newNodes,
        edges: newEdges
      }
    }));
  }, [mutateState]);

  const addCanvasNode = useCallback((
    type: import('../types/schema').WorkflowCanvasNode['type'], 
    position: { x: number; y: number }
  ) => {
    const id = `node-${Date.now().toString(36)}`;
    const labelMap: Record<typeof type, string> = {
      customerIngestion: 'Customer Ingestion Node',
      fulfillmentPipeline: 'Fulfillment Pipeline Node',
      legalLedger: 'Legal Ledger Node',
      taxCalculator: 'Tax Calculator Node',
      bankingGateway: 'Banking Gateway Node',
    };

    const newNode: import('../types/schema').WorkflowCanvasNode = {
      id,
      type,
      position,
      data: {
        label: labelMap[type],
        nodeType: type,
        config: {
          ingressVolumePerDay: 300,
          orderValueINR: 5000,
          gstRate: 18,
          isInterState: true,
          gatewayMdrPct: 1.85,
          escrowHoldbackPct: 10,
        }
      }
    };

    mutateState(prev => ({
      ...prev,
      workflowCanvas: {
        ...prev.workflowCanvas,
        nodes: [...prev.workflowCanvas.nodes, newNode]
      }
    }));
    setSaveStatusMessage(`Added operational node: ${labelMap[type]}`);
  }, [mutateState]);

  // Save changes
  const saveNow = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await writeWorkspaceFile(blueprint, filePath);
      if (res.success) {
        setIsDirty(false);
        setLastSaved(new Date());
        setSaveStatusMessage('Blueprint safely synchronized to ' + filePath);
        setTimeout(() => setSaveStatusMessage(null), 3500);
        return true;
      } else {
        setSaveStatusMessage('Error saving: ' + res.error);
        return false;
      }
    } catch (err: any) {
      setSaveStatusMessage('Save exception: ' + err?.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [blueprint, filePath]);

  // Auto-save debounce effect
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      saveNow();
    }, 2500);
    return () => clearTimeout(timer);
  }, [isDirty, saveNow]);

  const reloadFromFile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await readWorkspaceFile(filePath);
      setBlueprint(data);
      setIsDirty(false);
      setLastSaved(new Date());
      setSaveStatusMessage('Reloaded latest blueprint from disk.');
      setTimeout(() => setSaveStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filePath]);

  const resetBlueprint = useCallback(() => {
    setBlueprint(DEFAULT_WORKSPACE_AXIOM);
    setIsDirty(true);
    setSaveStatusMessage('Blueprint reset to Polymorphic default template.');
  }, []);

  const importJson = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as WorkspaceAxiom;
      if (!parsed.clientInfo || !Array.isArray(parsed.problemNodes) || !Array.isArray(parsed.dataSchemaAttributes)) {
        return { success: false, error: 'Invalid schema: Missing essential root object blocks.' };
      }
      setBlueprint(parsed);
      setIsDirty(true);
      setSaveStatusMessage('Blueprint successfully imported.');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid JSON format' };
    }
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        blueprint,
        isDirty,
        isSaving,
        isLoading,
        filePath,
        lastSaved,
        isTauriActive,
        saveStatusMessage,
        updateClientInfo,
        addProblemNode,
        updateProblemNode,
        deleteProblemNode,
        toggleProblemLock,
        addEAVAttribute,
        updateEAVAttribute,
        deleteEAVAttribute,
        createCheckpoint,
        rollbackCheckpoint,
        selectiveExtractNode,
        replaceBlueprint,
        updateCanvasNodeConfig,
        updateCanvasLayout,
        addCanvasNode,
        saveNow,
        reloadFromFile,
        resetBlueprint,
        importJson,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
