import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProblemDomain, ProblemSeverity, FrictionCategory } from '../types/schema';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProblemNodesTab: React.FC = () => {
  const { blueprint, addProblemNode, deleteProblemNode, toggleProblemLock, selectiveExtractNode } = useWorkspace();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<ProblemDomain>('Logistics & Supply Chain');
  const [severity, setSeverity] = useState<ProblemSeverity>('High');
  const [frictionCategory, setFrictionCategory] = useState<FrictionCategory>('Operational Bottleneck');
  const [description, setDescription] = useState('');
  const [governingAct, setGoverningAct] = useState('Central Regulatory Standard');
  const [riskScore, setRiskScore] = useState(75);
  const [mitigationStrategy, setMitigationStrategy] = useState('');
  const [wasteHours, setWasteHours] = useState(100);
  const [capitalLeakage, setCapitalLeakage] = useState(5000);
  const [stakeholders, setStakeholders] = useState('Ops Team, Finance, Compliance');

  const filteredNodes = blueprint.problemNodes.filter(n => {
    if (selectedSeverity === 'ALL') return true;
    return n.severity === selectedSeverity;
  });

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addProblemNode({
      title,
      domain,
      severity,
      frictionCategory,
      description,
      affectedStakeholders: stakeholders.split(',').map(s => s.trim()).filter(Boolean),
      isLocked: false,
      complianceImpact: {
        governingAct,
        riskScore,
        mitigationStrategy: mitigationStrategy || 'Automated workflow validation loop',
      },
      metrics: {
        estimatedWasteHoursPerMonth: Number(wasteHours),
        estimatedCapitalLeakageUSD: Number(capitalLeakage),
      }
    });

    // Reset
    setTitle('');
    setDescription('');
    setMitigationStrategy('');
    setShowAddModal(false);
  };

  const getSeverityBadge = (sev: ProblemSeverity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Low':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls (Stakent Glass Panel) */}
      <div className="stakent-glass p-6 lg:p-7 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
              Business Problem Nodes
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
              {blueprint.problemNodes.length} Nodes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Root schema block: Isolates operational friction points, anchors HTAP ledger calculations, and feeds dynamic engines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Severity filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
            {['ALL', 'Critical', 'High', 'Medium'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-full transition-all duration-200 ${
                  selectedSeverity === sev 
                    ? 'bg-violet-600 text-white font-bold shadow-glow-purple' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition shadow-glow-purple"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Ingest Problem Node
          </button>
        </div>
      </div>

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredNodes.map(node => (
            <motion.div
              key={node.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`stakent-glass rounded-3xl p-6 flex flex-col justify-between group transition-all duration-200 relative overflow-hidden ${
                node.isLocked 
                  ? 'border-violet-500/40 bg-violet-950/10 shadow-glow-purple' 
                  : 'hover:border-white/[0.18]'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                        {node.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getSeverityBadge(node.severity)}`}>
                        {node.severity}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug pt-1 group-hover:text-violet-300 transition">
                      {node.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleProblemLock(node.id)}
                    title={node.isLocked ? "Problem context is LOCKED into workflow" : "Click to LOCK into workflow"}
                    className={`p-2 rounded-xl border transition active:scale-95 ${
                      node.isLocked 
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-glow-purple' 
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {node.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-3">
                  {node.description}
                </p>

                {/* Domain & Category Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                    {node.domain}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                    {node.frictionCategory}
                  </span>
                </div>

                {/* Compliance Box */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Regulatory Rule
                    </span>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">
                      Risk: {node.complianceImpact.riskScore}%
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 truncate" title={node.complianceImpact.governingAct}>
                    {node.complianceImpact.governingAct}
                  </div>
                </div>
              </div>

              {/* Bottom Metrics & Actions */}
              <div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06] text-xs font-mono mb-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{node.metrics?.estimatedWasteHoursPerMonth || 0} hrs/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                    <span>${node.metrics?.estimatedCapitalLeakageUSD?.toLocaleString() || 0} /mo</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate max-w-[170px]">
                    <span>Stakeholders: {node.affectedStakeholders.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => selectiveExtractNode(node.id)}
                      title="Non-linear ZTA Component Extraction"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-amber-300 border border-white/[0.08] transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProblemNode(node.id)}
                      title="Delete Problem Node"
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.08] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ingest Modal (Stakent Dark Glass Dialog) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="stakent-glass max-w-xl w-full rounded-3xl p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-white/[0.14]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                Ingest New Business Problem Node
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Problem Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Real-Time Dynamic Pricing Reconciliation Lag"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-violet-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Domain</label>
                  <select
                    value={domain}
                    onChange={e => setDomain(e.target.value as ProblemDomain)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#11141D] border border-white/[0.1] text-white outline-none"
                  >
                    <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                    <option value="FinTech & Payments">FinTech & Payments</option>
                    <option value="Tax & Regulatory Compliance">Tax & Regulatory Compliance</option>
                    <option value="Enterprise Operations">Enterprise Operations</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Consumer Commerce">Consumer Commerce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as ProblemSeverity)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#11141D] border border-white/[0.1] text-white outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Friction Category</label>
                <select
                  value={frictionCategory}
                  onChange={e => setFrictionCategory(e.target.value as FrictionCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#11141D] border border-white/[0.1] text-white outline-none"
                >
                  <option value="Operational Bottleneck">Operational Bottleneck</option>
                  <option value="Supply Chain Inefficiency">Supply Chain Inefficiency</option>
                  <option value="Regulatory Friction">Regulatory Friction</option>
                  <option value="Capital Leakage">Capital Leakage</option>
                  <option value="Data Silo">Data Silo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Problem Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe operational bottleneck, root cause, and downstream failure point..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-violet-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Governing Regulation / Act</label>
                  <input
                    type="text"
                    value={governingAct}
                    onChange={e => setGoverningAct(e.target.value)}
                    placeholder="e.g. CGST Act / RBI Compliance"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Compliance Risk Score ({riskScore}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={riskScore}
                    onChange={e => setRiskScore(Number(e.target.value))}
                    className="w-full mt-2 accent-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Waste Hours / Month</label>
                  <input
                    type="number"
                    value={wasteHours}
                    onChange={e => setWasteHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Capital Leakage (USD/mo)</label>
                  <input
                    type="number"
                    value={capitalLeakage}
                    onChange={e => setCapitalLeakage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Affected Stakeholders (comma-separated)</label>
                <input
                  type="text"
                  value={stakeholders}
                  onChange={e => setStakeholders(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:brightness-110 shadow-glow-purple transition"
                >
                  Commit Node to Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
