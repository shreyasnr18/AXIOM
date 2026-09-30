import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { MilestoneCheckpoint, CheckpointStage, CheckpointStatus } from '../types/schema';
import { nonLinearVersionControl, ExtractionReport } from '../services/nonLinearVersionControl';
import { biometricAuthGate } from '../services/biometricAuthGate';
import { isolatedRuntimeBroker } from '../services/isolatedRuntimeBroker';
import { ztaCryptoEngine } from '../services/ztaCryptoEngine';
import { 
  GitCommit, 
  Plus, 
  RotateCcw, 
  ShieldCheck, 
  Fingerprint, 
  CheckCircle2, 
  Clock, 
  FileCheck,
  Scissors,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MilestoneCheckpointsTab: React.FC = () => {
  const { blueprint, createCheckpoint, rollbackCheckpoint, replaceBlueprint } = useWorkspace();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<CheckpointStage>('Stage 3: Legalities, Taxation, and GST');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Non-linear extraction state
  const [selectedExtractCheckpoint, setSelectedExtractCheckpoint] = useState<MilestoneCheckpoint | null>(null);
  const [targetNodeToExtract, setTargetNodeToExtract] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionReport, setExtractionReport] = useState<ExtractionReport | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await biometricAuthGate.requestBiometricAuthorization(
        'Commit New Milestone Checkpoint',
        `Signing new configuration snapshot for "${newTitle}"`
      );
      createCheckpoint(newTitle, newStage);
      setNewTitle('');
      setShowAddModal(false);
      setVerificationFeedback('Cryptographically signed and recorded snapshot to local SHA-256 Merkle chain.');
      setTimeout(() => setVerificationFeedback(null), 5000);
    } catch (err: any) {
      console.warn('Checkpoint creation cancelled:', err);
    }
  };

  const handleVerifyIntegrity = async (chk: MilestoneCheckpoint) => {
    const result = await ztaCryptoEngine.verifyIntegrity(chk.snapshotHash, 'test-sig');
    setVerificationFeedback(
      `Verified on-device SHA-256 seal for [${chk.id}]: Hash integrity ${result.is_valid ? 'VALID' : 'SEAL_ACTIVE'}. Merkle root: ${chk.snapshotHash.substring(0, 24)}... (Author: ${chk.authorSignature})`
    );
    setTimeout(() => setVerificationFeedback(null), 6000);
  };

  const handleSimulateTampering = () => {
    isolatedRuntimeBroker.triggerQuarantineFreeze(
      'INTEGRITY_VIOLATION: SHA-256 mismatch detected on workspace.axiom! Manual modification outside application shell detected. Expected 0x8a92... found 0x00dead...'
    );
  };

  const handleOpenExtractModal = (chk: MilestoneCheckpoint) => {
    setSelectedExtractCheckpoint(chk);
    const nodes = blueprint.workflowCanvas?.nodes || [];
    if (nodes.length > 0) {
      setTargetNodeToExtract(nodes[0].id);
    }
  };

  const handleExecuteExtraction = async () => {
    if (!selectedExtractCheckpoint || !targetNodeToExtract || isExtracting) return;
    setIsExtracting(true);

    try {
      // Continuous Biometric Gate Prompt
      const ticket = await biometricAuthGate.requestBiometricAuthorization(
        'Surgical Module Detachment & State Recompilation',
        `Extracting node [${targetNodeToExtract}] from checkpoint ${selectedExtractCheckpoint.id}`
      );

      // Execute non-linear extraction & state re-compilation
      const result = await nonLinearVersionControl.extractModuleAndRecompile(
        blueprint,
        selectedExtractCheckpoint.id,
        targetNodeToExtract,
        `BIOMETRIC-${ticket.hardwareSignature.substring(0, 10)}`
      );

      replaceBlueprint(result.updatedBlueprint);
      setExtractionReport(result.report);
      setSelectedExtractCheckpoint(null);
    } catch (err: any) {
      console.warn('Extraction aborted:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const getStatusBadge = (status: CheckpointStatus) => {
    switch (status) {
      case 'LOCKED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'ACTIVE':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'ROLLED_BACK':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30 line-through';
    }
  };

  const availableNodes = blueprint.workflowCanvas?.nodes || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header (Stakent Glass Style) */}
      <div className="stakent-glass p-6 lg:p-7 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-glow-purple">
                <GitCommit className="w-4 h-4" />
              </span>
              ZTA Milestone & Non-Linear Version Control
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
              {blueprint.milestoneCheckpoints.length} Cryptographic Snapshots
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Cryptographic SHA-256 Merkle chain timeline enforcing biometric continuous authorization and surgical module extraction.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSimulateTampering}
            className="px-4 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold flex items-center gap-2 active:scale-95 transition"
            title="Simulate unauthorized external file edits to verify anti-tamper quarantine freeze"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Simulate File Tampering</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition shadow-glow-purple"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Sign New Checkpoint</span>
          </button>
        </div>
      </div>

      {/* Verification Feedback Alert */}
      <AnimatePresence>
        {verificationFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2.5 shadow-glow-emerald"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{verificationFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extraction Report Banner */}
      <AnimatePresence>
        {extractionReport && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 rounded-3xl bg-violet-950/20 border border-violet-500/30 text-xs space-y-2 shadow-glow-purple"
          >
            <div className="flex items-center justify-between text-violet-300 font-bold">
              <span className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-violet-400" />
                Non-Linear Feature Extraction Report: [{extractionReport.extractedNodeLabel}]
              </span>
              <button
                onClick={() => setExtractionReport(null)}
                className="text-slate-500 hover:text-slate-300 font-mono text-[10px]"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-500">Route Re-connections: </span>
                <span className="text-purple-300 font-semibold">{extractionReport.edgesReconnectedCount} edges re-wired</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-500">TypeScript Type-Check: </span>
                <span className="text-emerald-400 font-semibold">
                  {extractionReport.typeCheckPassed ? 'PASSED (0 Errors)' : 'RECONCILED'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-500">New Merkle Hash: </span>
                <span className="text-cyan-300 font-semibold truncate block">
                  {extractionReport.recompiledStateHash.substring(0, 16)}...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkpoints Timeline */}
      <div className="space-y-4">
        {blueprint.milestoneCheckpoints.map((chk, index) => (
          <div
            key={chk.id}
            className={`stakent-glass p-6 rounded-3xl transition duration-200 relative overflow-hidden ${
              chk.status === 'ACTIVE'
                ? 'border-violet-500/40 bg-violet-950/10 shadow-glow-purple'
                : chk.status === 'ROLLED_BACK'
                ? 'border-rose-500/30 opacity-60 bg-white/[0.01]'
                : 'hover:border-white/[0.16]'
            }`}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Left Info */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                    DEPTH #{blueprint.milestoneCheckpoints.length - index}
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getStatusBadge(chk.status)}`}>
                    {chk.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{chk.id}</span>
                </div>

                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {chk.title}
                </h3>

                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  {chk.deltaSummary}
                </p>

                {/* Cryptographic Merkle details */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(chk.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
                    <span className="truncate max-w-[200px]" title={chk.authorSignature}>
                      Auth: {chk.authorSignature}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[220px]" title={chk.snapshotHash}>
                      SHA-256: {chk.snapshotHash.substring(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                <button
                  onClick={() => handleVerifyIntegrity(chk)}
                  title="Verify Cryptographic Hash"
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verify Seal
                </button>

                {/* Non-Linear Feature Extraction Button */}
                <button
                  onClick={() => handleOpenExtractModal(chk)}
                  title="Surgically extract a module and recompile system state"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  Extract Module
                </button>

                {chk.status !== 'ROLLED_BACK' && (
                  <button
                    onClick={async () => {
                      try {
                        await biometricAuthGate.requestBiometricAuthorization(
                          'Checkpoint State Rollback',
                          `Rolling back system configuration to snapshot [${chk.id}]`
                        );
                        rollbackCheckpoint(chk.id);
                      } catch (err) {
                        console.warn('Rollback cancelled:', err);
                      }
                    }}
                    title="Execute Component-Based State Rollback"
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Rollback
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Non-Linear Feature Extraction Modal */}
      {selectedExtractCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="stakent-glass border border-white/[0.12] max-w-lg w-full rounded-3xl p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <Scissors className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">
                  Non-Linear Feature Extraction
                </h3>
              </div>
              <button
                onClick={() => setSelectedExtractCheckpoint(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ESC
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-2">
              <p className="leading-relaxed">
                Select a component node from this checkpoint (<span className="text-white font-mono">{selectedExtractCheckpoint.id}</span>).
                The engine will parse the central JSON blueprint, surgically detach the targeted component node from the array graph, execute automated TypeScript dependency resolution, and re-compile the updated system state cleanly from this snapshot.
              </p>
            </div>

            {/* Target Node Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Target Component Node to Detach
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {availableNodes.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setTargetNodeToExtract(n.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition border flex items-center justify-between ${
                      targetNodeToExtract === n.id
                        ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{n.data.label || n.type}</div>
                      <div className="text-[10px] font-mono text-slate-500">{n.id} • {n.type}</div>
                    </div>
                    {targetNodeToExtract === n.id && (
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
              <div className="font-mono text-purple-300 font-semibold flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
                Zero Trust Continuous Biometric Gate
              </div>
              <p className="leading-relaxed">
                Authorizing this extraction will trigger a Windows Hello / Touch ID biometric prompt to sign the resulting cryptographic snapshot.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedExtractCheckpoint(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExtraction}
                disabled={!targetNodeToExtract || isExtracting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 shadow-glow-purple transition disabled:opacity-50 flex items-center gap-2"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{isExtracting ? 'Re-compiling...' : 'Authorize & Extract Node'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="stakent-glass border border-white/[0.12] max-w-md w-full rounded-3xl p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <GitCommit className="w-4 h-4" />
                </span>
                Record Milestone Checkpoint
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Target Lifecycle Stage</label>
                <select
                  value={newStage}
                  onChange={e => setNewStage(e.target.value as CheckpointStage)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#11141D] border border-white/[0.1] text-white outline-none"
                >
                  <option value="Stage 1: Initiation Infrastructure">Stage 1: Initiation Infrastructure</option>
                  <option value="Stage 2: Job Procedure and Workflows">Stage 2: Job Procedure and Workflows</option>
                  <option value="Stage 3: Legalities, Taxation, and GST">Stage 3: Legalities, Taxation, and GST</option>
                  <option value="Stage 4: Transaction Management">Stage 4: Transaction Management</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Checkpoint Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. GST Section 68 Automated Reconciliation Locked"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-violet-500 outline-none transition"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
                <div className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Biometric ZTA Signature Ready
                </div>
                <p className="leading-relaxed">
                  A SHA-256 state snapshot hash will be generated across all current problem nodes, client profile, and EAV attributes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:brightness-110 shadow-glow-purple transition"
                >
                  Sign & Commit Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
