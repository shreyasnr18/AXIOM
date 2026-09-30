import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Users, TrendingUp } from 'lucide-react';
import { CanvasNodeConfig } from '../../../types/schema';

interface IngestionNodeData {
  label: string;
  config: CanvasNodeConfig;
  onUpdateConfig?: (updates: Partial<CanvasNodeConfig>) => void;
}

export const CustomerIngestionNode: React.FC<NodeProps<IngestionNodeData>> = memo(({ data, selected }) => {
  const config = data.config || {};
  const volume = config.ingressVolumePerDay ?? 450;
  const orderValue = config.orderValueINR ?? 8500;

  return (
    <div
      className={`min-w-[230px] rounded-2xl p-4 border select-none transition-all duration-200 shadow-xl ${
        selected
          ? 'bg-[#121622] border-cyan-400 ring-2 ring-cyan-400/40 shadow-glow-cyan'
          : 'bg-[#0E1118]/90 border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Customer Ingestion
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
          TRIGGER
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Throughput:</span>
          <span className="text-cyan-300 font-bold">{volume} / day</span>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Avg Value:</span>
          <span className="text-emerald-400 font-bold">₹{orderValue.toLocaleString()}</span>
        </div>

        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/[0.06]">
          <span>{config.leadSource || 'B2B EDI Stream'}</span>
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-[#0B0D13]"
      />
    </div>
  );
});
