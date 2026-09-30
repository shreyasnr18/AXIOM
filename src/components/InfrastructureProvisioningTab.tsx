import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { credentialVault, AwsCredentials, VaultStatus } from '../services/credentialVault';
import { iacParserEngine, CompiledIacTemplates } from '../services/iacParserEngine';
import { cloudDeploymentEngine, DeploymentProgressState } from '../services/cloudDeploymentEngine';
import { biometricAuthGate } from '../services/biometricAuthGate';
import { 
  Cloud, 
  Key, 
  ShieldCheck, 
  Server, 
  Database, 
  DollarSign, 
  Globe, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  Lock,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const InfrastructureProvisioningTab: React.FC = () => {
  const { blueprint } = useWorkspace();
  const [selectedIaCLang, setSelectedIaCLang] = useState<'terraform' | 'cloudformation'>('terraform');
  const [copied, setCopied] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Vault credentials form
  const [vaultForm, setVaultForm] = useState<AwsCredentials>({
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: 'ap-south-1',
    awsSessionToken: '',
    accountAlias: 'zenith-prod-account',
    maxMonthlyBudgetUSD: 50.0,
  });

  const [vaultStatus, setVaultStatus] = useState<VaultStatus>({
    provider: 'Host Credential Manager',
    isEncrypted: true,
    hasStoredCredentials: false,
    activeRegion: 'ap-south-1',
    status: 'EMPTY',
  });

  const [deploymentState, setDeploymentState] = useState<DeploymentProgressState>(
    cloudDeploymentEngine.getState()
  );

  const [compiledTemplates, setCompiledTemplates] = useState<CompiledIacTemplates>(
    iacParserEngine.compileInfrastructureTemplates(blueprint, {
      region: vaultForm.awsRegion,
      maxMonthlyBudgetUSD: vaultForm.maxMonthlyBudgetUSD,
    })
  );

  // Load vault status on mount
  useEffect(() => {
    credentialVault.getStatus().then(setVaultStatus);
    credentialVault.getCredentials().then(saved => {
      if (saved) {
        setVaultForm(saved);
        setCompiledTemplates(
          iacParserEngine.compileInfrastructureTemplates(blueprint, {
            region: saved.awsRegion,
            maxMonthlyBudgetUSD: saved.maxMonthlyBudgetUSD,
          })
        );
      }
    });

    const unsubDeployment = cloudDeploymentEngine.subscribe(setDeploymentState);
    return () => unsubDeployment();
  }, [blueprint]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    await credentialVault.storeCredentials(vaultForm);
    const updatedStatus = await credentialVault.getStatus();
    setVaultStatus(updatedStatus);
    setCompiledTemplates(
      iacParserEngine.compileInfrastructureTemplates(blueprint, {
        region: vaultForm.awsRegion,
        maxMonthlyBudgetUSD: vaultForm.maxMonthlyBudgetUSD,
      })
    );
    setShowVaultModal(false);
  };

  const handleClearCredentials = async () => {
    await credentialVault.clearCredentials();
    const updatedStatus = await credentialVault.getStatus();
    setVaultStatus(updatedStatus);
    setVaultForm({
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: 'ap-south-1',
      awsSessionToken: '',
      accountAlias: '',
      maxMonthlyBudgetUSD: 50.0,
    });
  };

  const handleDeploy = async () => {
    try {
      // 1. Enforce continuous biometric gate
      await biometricAuthGate.requestBiometricAuthorization(
        'Authorize AWS Cloud Infrastructure Deployment',
        `Deploying multi-AZ VPC, Aurora Serverless v2, and ECS Fargate containers to ${vaultForm.awsRegion} with $${vaultForm.maxMonthlyBudgetUSD}.00 billing cap`
      );

      // 2. Execute automated deployment loop
      await cloudDeploymentEngine.executeCloudDeployment(
        blueprint,
        vaultForm.maxMonthlyBudgetUSD
      );
    } catch (err: any) {
      console.warn('Deployment aborted or failed:', err);
    }
  };

  const handleCopyCode = () => {
    const code = selectedIaCLang === 'terraform' 
      ? compiledTemplates.terraformHcl 
      : compiledTemplates.cloudFormationYaml;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const code = selectedIaCLang === 'terraform'
      ? compiledTemplates.terraformHcl
      : compiledTemplates.cloudFormationYaml;
    const filename = selectedIaCLang === 'terraform' ? 'main.tf' : 'template.yaml';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCode = selectedIaCLang === 'terraform'
    ? compiledTemplates.terraformHcl
    : compiledTemplates.cloudFormationYaml;

  const isDeploying = deploymentState.stage !== 'IDLE' && deploymentState.stage !== 'LIVE_ACTIVE' && deploymentState.stage !== 'FAILED';

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-[1600px] mx-auto text-slate-100 selection:bg-purple-500/30">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 border-b border-white/[0.06]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-400 font-semibold flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" />
              Automated Infrastructure Provisioning Gateway
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              AWS CloudFormation & Terraform IaC Enclave
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Cloud Provider Orchestration
          </h1>
        </div>

        {/* Primary Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVaultModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-slate-200 font-semibold flex items-center gap-2 transition"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Host Credential Vault</span>
            {vaultStatus.hasStoredCredentials && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold text-white transition flex items-center gap-2 shadow-glow-purple ${
              isDeploying
                ? 'bg-purple-700/60 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95'
            }`}
          >
            {isDeploying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Provisioning Enclave ({deploymentState.percent}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Deploy to AWS Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry Grid: 4 Spacious Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Credential Sandboxing */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-4 h-4 text-cyan-400" />
              Credential Enclave
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {vaultStatus.hasStoredCredentials ? 'Isolated' : 'Pending'}
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight truncate">
              {vaultStatus.provider.split('/')[0]}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              Region: {vaultStatus.activeRegion}
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Storage State:</span>
            <span className="text-emerald-400 font-semibold">Zero-Plaintext Enclave</span>
          </div>
        </div>

        {/* Card 2: Cost Guardrail Alarm */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Cost Guardrail Cap
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Active Alarm
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              ${vaultForm.maxMonthlyBudgetUSD.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/month</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              AWS CloudWatch Billing Metric Alarm
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Estimated Baseline:</span>
            <span className="text-slate-200">${compiledTemplates.estimatedCostBreakdownUSD.totalEstimatedMonthlyUSD}/mo</span>
          </div>
        </div>

        {/* Card 3: Cloud Enclave Topology */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-4 h-4 text-purple-400" />
              Serverless Topology
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Aurora v2
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight">
              Aurora PostgreSQL
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              0.5 - 2.0 ACU Auto-Scaling (RAM)
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>ECS Runtime:</span>
            <span className="text-purple-300 font-semibold">{compiledTemplates.resourceSummary.containersCount} Fargate Tasks</span>
          </div>
        </div>

        {/* Card 4: Live Production Endpoint */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Globe className="w-4 h-4 text-violet-400" />
              Production Endpoint
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              deploymentState.stage === 'LIVE_ACTIVE'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.06] text-slate-400 border-white/[0.08]'
            }`}>
              {deploymentState.stage === 'LIVE_ACTIVE' ? 'LIVE HTTPS' : 'READY'}
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight truncate">
              {deploymentState.liveUrl ? (
                <a
                  href={deploymentState.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-300 hover:text-white flex items-center gap-1.5"
                >
                  <span className="truncate">{deploymentState.liveUrl.replace('https://', '')}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                'Pending Deployment'
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
              ACM TLS 1.3 Wildcard SSL
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Edge Distribution:</span>
            <span className="text-slate-200">CloudFront CDN</span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Grid: IaC Code Inspector + Live Deployment Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: IaC Template Inspector (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-[#090A10]/95 border border-white/[0.06] backdrop-blur-2xl space-y-4 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  Compiled IaC Template
                </span>
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                  <button
                    onClick={() => setSelectedIaCLang('terraform')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                      selectedIaCLang === 'terraform'
                        ? 'bg-purple-600/30 text-purple-200 font-bold border border-purple-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Terraform (main.tf)
                  </button>
                  <button
                    onClick={() => setSelectedIaCLang('cloudformation')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                      selectedIaCLang === 'cloudformation'
                        ? 'bg-purple-600/30 text-purple-200 font-bold border border-purple-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    CloudFormation (YAML)
                  </button>
                </div>
              </div>

              {/* Code Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 font-medium transition flex items-center gap-1.5 border border-white/[0.04]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 font-medium transition flex items-center gap-1.5 border border-white/[0.04]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Code Output Viewer */}
            <div className="relative min-h-[440px] max-h-[580px] flex flex-col">
              <pre className="flex-1 overflow-auto no-scrollbar font-mono text-xs leading-relaxed text-slate-200 bg-black/60 p-4 rounded-2xl border border-white/[0.03] select-text selection:bg-purple-600/30">
                {activeCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Live Deployment Automation Terminal (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-[#090A10]/95 border border-white/[0.06] backdrop-blur-2xl space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white">
                  Deployment Automation Loop
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Elapsed: {deploymentState.elapsedSeconds}s
              </span>
            </div>

            {/* Current Milestone Status Banner */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-purple-300 font-semibold">
                  Progress: {deploymentState.percent}%
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {deploymentState.stage.replace('STAGE_', 'STEP ')}
                </span>
              </div>
              <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-600 to-cyan-500"
                  style={{ width: `${deploymentState.percent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[11px] text-slate-300 font-mono pt-1">
                {deploymentState.currentMilestoneText}
              </p>
            </div>

            {/* Live Production URL Box (Appears when LIVE_ACTIVE) */}
            {deploymentState.liveUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 shadow-glow-emerald"
              >
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Live Application Deployed & Verified</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/20 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-white truncate">
                    {deploymentState.liveUrl}
                  </span>
                  <a
                    href={deploymentState.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )}

            {/* Real-time Milestone Event Logs */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Execution Milestone Event Stream
              </div>
              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.04] max-h-64 overflow-y-auto no-scrollbar font-mono text-[11px] space-y-2">
                {deploymentState.logs.length === 0 ? (
                  <span className="text-slate-600 italic">
                    // Awaiting deployment dispatch...
                  </span>
                ) : (
                  deploymentState.logs.map((log, idx) => (
                    <div key={idx} className="space-y-0.5 leading-relaxed">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{log.timestamp}</span>
                        <span className={`px-1.5 rounded text-[9px] uppercase font-bold ${
                          log.level === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : log.level === 'error'
                            ? 'bg-rose-500/20 text-rose-300'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-white/[0.06] text-slate-400'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <p className={`text-slate-200 ${
                        log.level === 'success' ? 'text-emerald-300' : ''
                      }`}>
                        {log.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Host Credential Vault Dialog Modal */}
      {showVaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="stakent-glass border border-white/[0.12] max-w-lg w-full rounded-3xl p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Key className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Host Credential Vault
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {vaultStatus.provider}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowVaultModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  required
                  value={vaultForm.awsAccessKeyId}
                  onChange={e => setVaultForm({ ...vaultForm, awsAccessKeyId: e.target.value })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  required
                  value={vaultForm.awsSecretAccessKey}
                  onChange={e => setVaultForm({ ...vaultForm, awsSecretAccessKey: e.target.value })}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Target Region
                  </label>
                  <select
                    value={vaultForm.awsRegion}
                    onChange={e => setVaultForm({ ...vaultForm, awsRegion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#11141D] border border-white/[0.1] text-white font-mono outline-none"
                  >
                    <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                    <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Monthly Budget Cap (USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={vaultForm.maxMonthlyBudgetUSD}
                    onChange={e => setVaultForm({ ...vaultForm, maxMonthlyBudgetUSD: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-mono outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Security Shield Callout */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
                <div className="font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Hardware-Encrypted Sandboxing Active
                </div>
                <p className="leading-relaxed">
                  Credentials are encrypted and stored inside host OS password manager memory boundaries. They are never written as plaintext to localStorage or disk.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                {vaultStatus.hasStoredCredentials ? (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono transition"
                  >
                    Purge Vault
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVaultModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs hover:brightness-110 shadow-glow-cyan transition"
                  >
                    Save to Host Enclave
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
