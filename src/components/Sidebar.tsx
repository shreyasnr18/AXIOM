import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  LayoutDashboard, 
  Network, 
  AlertTriangle, 
  Database, 
  GitCommit, 
  FileCode,
  Building2,
  Lock,
  ArrowUpRight,
  Terminal,
  Cloud
} from 'lucide-react';
import { motion } from 'framer-motion';

export type TabId = 'canvas' | 'overview' | 'compiler' | 'infrastructure' | 'client' | 'problems' | 'eav' | 'checkpoints' | 'json';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { blueprint } = useWorkspace();

  const navItems = [
    {
      id: 'overview' as TabId,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'canvas' as TabId,
      label: 'Pipeline Studio',
      icon: Network,
      badge: `${blueprint.workflowCanvas?.nodes?.length ?? 5} nodes`,
      badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    },
    {
      id: 'compiler' as TabId,
      label: 'AI Compiler Studio',
      icon: Terminal,
      badge: 'Qwen-2.5',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    {
      id: 'infrastructure' as TabId,
      label: 'Cloud Infrastructure',
      icon: Cloud,
      badge: 'AWS IaC',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },
    {
      id: 'problems' as TabId,
      label: 'Problem Nodes',
      icon: AlertTriangle,
      badge: `${blueprint.problemNodes.length}`,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'eav' as TabId,
      label: 'EAV Schema',
      icon: Database,
      badge: `${blueprint.dataSchemaAttributes.length}`,
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },
    {
      id: 'checkpoints' as TabId,
      label: 'ZTA Milestones',
      icon: GitCommit,
      badge: `${blueprint.milestoneCheckpoints.length}`,
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    {
      id: 'client' as TabId,
      label: 'Enterprise Profile',
      icon: Building2,
      badge: blueprint.clientInfo.baseCurrency,
      badgeColor: 'bg-white/5 text-slate-300 border-white/10',
    },
    {
      id: 'json' as TabId,
      label: 'workspace.axiom',
      icon: FileCode,
      badge: 'JSON',
      badgeColor: 'bg-white/5 text-slate-400 border-white/10',
      isExternalLike: true
    },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between shrink-0 select-none h-[calc(100vh-4rem)] sticky top-16 bg-[#08090D]/90 backdrop-blur-xl border-r border-white/[0.06] overflow-y-auto no-scrollbar">
      {/* Navigation Links with Generous Spacing */}
      <div className="p-4 space-y-6">
        <div className="px-3 pt-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Platform Navigation
        </div>

        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition duration-150 group relative ${
                  isActive
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
                }`}
              >
                {/* Active left indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidePill"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-violet-500 shadow-glow-purple"
                  />
                )}

                <div className="flex items-center gap-3">
                  <Icon 
                    className={`w-4 h-4 transition duration-150 ${
                      isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`} 
                  />
                  <span>{item.label}</span>
                  {item.isExternalLike && (
                    <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                  )}
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Minimal Vitals & Security Anchor */}
      <div className="p-4 border-t border-white/[0.06] bg-[#07080C] space-y-3">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Gross Ingress</span>
            <span className="text-white font-semibold">₹42.08L</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Vendor Escrow</span>
            <span className="text-purple-300 font-semibold">₹8.45L</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Capital Runway</span>
            <span className="text-emerald-400 font-semibold">18.4 Mo</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono px-1">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            Zero-Trust Core
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            ACTIVE
          </span>
        </div>
      </div>
    </aside>
  );
};
