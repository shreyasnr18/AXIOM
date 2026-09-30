import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EAVValueType } from '../types/schema';
import { 
  Database, 
  Plus, 
  Trash2, 
  Link2, 
  Search, 
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const EAVAttributesTab: React.FC = () => {
  const { blueprint, addEAVAttribute, deleteEAVAttribute } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [entity, setEntity] = useState('ConsignmentManifest');
  const [attribute, setAttribute] = useState('');
  const [valueType, setValueType] = useState<EAVValueType>('string');
  const [currentValue, setCurrentValue] = useState<string>('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [description, setDescription] = useState('');
  const [graphEdgeInput, setGraphEdgeInput] = useState('');

  const filteredAttributes = blueprint.dataSchemaAttributes.filter(a => {
    const q = searchTerm.toLowerCase();
    return (
      a.entity.toLowerCase().includes(q) ||
      a.attribute.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attribute.trim() || !entity.trim()) return;

    let parsedVal: any = currentValue;
    if (valueType === 'number' || valueType === 'currency') {
      parsedVal = Number(currentValue) || 0;
    } else if (valueType === 'boolean') {
      parsedVal = currentValue === 'true';
    }

    addEAVAttribute({
      entity,
      attribute,
      valueType,
      defaultValue: null,
      currentValue: parsedVal,
      isEncrypted,
      constraints: {
        required: true,
      },
      graphEdges: graphEdgeInput.split(',').map(s => s.trim()).filter(Boolean),
      description: description || `EAV attribute for ${entity}.${attribute}`,
    });

    setAttribute('');
    setCurrentValue('');
    setDescription('');
    setShowAddModal(false);
  };

  const getTypeColor = (type: EAVValueType) => {
    switch (type) {
      case 'currency': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'relation': return 'text-violet-400 bg-violet-500/15 border-violet-500/30';
      case 'number': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'boolean': return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      default: return 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="stakent-glass p-6 lg:p-7 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-glow-purple">
                <Database className="w-4 h-4" />
              </span>
              EAV Graph Variables
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
              {blueprint.dataSchemaAttributes.length} Variables
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Root schema block: Polymorphic dynamic data schema layer linking relational entities, types, and on-device ZTA encryption flags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search EAV schema..."
              className="pl-9 pr-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 focus:border-violet-500 outline-none w-56 font-mono transition"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition shadow-glow-purple"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add EAV Variable
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="stakent-glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-4">Identifier & Entity</th>
                <th className="px-6 py-4">Attribute Name</th>
                <th className="px-6 py-4">Type & Encryption</th>
                <th className="px-6 py-4">Current Value</th>
                <th className="px-6 py-4">Graph Edges</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {filteredAttributes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-sans text-xs">
                    No EAV schema variables found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredAttributes.map(attr => (
                  <tr key={attr.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100 font-sans text-xs">{attr.entity}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{attr.id}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-200">{attr.attribute}</span>
                      <div className="text-[11px] text-slate-400 font-sans truncate max-w-xs" title={attr.description}>
                        {attr.description}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getTypeColor(attr.valueType)}`}>
                          {attr.valueType}
                        </span>
                        {attr.isEncrypted && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400" title="AES-256 ZTA Encrypted At Rest">
                            <KeyRound className="w-3 h-3" />
                            <span className="hidden sm:inline">Encrypted</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-200 max-w-xs truncate inline-block">
                        {String(attr.currentValue ?? '—')}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {attr.graphEdges && attr.graphEdges.length > 0 ? (
                          attr.graphEdges.map(edge => (
                            <span key={edge} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-slate-300 border border-white/[0.06] flex items-center gap-1">
                              <Link2 className="w-2.5 h-2.5 text-violet-400" />
                              {edge}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-[11px]">No Edges</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteEAVAttribute(attr.id)}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.06] transition"
                        title="Delete Variable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="stakent-glass border border-white/[0.12] max-w-md w-full rounded-3xl p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <Database className="w-4 h-4" />
                </span>
                Add EAV Schema Variable
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
                <label className="block text-slate-300 font-medium mb-1.5">Entity Domain</label>
                <input
                  type="text"
                  required
                  value={entity}
                  onChange={e => setEntity(e.target.value)}
                  placeholder="e.g. ConsignmentManifest / LedgerEntry"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-violet-500 outline-none font-mono transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Attribute Name</label>
                <input
                  type="text"
                  required
                  value={attribute}
                  onChange={e => setAttribute(e.target.value)}
                  placeholder="e.g. gst_tax_total or eway_auth_hash"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-violet-500 outline-none font-mono transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Value Type</label>
                  <select
                    value={valueType}
                    onChange={e => setValueType(e.target.value as EAVValueType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#11141D] border border-white/[0.1] text-white outline-none"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="currency">currency</option>
                    <option value="boolean">boolean</option>
                    <option value="relation">relation</option>
                    <option value="json">json</option>
                    <option value="datetime">datetime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Initial / Current Value</label>
                  <input
                    type="text"
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    placeholder="e.g. 18500 or active"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Graph Edges (Linked EAV IDs)</label>
                <input
                  type="text"
                  value={graphEdgeInput}
                  onChange={e => setGraphEdgeInput(e.target.value)}
                  placeholder="e.g. eav-001, eav-002"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none font-mono transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Operational purpose and validation rules..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="encrypt-cb"
                  checked={isEncrypted}
                  onChange={e => setIsEncrypted(e.target.checked)}
                  className="accent-violet-500 w-4 h-4 rounded"
                />
                <label htmlFor="encrypt-cb" className="text-slate-300 font-sans cursor-pointer flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Enforce AES-256 On-Device Encryption at Rest
                </label>
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
                  Save Variable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
