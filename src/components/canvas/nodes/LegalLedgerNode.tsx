import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Shield, CheckCircle2 } from 'lucide-react';
import { CanvasNodeConfig } from '../../../types/schema';

interface LegalNodeData {
  label: string;
  config: CanvasNodeConfig;
  onUpdateConfig?: (updates: Partial<CanvasNodeConfig>) => void;
}

export const LegalLedgerNode: React.FC<NodeProps<LegalNodeData>> = memo(({ data, selected }) => {
  const config = data.config || {};
  const seal = config.complianceSeal || 'MCA-VERIFIED-L2';
  const isVerified = config.auditVerified ?? true;

  return (
    <div
      className={`min-w-[230px] rounded-2xl p-4 border select-none transition-all duration-200 shadow-xl ${
        selected
          ? 'bg-[#121622] border-violet-400 ring-2 ring-violet-400/40 shadow-glow-purple'
          : 'bg-[#0E1118]/90 border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-[#0B0D13]"
      />

      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Legal Ledger
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
          GOVERN
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="text-[11px] text-slate-400 truncate" title={seal}>
          Seal: <span className="text-violet-300 font-bold">{seal}</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1 border-t border-white/[0.06]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isVerified ? 'ZTA Audit Verified' : 'Audit Pending'}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-[#0B0D13]"
      />
    </div>
  );
});
