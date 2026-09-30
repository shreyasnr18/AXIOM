import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  FileCheck2,
  HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';

export const BlueprintJsonTab: React.FC = () => {
  const { blueprint, filePath } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(blueprint, null, 2);
  const fileSizeKB = (new Blob([formattedJson]).size / 1024).toFixed(2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace.axiom';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header (Stakent Style) */}
      <div className="stakent-glass p-6 lg:p-7 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-glow-purple">
                <FileCode className="w-4 h-4" />
              </span>
              Blueprint Compiler & Schema Inspector
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
              workspace.axiom
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Real-time reflection of the complete state schema compiled for local-first on-device execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-violet-400" />
            <span>Size: {fileSizeKB} KB</span>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-mono flex items-center gap-2 transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 text-white text-xs font-mono font-bold flex items-center gap-2 transition shadow-glow-purple active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .axiom</span>
          </button>
        </div>
      </div>

      {/* Code Viewer (macOS / Stakent Dark Glass Window) */}
      <div className="stakent-glass rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-white/[0.03] px-6 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2.5 text-slate-400">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-slate-200 font-semibold">{filePath}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Schema Integrity Validated</span>
          </div>
        </div>

        <pre className="p-6 text-xs font-mono text-emerald-300 bg-[#080A0E]/90 overflow-x-auto max-h-[600px] leading-relaxed select-text">
          <code>{formattedJson}</code>
        </pre>
      </div>
    </motion.div>
  );
};
