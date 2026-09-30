import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Calculator } from 'lucide-react';
import { CanvasNodeConfig } from '../../../types/schema';

interface TaxNodeData {
  label: string;
  config: CanvasNodeConfig;
  onUpdateConfig?: (updates: Partial<CanvasNodeConfig>) => void;
}

export const TaxCalculatorNode: React.FC<NodeProps<TaxNodeData>> = memo(({ data, selected }) => {
  const config = data.config || {};
  const currentRate = config.gstRate ?? 18;
  const isInterState = config.isInterState ?? true;

  return (
    <div
      className={`min-w-[230px] rounded-2xl p-4 border select-none transition-all duration-200 shadow-xl ${
        selected
          ? 'bg-[#121622] border-amber-400 ring-2 ring-amber-400/40 shadow-glow-amber'
          : 'bg-[#0E1118]/90 border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#0B0D13]"
      />

      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Tax Calculator
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
          GST RULES
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">GST Tariff:</span>
          <span className="text-amber-400 font-bold">{currentRate}%</span>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Territory:</span>
          <span className="text-white font-bold">
            {isInterState ? 'IGST (Inter-State)' : 'CGST+SGST'}
          </span>
        </div>

        <div className="pt-2 text-[10px] text-slate-400 border-t border-white/[0.06] truncate">
          HSN: <span className="text-slate-200 font-bold">{config.hsnSacCode || '996511'}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#0B0D13]"
      />
    </div>
  );
});
