import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Truck, Clock } from 'lucide-react';
import { CanvasNodeConfig } from '../../../types/schema';

interface FulfillmentNodeData {
  label: string;
  config: CanvasNodeConfig;
  onUpdateConfig?: (updates: Partial<CanvasNodeConfig>) => void;
}

export const FulfillmentPipelineNode: React.FC<NodeProps<FulfillmentNodeData>> = memo(({ data, selected }) => {
  const config = data.config || {};
  const handlingMinutes = config.handlingMinutes ?? 12;
  const slaPct = config.slaAdherencePct ?? 98.4;
  const queueCount = config.activeQueueCount ?? 38;

  return (
    <div
      className={`min-w-[230px] rounded-2xl p-4 border select-none transition-all duration-200 shadow-xl ${
        selected
          ? 'bg-[#121622] border-sky-400 ring-2 ring-sky-400/40 shadow-glow-cyan'
          : 'bg-[#0E1118]/90 border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0B0D13]"
      />

      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Fulfillment Queue
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
          LOGIC
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">SLA Adherence:</span>
          <span className="text-emerald-400 font-bold">{slaPct}%</span>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Handling:
          </span>
          <span className="text-slate-200 font-bold">{handlingMinutes} mins</span>
        </div>

        <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 border-t border-white/[0.06]">
          <span>Queue Load:</span>
          <span className="text-sky-300 font-bold">{queueCount} units</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0B0D13]"
      />
    </div>
  );
});
