import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  webllmEngine, 
  CodeCompilationTarget, 
  CompilationMetrics, 
  CompilerEngineStatus 
} from '../services/webllmEngine';
import { cdcSyncWorker, CdcSyncStatus } from '../services/cdcSyncWorker';
import { htapDualEngine } from '../services/htapDualEngine';
import { biometricAuthGate } from '../services/biometricAuthGate';
import { 
  Cpu, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Zap, 
  Database, 
  Activity, 
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CompilerStudioTab: React.FC = () => {
  const { blueprint } = useWorkspace();
  const nodes = blueprint.workflowCanvas?.nodes || [];

  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'node_1');
  const [targetLang, setTargetLang] = useState<CodeCompilationTarget>('typescript');
  const [compiledCode, setCompiledCode] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<CompilationMetrics | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Engine & CDC states
  const [engineStatus, setEngineStatus] = useState<CompilerEngineStatus>({
    isLoaded: false,
    isLoading: false,
    loadingProgressText: 'Booting engine...',
    loadingProgressPct: 0,
    activeModel: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    hardwareProfile: null,
    error: null,
  });

  const [cdcStatus, setCdcStatus] = useState<CdcSyncStatus>(cdcSyncWorker.getStatus());
  const [simulatedIngressFeedback, setSimulatedIngressFeedback] = useState<string | null>(null);

  const codeContainerRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const unsubEngine = webllmEngine.subscribe(setEngineStatus);
    const unsubCdc = cdcSyncWorker.subscribe(setCdcStatus);

    // Eagerly initialize engine
    webllmEngine.initializeEngine();

    return () => {
      unsubEngine();
      unsubCdc();
    };
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const handleCompile = async () => {
    if (!selectedNode || isCompiling) return;

    try {
      await biometricAuthGate.requestBiometricAuthorization(
        'Zero Trust AI Code Synthesis',
        `Compiling [${selectedNode.data.label || selectedNode.type}] to ${targetLang.toUpperCase()} via host compute engine`
      );
    } catch (authErr) {
      console.warn('Biometric authorization cancelled:', authErr);
      return;
    }

    setIsCompiling(true);
    setCompiledCode('');
    setMetrics(null);

    try {
      const resMetrics = await webllmEngine.compileComponentStream(
        {
          nodeId: selectedNode.id,
          nodeType: selectedNode.type,
          nodeTitle: selectedNode.data.label || selectedNode.type,
          nodeConfig: selectedNode.data.config || {},
          targetLanguage: targetLang,
        },
        (accumulated) => {
          setCompiledCode(accumulated);
          if (codeContainerRef.current) {
            codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
          }
        }
      );
      setMetrics(resMetrics);
    } catch (err) {
      console.error('Compilation error:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyCode = () => {
    if (!compiledCode) return;
    navigator.clipboard.writeText(compiledCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    if (!compiledCode) return;
    const extensions: Record<CodeCompilationTarget, string> = {
      typescript: 'ts',
      rust: 'rs',
      sql: 'sql',
    };
    const ext = extensions[targetLang];
    const blob = new Blob([compiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNode.type}_compiled.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateOltpIngress = async () => {
    const randomAmount = Math.floor(5000 + Math.random() * 45000);
    const txId = await cdcSyncWorker.ingestRowLevelTransaction({
      gross_amount: randomAmount,
      status: 'CLEARED',
    });
    setSimulatedIngressFeedback(`OLTP Row Injected (${txId.substring(0, 10)}...) → Trigger Fired → Replicated to DuckDB`);
    setTimeout(() => setSimulatedIngressFeedback(null), 4000);
  };

  const hw = engineStatus.hardwareProfile;

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-[1600px] mx-auto text-slate-100">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 border-b border-white/[0.06]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono tracking-wider uppercase text-purple-400 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Client-Side AI Engine & Compiler Studio
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              HTAP Workload Separation Core
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Component Synthesis & AI Runtime
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateOltpIngress}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Emit Test OLTP Ingress</span>
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span className="font-mono text-[11px]">{engineStatus.activeModel.split('-')[0]}-Coder</span>
          </div>
        </div>
      </div>

      {/* 2. Top Telemetry Grid: Dual-Engine HTAP & WebGPU Hardware Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Hardware Compute Engine */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-4 h-4 text-violet-400" />
              Hardware Target
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {hw?.executionTarget || 'Detecting...'}
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {hw?.gpuVendor || 'Probing Hardware...'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              {hw?.gpuArchitecture || 'Host Compute Shader Limits'}
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>VRAM Bounds:</span>
            <span className="text-slate-200">~{hw ? (hw.vramEstimatedMB / 1024).toFixed(1) : 4.0} GB</span>
          </div>
        </div>

        {/* Card 2: AI Runtime Engine */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-4 h-4 text-amber-400" />
              Local Model Runtime
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              WebLLM
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              Qwen 2.5 Coder
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              {engineStatus.activeModel}
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Compute FLOPs:</span>
            <span className="text-amber-300">{hw?.benchmarkThroughputGigaOps || 14.8} GigaOps/s</span>
          </div>
        </div>

        {/* Card 3: HTAP OLTP Core (SQLite) */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-4 h-4 text-cyan-400" />
              OLTP Core (SQLite)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              ACID Rows
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {htapDualEngine.getStats().totalTransactionsRecorded} Writes
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              Automated Triggers → `cdc_log`
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Pending CDC Queue:</span>
            <span className="text-cyan-300">{htapDualEngine.getStats().pendingCdcEvents} events</span>
          </div>
        </div>

        {/* Card 4: HTAP OLAP Core (DuckDB & CDC) */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-4 h-4 text-emerald-400" />
              OLAP Core (DuckDB)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CDC Active
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {cdcStatus.duckDbRowCount} Ingested
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              Columnar RAM Streaming
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Replication Lag:</span>
            <span className="text-emerald-400">{cdcStatus.currentReplicationLagMs} ms</span>
          </div>
        </div>
      </div>

      {/* Real-time Ingress Feedback Alert */}
      <AnimatePresence>
        {simulatedIngressFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-3"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simulatedIngressFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace: Node Parameter Selector & Live Code Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Node Configuration & Language Picker (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Node Selector Panel */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Select Workflow Node (workspace.axiom)</span>
            </div>

            <div className="space-y-2">
              {nodes.map(n => {
                const isSelected = n.id === selectedNodeId;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    className={`w-full text-left p-3 rounded-2xl transition border text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-violet-600/15 border-violet-500/40 text-white shadow-sm'
                        : 'bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{n.data.label || n.type}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{n.type}</div>
                    </div>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}
            </div>

            {/* Current Node Structured Parameters */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Structured Parameters
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {selectedNode && Object.entries(selectedNode.data.config || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-slate-500">{k}:</span>
                    <span className="text-violet-300 font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compilation Target Language */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Compilation Target Language
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['typescript', 'rust', 'sql'] as CodeCompilationTarget[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setTargetLang(lang)}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-medium transition border text-center ${
                      targetLang === lang
                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-200 font-bold'
                        : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'typescript' ? 'TS Micro' : lang === 'rust' ? 'Rust Crate' : 'SQL DDL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-glow-purple ${
                isCompiling
                  ? 'bg-purple-700/50 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing via {hw?.executionTarget.startsWith('WebGPU') ? 'WebGPU' : 'CPU'}...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Compile Component Block</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Code Streaming View & Live Telemetry (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-3xl bg-[#090A10]/95 border border-white/[0.06] backdrop-blur-2xl space-y-4 shadow-2xl relative">
            {/* Terminal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  {selectedNode.type}.{targetLang === 'typescript' ? 'ts' : targetLang === 'rust' ? 'rs' : 'sql'}
                </span>
                {isCompiling && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-pulse">
                    Streaming Tokens...
                  </span>
                )}
              </div>

              {/* Code Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  disabled={!compiledCode}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-xs text-slate-300 font-medium transition flex items-center gap-1.5 border border-white/[0.04]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadCode}
                  disabled={!compiledCode}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-xs text-slate-300 font-medium transition flex items-center gap-1.5 border border-white/[0.04]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Output Viewer */}
            <div className="relative min-h-[420px] max-h-[560px] flex flex-col">
              <pre
                ref={codeContainerRef}
                className="flex-1 overflow-auto no-scrollbar font-mono text-xs leading-relaxed text-slate-200 bg-black/50 p-4 rounded-2xl border border-white/[0.03] select-text selection:bg-purple-600/30"
              >
                {compiledCode || (
                  <span className="text-slate-600 italic">
                    // Click &quot;Compile Component Block&quot; to synthesize production {targetLang.toUpperCase()} software code
                    {"\n"}// Local model &quot;{engineStatus.activeModel}&quot; will stream directly from host {hw?.executionTarget.startsWith('WebGPU') ? 'GPU' : 'CPU'}...
                  </span>
                )}
              </pre>
            </div>

            {/* Bottom Inference Speed Telemetry HUD */}
            {metrics && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400"
              >
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-slate-500">Speed: </span>
                    <span className="text-emerald-400 font-bold">{metrics.tokensPerSecond} tok/s</span>
                  </div>
                  <div>
                    <span className="text-slate-500">TTFT: </span>
                    <span className="text-slate-200">{metrics.timeToFirstTokenMs} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Tokens: </span>
                    <span className="text-purple-300">{metrics.totalTokens}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Engine: <span className="text-slate-300">{metrics.engineUsed}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
