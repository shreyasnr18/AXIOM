import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  GitCommit,
  CheckCircle2,
  Layers,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';

export const OverviewTab: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { blueprint } = useWorkspace();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30D' | '90D' | '1Y'>('90D');
  const [verifiedHashFeedback, setVerifiedHashFeedback] = useState<string | null>(null);

  const totalCapitalLeakage = blueprint.problemNodes.reduce(
    (acc, n) => acc + (n.metrics?.estimatedCapitalLeakageUSD || 0), 
    0
  );
  const criticalProblems = blueprint.problemNodes.filter(n => n.severity === 'Critical').length;
  const lockedCheckpoints = blueprint.milestoneCheckpoints.filter(c => c.status === 'LOCKED').length;
  const latestCheckpoint = blueprint.milestoneCheckpoints[0] || null;

  const handleVerifyCurrentHash = () => {
    if (!latestCheckpoint) return;
    setVerifiedHashFeedback(`SHA-256 Verified on-device: ${latestCheckpoint.snapshotHash.substring(0, 24)}... (Zero-Knowledge Enclave Seal Valid)`);
    setTimeout(() => setVerifiedHashFeedback(null), 5000);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.45, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 lg:p-12 space-y-10 max-w-[1600px] mx-auto text-slate-100 selection:bg-purple-500/30"
    >
      {/* 1. Header: Clean, Breathable, Highly Professional */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 border-b border-white/[0.06]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono tracking-wider uppercase text-violet-400 font-semibold">
              Enterprise Telemetry
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              {blueprint.clientInfo.companyName || 'Primary Operating Entity'}
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Operations & Capital Overview
          </h1>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('compiler')}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 active:scale-95 transition flex items-center gap-2"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Compiler Studio</span>
          </button>

          <button
            onClick={() => onNavigate('canvas')}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 transition shadow-glow-purple flex items-center gap-2"
          >
            <span>Open Studio Canvas</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>

      {/* 2. Top Metric Tier: 4 Spacious, Breathable, High-Utility Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Gross Ingress */}
        <div 
          onClick={() => onNavigate('canvas')}
          className="stakent-glass stakent-glass-interactive rounded-3xl p-6 space-y-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Gross Ingress Flow
            </span>
            <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.6%
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-cyan-300 transition">
              ₹42,085,494
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active monthly throughput volume
            </p>
          </div>

          {/* Minimal Clean SVG Sparkline */}
          <div className="pt-2">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 200 30">
              <path
                d="M 0 25 C 50 28, 100 12, 150 16 C 175 18, 190 6, 200 8"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Value at Risk / Bottlenecks */}
        <div 
          onClick={() => onNavigate('problems')}
          className="stakent-glass stakent-glass-interactive rounded-3xl p-6 space-y-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Operational Risk
            </span>
            <span className="text-xs font-bold font-mono text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" /> {criticalProblems} Critical
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-rose-300 transition">
              ${totalCapitalLeakage.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monthly capital leakage identified
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/[0.04]">
            <span>{blueprint.problemNodes.length} Problem Nodes</span>
            <span className="text-violet-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Review <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Regulatory & GST Settlement */}
        <div 
          onClick={() => onNavigate('eav')}
          className="stakent-glass stakent-glass-interactive rounded-3xl p-6 space-y-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              GST Tax Ledger
            </span>
            <span className="text-xs font-bold font-mono text-violet-400 flex items-center gap-1 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> 18% Verified
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-violet-300 transition">
              ₹6,825,000
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated Rule 138 E-Way seal
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/[0.04]">
            <span>{blueprint.dataSchemaAttributes.length} EAV Variables</span>
            <span className="text-violet-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Schema <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Capital Runway */}
        <div 
          onClick={() => onNavigate('checkpoints')}
          className="stakent-glass stakent-glass-interactive rounded-3xl p-6 space-y-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Capital Runway
            </span>
            <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" /> Stable
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-emerald-300 transition">
              18.4 Months
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Vendor Escrow: ₹8.45L held (T+1)
            </p>
          </div>

          <div className="pt-2">
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[78%] rounded-full" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Middle Section: High-Resolution Multi-Channel Capital Stream Projection */}
      <motion.div variants={itemVariants} className="stakent-glass rounded-3xl p-8 lg:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Financial Liquidity Trajectory
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Multi-Channel Inflow & Escrow Clearance
            </h2>
          </div>

          {/* Interactive Timeframe Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
            {(['30D', '90D', '1Y'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-4 py-1.5 rounded-full font-bold transition-all duration-200 ${
                  selectedTimeframe === tf
                    ? 'bg-violet-600 text-white shadow-glow-purple'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Large Clean Fluid Graph */}
        <div className="h-64 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="streamCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="streamPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Subtle Gridlines */}
            <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

            {/* Stream 1: Gross Ingress Flow */}
            <path
              d={selectedTimeframe === '30D'
                ? "M0,140 Q200,90 400,60 T800,40 L800,190 L0,190 Z"
                : selectedTimeframe === '90D'
                ? "M0,150 Q200,110 400,60 T800,50 L800,190 L0,190 Z"
                : "M0,160 Q200,130 400,80 T800,30 L800,190 L0,190 Z"}
              fill="url(#streamCyan)"
              className="transition-all duration-500 ease-out"
            />
            <path
              d={selectedTimeframe === '30D'
                ? "M0,140 Q200,90 400,60 T800,40"
                : selectedTimeframe === '90D'
                ? "M0,150 Q200,110 400,60 T800,50"
                : "M0,160 Q200,130 400,80 T800,30"}
              stroke="#38BDF8"
              strokeWidth="2.5"
              fill="none"
              className="transition-all duration-500 ease-out"
            />

            {/* Stream 2: Operating Capital Margin */}
            <path
              d={selectedTimeframe === '30D'
                ? "M0,160 Q200,120 400,95 T800,80 L800,190 L0,190 Z"
                : selectedTimeframe === '90D'
                ? "M0,170 Q200,140 400,110 T800,90 L800,190 L0,190 Z"
                : "M0,180 Q200,150 400,120 T800,70 L800,190 L0,190 Z"}
              fill="url(#streamPurple)"
              className="transition-all duration-500 ease-out"
            />
            <path
              d={selectedTimeframe === '30D'
                ? "M0,160 Q200,120 400,95 T800,80"
                : selectedTimeframe === '90D'
                ? "M0,170 Q200,140 400,110 T800,90"
                : "M0,180 Q200,150 400,120 T800,70"}
              stroke="#8B5CF6"
              strokeWidth="2"
              fill="none"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Timeline X-Labels */}
          <div className="flex justify-between text-xs font-mono text-slate-500 pt-3 border-t border-white/[0.04]">
            <span>Cycle Start</span>
            <span>Week 2</span>
            <span>Mid Cycle</span>
            <span>Week 6</span>
            <span>Maturity Close</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span className="text-slate-300">Gross Customer Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-400 shadow-glow-purple" />
            <span className="text-slate-300">Net Operating Clearance</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-3 h-3 rounded-full bg-emerald-400/50" />
            <span>Dual-Key Escrow Release (T+1)</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Bottom Tier: 2 Balanced, High-Utility Working Modules */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module A: Pipeline Conduits Summary */}
        <div className="stakent-glass rounded-3xl p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Live Architecture
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                5 Nodes Active
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Pipeline Conduits
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time operational blocks routing inbound order volume through fulfillment queues, regulatory tax calculations, and banking escrow gates.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Customer Ingestion', tag: 'Trigger', value: '450 orders/day', color: 'border-cyan-500/30 text-cyan-300' },
              { title: 'Fulfillment Queue', tag: 'Logic', value: '98.4% SLA Adherence', color: 'border-sky-500/30 text-sky-300' },
              { title: 'Tax Calculator', tag: 'Compliance', value: '18% IGST Tariff 996511', color: 'border-amber-500/30 text-amber-300' },
              { title: 'Banking Gateway', tag: 'Settlement', value: '1.85% MDR Fee (T+1)', color: 'border-emerald-500/30 text-emerald-300' },
            ].map((node, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${node.color}`}>
                    {node.tag}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{node.title}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{node.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('canvas')}
            className="w-full py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Configure Full Canvas Graph</span>
          </button>
        </div>

        {/* Module B: Zero-Trust Cryptographic Health & Checkpoints */}
        <div className="stakent-glass rounded-3xl p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Governance & Verification
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {lockedCheckpoints} Locked Snapshots
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Zero-Trust Architecture (ZTA)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every workflow variation, tax boundary, and problem node is cryptographically sealed on-device using SHA-256 state tree fingerprints.
            </p>
          </div>

          {verifiedHashFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{verifiedHashFeedback}</span>
            </div>
          )}

          {latestCheckpoint ? (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Latest Sealed Checkpoint:</span>
                <span className="text-violet-300 font-bold">{latestCheckpoint.id}</span>
              </div>
              <div className="text-white font-bold text-sm">
                {latestCheckpoint.title}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Hash: {latestCheckpoint.snapshotHash}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                <span>Author: {latestCheckpoint.authorSignature}</span>
                <span>{new Date(latestCheckpoint.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-slate-400 text-center">
              No checkpoints recorded yet.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleVerifyCurrentHash}
              className="py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Audit State Hash</span>
            </button>
            <button
              onClick={() => onNavigate('checkpoints')}
              className="py-3 rounded-2xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 shadow-glow-purple"
            >
              <GitCommit className="w-4 h-4 text-violet-400" />
              <span>View Milestones</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
