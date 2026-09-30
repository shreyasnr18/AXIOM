import React, { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { WorkspaceCanvas } from './components/canvas/WorkspaceCanvas';
import { OverviewTab } from './components/OverviewTab';
import { ClientInfoTab } from './components/ClientInfoTab';
import { ProblemNodesTab } from './components/ProblemNodesTab';
import { EAVAttributesTab } from './components/EAVAttributesTab';
import { MilestoneCheckpointsTab } from './components/MilestoneCheckpointsTab';
import { BlueprintJsonTab } from './components/BlueprintJsonTab';
import { CompilerStudioTab } from './components/CompilerStudioTab';
import { InfrastructureProvisioningTab } from './components/InfrastructureProvisioningTab';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import { TamperQuarantineModal } from './components/TamperQuarantineModal';
import { motion, AnimatePresence } from 'framer-motion';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center space-y-4 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.15),transparent_70%)] pointer-events-none" />
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-glow-purple animate-pulse">
          ▲
        </div>
        <div className="flex flex-col items-center gap-1 z-10">
          <p className="text-xs font-mono text-slate-300 tracking-widest uppercase font-semibold">
            AXIOM HTAP KERNEL
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Booting Polymorphic Core Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-slate-100 flex flex-col overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-purple-600/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[300px] bg-indigo-600/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Stakent-Inspired Navigation Header */}
      <Header onSelectTab={setActiveTab} />

      {/* Main Stakent Console Layout (Sidebar + Fluid Content Area) */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Dynamic Center Workspace with Apple-grade smooth invisible scrolling */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#08090D] scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-full pb-24"
            >
              {activeTab === 'canvas' && <WorkspaceCanvas />}
              {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
              {activeTab === 'compiler' && <CompilerStudioTab />}
              {activeTab === 'infrastructure' && <InfrastructureProvisioningTab />}
              {activeTab === 'client' && <div className="p-6 lg:p-8 max-w-7xl mx-auto"><ClientInfoTab /></div>}
              {activeTab === 'problems' && <div className="p-6 lg:p-8 max-w-7xl mx-auto"><ProblemNodesTab /></div>}
              {activeTab === 'eav' && <div className="p-6 lg:p-8 max-w-7xl mx-auto"><EAVAttributesTab /></div>}
              {activeTab === 'checkpoints' && <div className="p-6 lg:p-8 max-w-7xl mx-auto"><MilestoneCheckpointsTab /></div>}
              {activeTab === 'json' && <div className="p-6 lg:p-8 max-w-7xl mx-auto"><BlueprintJsonTab /></div>}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Zero Trust Continuous Biometric Gate Modal */}
      <BiometricAuthModal />

      {/* Zero Trust Cryptographic Tamper Quarantine Screen */}
      <TamperQuarantineModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
};

export default App;
