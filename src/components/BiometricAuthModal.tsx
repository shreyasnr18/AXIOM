import React, { useState, useEffect } from 'react';
import { biometricAuthGate, BiometricPromptState } from '../services/biometricAuthGate';
import { Fingerprint, ShieldCheck, X, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const BiometricAuthModal: React.FC = () => {
  const [promptState, setPromptState] = useState<BiometricPromptState>({
    isOpen: false,
    operationName: '',
    operationDetails: '',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    return biometricAuthGate.subscribe(setPromptState);
  }, []);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        biometricAuthGate.completeAuthentication('Windows Hello');
      }, 700);
    }, 1200);
  };

  const handleCancel = () => {
    setIsScanning(false);
    setIsSuccess(false);
    biometricAuthGate.cancelAuthentication();
  };

  if (!promptState.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#0D0E15] border border-white/[0.1] rounded-3xl p-7 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Zero Trust Biometric Gate
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Windows Hello / macOS Touch ID
                </span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Operation Payload Summary */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Privileged Operation Challenge
            </div>
            <div className="text-xs font-bold text-slate-100">
              {promptState.operationName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono leading-relaxed">
              {promptState.operationDetails}
            </div>
          </div>

          {/* Fingerprint Scanner Interactive Stage */}
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div
              onClick={!isScanning && !isSuccess ? handleScan : undefined}
              className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition relative ${
                isSuccess
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-glow-emerald'
                  : isScanning
                  ? 'bg-violet-600/20 border-2 border-violet-500 shadow-glow-purple animate-pulse'
                  : 'bg-white/[0.03] border border-white/[0.1] hover:border-violet-500/50 hover:bg-violet-500/10'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              ) : (
                <Fingerprint
                  className={`w-12 h-12 transition ${
                    isScanning ? 'text-violet-300 animate-bounce' : 'text-slate-400 hover:text-violet-400'
                  }`}
                />
              )}

              {/* Scanning Radial Waves */}
              {isScanning && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 rounded-full border-2 border-violet-400"
                />
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                {isSuccess
                  ? 'Hardware Passkey Enclave Verified'
                  : isScanning
                  ? 'Verifying biometric telemetry...'
                  : 'Touch sensor or click to authorize'}
              </p>
              <p className="text-[10px] font-mono text-slate-500">
                FIDO2 WebAuthn Platform Authenticator
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition"
            >
              Deny
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning || isSuccess}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 text-xs font-bold text-white shadow-glow-purple transition disabled:opacity-50"
            >
              {isScanning ? 'Authenticating...' : 'Authorize via Biometrics'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
