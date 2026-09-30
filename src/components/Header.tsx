import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Cpu, 
  Search, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { TabId } from './Sidebar';

interface HeaderProps {
  onSelectTab?: (tab: TabId) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectTab }) => {
  const { 
    blueprint,
    isDirty, 
    isSaving, 
    isTauriActive, 
    saveNow, 
    reloadFromFile,
    saveStatusMessage 
  } = useWorkspace();

  return (
    <header className="h-16 px-8 flex items-center justify-between gap-6 select-none bg-[#08090D]/85 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-50">
      {/* Left: Clean Brand + Active Venture Context */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => onSelectTab && onSelectTab('overview')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white font-black text-sm shadow-glow-purple group-hover:scale-105 transition-transform duration-200">
            ▲
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white text-sm">Axiom</span>
            <span className="text-[10px] text-violet-400 font-mono">Enterprise Core</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/[0.08]">
          <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
            {blueprint.clientInfo.companyName || 'Enterprise Lead'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Center: Command Console Search (Linear / Stripe style) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="w-full relative flex items-center group">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 pointer-events-none group-focus-within:text-violet-400 transition" />
          <input
            type="text"
            readOnly
            placeholder="Search schemas, problem nodes, ledgers... ⌘K"
            className="w-full pl-9 pr-12 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 hover:border-white/[0.12] transition font-sans cursor-pointer"
          />
          <kbd className="absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-slate-400 border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Real Useful Actions Only */}
      <div className="flex items-center gap-3">
        {/* Core Engine Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-mono text-[11px] text-slate-300">
            {isTauriActive ? 'Tauri Rust' : 'DuckDB WASM'}
          </span>
        </div>

        {/* Save Status Message */}
        {saveStatusMessage && (
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{saveStatusMessage}</span>
          </span>
        )}

        {/* Reload Disk Button */}
        <button
          onClick={reloadFromFile}
          title="Reload workspace.axiom from disk"
          className="p-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-slate-400 hover:text-slate-100 transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Primary Action Button: Commit State */}
        <button
          onClick={() => saveNow()}
          disabled={isSaving}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition duration-200 active:scale-95 ${
            isDirty
              ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-glow-purple hover:brightness-110'
              : 'bg-white/[0.05] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08]'
          }`}
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
          )}
          <span>{isSaving ? 'Compiling...' : isDirty ? 'Commit Changes' : 'Synchronized'}</span>
        </button>
      </div>
    </header>
  );
};
