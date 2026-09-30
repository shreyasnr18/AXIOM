import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ClientInfo, OperationalTier } from '../types/schema';
import { Building2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClientInfoTab: React.FC = () => {
  const { blueprint, updateClientInfo } = useWorkspace();
  const client = blueprint.clientInfo;

  const handleChange = (field: keyof ClientInfo, value: any) => {
    updateClientInfo({ [field]: value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header card (Stakent Style) */}
      <div className="stakent-glass p-6 lg:p-7 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-glow-purple">
              <Building2 className="w-4 h-4" />
            </span>
            Client & Enterprise Profile
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Root schema block: Governs legal entity taxonomy, localized tax jurisdiction, and operational tiering.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
          <Award className="w-4 h-4 text-violet-400" />
          <span className="text-slate-400">Current Tier:</span>
          <span className="text-violet-300 font-semibold">{client.operationalTier}</span>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Name */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Registered Company / Venture Name
          </label>
          <input
            type="text"
            value={client.companyName}
            onChange={e => handleChange('companyName', e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:border-violet-500 outline-none transition font-medium"
            placeholder="e.g. Zenith Multi-Modal Logistics Pvt Ltd"
          />
        </div>

        {/* Legal Entity Type */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Legal Entity Structure
          </label>
          <select
            value={client.legalEntityType}
            onChange={e => handleChange('legalEntityType', e.target.value as any)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#11141D] border border-white/[0.1] text-white text-sm focus:border-violet-500 outline-none transition"
          >
            <option value="Private Limited">Private Limited (Pvt Ltd)</option>
            <option value="Public Limited">Public Limited</option>
            <option value="LLC">Limited Liability Company (LLC)</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership / LLP</option>
          </select>
        </div>

        {/* Tax Identifier / GSTIN */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Tax Identifier (GSTIN / EIN)
            </label>
            <span className="text-[10px] text-violet-400 font-mono">Indian GST / US IRS Compliant</span>
          </div>
          <input
            type="text"
            value={client.taxIdentifier}
            onChange={e => handleChange('taxIdentifier', e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white font-mono text-sm focus:border-violet-500 outline-none transition uppercase"
            placeholder="e.g. 27AABCZ9988P1ZN"
          />
        </div>

        {/* Jurisdiction */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Operational Jurisdiction & Regulatory Framework
          </label>
          <input
            type="text"
            value={client.jurisdiction}
            onChange={e => handleChange('jurisdiction', e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:border-violet-500 outline-none transition"
            placeholder="e.g. India (GST & MCA Framework)"
          />
        </div>

        {/* Operational Tier */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Operational Scale Tier
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Solo Founder', 'Growth Scale', 'Global Enterprise'] as OperationalTier[]).map(tier => (
              <button
                key={tier}
                type="button"
                onClick={() => handleChange('operationalTier', tier)}
                className={`py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all duration-200 border ${
                  client.operationalTier === tier
                    ? 'bg-violet-600 text-white border-violet-500 shadow-glow-purple'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Base Currency */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Primary Operating Currency
          </label>
          <div className="grid grid-cols-6 gap-2">
            {(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'] as const).map(curr => (
              <button
                key={curr}
                type="button"
                onClick={() => handleChange('baseCurrency', curr)}
                className={`py-2 rounded-xl font-mono text-xs font-bold border transition ${
                  client.baseCurrency === curr
                    ? 'bg-violet-600 text-white border-violet-500 shadow-glow-purple'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Industry Segment */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Primary Industry Domain
          </label>
          <input
            type="text"
            value={client.primaryIndustry}
            onChange={e => handleChange('primaryIndustry', e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:border-violet-500 outline-none transition"
            placeholder="e.g. Intermodal Freight & Supply Chain Tech"
          />
        </div>

        {/* Contact Email & HQ */}
        <div className="stakent-glass p-6 rounded-3xl space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Internal Operations Contact & HQ
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="email"
              value={client.contactEmail}
              onChange={e => handleChange('contactEmail', e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white text-xs focus:border-violet-500 outline-none transition"
              placeholder="operations@internal.corp"
            />
            <input
              type="text"
              value={client.hqLocation}
              onChange={e => handleChange('hqLocation', e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white text-xs focus:border-violet-500 outline-none transition"
              placeholder="HQ City, State, Country"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
