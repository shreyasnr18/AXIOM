import React, { useState, useEffect } from 'react';
import { isolatedRuntimeBroker } from '../services/isolatedRuntimeBroker';
import { biometricAuthGate } from '../services/biometricAuthGate';
import { AlertOctagon, ShieldAlert, KeyRound, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TamperQuarantineModal: React.FC = () => {
  const [quarantineState, setQuarantineState] = useState(isolatedRuntimeBroker.getQuarantineStatus());
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuarantineState(isolatedRuntimeBroker.getQuarantineStatus());
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleBiometricReSeal = async () => {
    setIsResolving(true);
    try {
      await biometricAuthGate.requestBiometricAuthorization(
        'Zero Trust Quarantine Override',
        'Cryptographically re-sealing workspace.axiom and generating fresh Merkle enclave root'
      );
      isolatedRuntimeBroker.liftQuarantine();
      setQuarantineState(isolatedRuntimeBroker.getQuarantineStatus());
    } catch (err) {
      console.warn('Biometric re-seal aborted:', err);
    } finally {
      setIsResolving(false);
    }
  };

  if (!quarantineState.isQuarantined) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-xl bg-[#12070A] border-2 border-rose-500/50 rounded-3xl p-8 shadow-[0_0_80px_rgba(244,63,94,0.3)] space-y-6 relative overflow-hidden"
        >
          {/* Crimson ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-rose-500/20 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  SYSTEM QUARANTINE ENFORCED
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-1">
                Zero Trust Cryptographic Seal Failure
              </h2>
            </div>
          </div>

          {/* Reason Box */}
          <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/20 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Tamper Detection Telemetry</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {quarantineState.reason || 'Cryptographic SHA-256 signature mismatch! External modifications to workspace.axiom detected outside application shell boundary.'}
            </p>
          </div>

          {/* Impact list */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Enforced Security Defenses
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] font-mono text-slate-300">
              <li>SQLite OLTP and DuckDB OLAP database write queues frozen</li>
              <li>AI code compiler streaming threads immediately suspended</li>
              <li>Network telemetry & pipeline execution blocked</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">
              Zero Trust Enclave ID: 0x98FA...E412
            </span>
            <button
              onClick={handleBiometricReSeal}
              disabled={isResolving}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-[0_0_25px_rgba(225,29,72,0.4)]"
            >
              {isResolving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Biometrics...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Biometric Override & Re-Seal</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
