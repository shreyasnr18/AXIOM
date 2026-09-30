import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Landmark, Lock } from 'lucide-react';
import { CanvasNodeConfig } from '../../../types/schema';

interface BankingNodeData {
  label: string;
  config: CanvasNodeConfig;
  onUpdateConfig?: (updates: Partial<CanvasNodeConfig>) => void;
}

export const BankingGatewayNode: React.FC<NodeProps<BankingNodeData>> = memo(({ data, selected }) => {
  const config = data.config || {};
  const gateway = config.settlementGateway || 'Razorpay / HDFC Escrow';
  const mdr = config.gatewayMdrPct ?? 1.85;
  const escrowPct = config.escrowHoldbackPct ?? 10;

  return (
    <div
      className={`min-w-[230px] rounded-2xl p-4 border select-none transition-all duration-200 shadow-xl ${
        selected
          ? 'bg-[#121622] border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow-emerald'
          : 'bg-[#0E1118]/90 border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0B0D13]"
      />

      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Banking Gateway
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
          SETTLE
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Gateway MDR:</span>
          <span className="text-emerald-400 font-bold">{mdr}%</span>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Escrow Reserve:</span>
          <span className="text-amber-400 font-bold">{escrowPct}%</span>
        </div>

        <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 border-t border-white/[0.06]">
          <span className="flex items-center gap-1.5 truncate max-w-[140px]" title={gateway}>
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{gateway}</span>
          </span>
          <span className="text-white font-bold px-1.5 py-0.5 rounded bg-white/[0.06]">T+1</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0B0D13]"
      />
    </div>
  );
});
