import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  NodeMouseHandler
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkspace } from '../../context/WorkspaceContext';
import { DEFAULT_WORKSPACE_AXIOM } from '../../types/schema';
import { CustomerIngestionNode } from './nodes/CustomerIngestionNode';
import { FulfillmentPipelineNode } from './nodes/FulfillmentPipelineNode';
import { LegalLedgerNode } from './nodes/LegalLedgerNode';
import { TaxCalculatorNode } from './nodes/TaxCalculatorNode';
import { BankingGatewayNode } from './nodes/BankingGatewayNode';
import { AnimatedTokenEdge } from './AnimatedTokenEdge';
import { financialSimulationWorker, SimulationState } from '../../services/financialSimulationWorker';
import { 
  Users, 
  Truck, 
  Shield, 
  Calculator, 
  Landmark, 
  Play, 
  CloudUpload,
  Search,
  TrendingUp,
  Cpu,
  Sparkles
} from 'lucide-react';

export const WorkspaceCanvas: React.FC = () => {
  const { blueprint, updateCanvasNodeConfig, updateCanvasLayout, addCanvasNode, saveNow } = useWorkspace();
  const canvasData = (blueprint.workflowCanvas && blueprint.workflowCanvas.nodes?.length > 0)
    ? blueprint.workflowCanvas
    : DEFAULT_WORKSPACE_AXIOM.workflowCanvas;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-ingestion');
  const [activePipelineStage, setActivePipelineStage] = useState<'BUILD' | 'TEST' | 'LIVE'>('BUILD');
  const [simulation, setSimulation] = useState<SimulationState>(() => financialSimulationWorker.getState());

  useEffect(() => {
    const unsubscribe = financialSimulationWorker.subscribe(state => {
      setSimulation(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (canvasData.nodes) {
      financialSimulationWorker.updateFromCanvasNodes(canvasData.nodes);
    }
  }, [canvasData.nodes]);

  const nodeTypes = useMemo(() => ({
    customerIngestion: CustomerIngestionNode,
    fulfillmentPipeline: FulfillmentPipelineNode,
    legalLedger: LegalLedgerNode,
    taxCalculator: TaxCalculatorNode,
    bankingGateway: BankingGatewayNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    tokenStream: AnimatedTokenEdge,
  }), []);

  const initialNodes: Node[] = useMemo(() => {
    return (canvasData.nodes || []).map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        onUpdateConfig: (updates: any) => {
          updateCanvasNodeConfig(node.id, updates);
        }
      }
    }));
  }, [canvasData.nodes, updateCanvasNodeConfig]);

  const initialEdges: Edge[] = useMemo(() => {
    return (canvasData.edges || []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'tokenStream',
      animated: edge.animated ?? true,
      data: {
        tokenType: edge.data?.tokenType || 'currency',
        speed: simulation.flowVelocity,
        flowRatePerHour: edge.data?.flowRatePerHour || 450,
      }
    }));
  }, [canvasData.edges, simulation.flowVelocity]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const newEdge: Edge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        type: 'tokenStream',
        animated: true,
        data: { tokenType: 'currency', speed: 2, flowRatePerHour: 450 }
      };
      const updated = addEdge(newEdge, eds);
      updateCanvasLayout(
        nodes.map(n => ({ id: n.id, type: n.type as any, position: n.position, data: n.data })),
        updated.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, data: e.data as any }))
      );
      return updated;
    });
  }, [nodes, setEdges, updateCanvasLayout]);

  const onNodeDragStop = useCallback(() => {
    updateCanvasLayout(
      nodes.map(n => ({ id: n.id, type: n.type as any, position: n.position, data: n.data })),
      edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, data: e.data as any }))
    );
  }, [nodes, edges, updateCanvasLayout]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  const { metrics, telemetry } = simulation;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#08090D] text-slate-200 select-none">
      {/* Top Studio Command Bar (Stakent Style) */}
      <div className="h-14 px-6 bg-[#0B0D13]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">
            PIPELINES / DISPATCH-ESCROW-RECONCILER
          </span>
          <span className="text-slate-600">/</span>
          <span className="font-bold text-white text-xs flex items-center gap-2">
            Inbound Operational Workflow
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/15 text-violet-300 border border-violet-500/30">
              v1.2 • DuckDB
            </span>
          </span>
        </div>

        {/* Step Progression Pills (BUILD - TEST - LIVE) */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
          {(['BUILD', 'TEST', 'LIVE'] as const).map(step => (
            <button
              key={step}
              onClick={() => setActivePipelineStage(step)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                activePipelineStage === step
                  ? 'bg-violet-600 text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All branches active</span>
          </div>

          <button
            onClick={() => {
              financialSimulationWorker.updateFromCanvasNodes(canvasData.nodes);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 flex items-center gap-1.5 transition font-semibold active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>Run Test</span>
          </button>

          <button
            onClick={() => saveNow()}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 text-white font-bold flex items-center gap-1.5 transition shadow-glow-purple active:scale-95"
          >
            <CloudUpload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Deploy</span>
          </button>
        </div>
      </div>

      {/* Telemetry Ribbon (Stakent Style Glass Cards) */}
      <div className="bg-[#0B0D13]/60 backdrop-blur-md border-b border-white/[0.06] px-6 py-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Monthly Gross</span>
          <div className="text-xs font-mono font-bold text-white">
            ₹{(metrics.grossIngressINR / 100000).toFixed(2)} Lakhs
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Gateway Fee (MDR)</span>
          <div className="text-xs font-mono font-bold text-amber-400">
            ₹{(metrics.paymentGatewayFeeINR / 1000).toFixed(1)}k <span className="text-[9px] text-slate-500">(18% GST)</span>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-slate-400 uppercase">GST Accrued</span>
          <div className="text-xs font-mono font-bold text-cyan-300">
            ₹{(metrics.gstCollectedINR / 100000).toFixed(2)}L <span className="text-[9px] text-slate-500">{metrics.igstINR > 0 ? 'IGST' : 'CGST+SGST'}</span>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Escrow Pool</span>
          <div className="text-xs font-mono font-bold text-purple-300">
            ₹{(metrics.vendorEscrowHeldINR / 100000).toFixed(2)} Lakhs
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Monthly Burn</span>
          <div className="text-xs font-mono font-bold text-rose-400">
            ₹{(metrics.monthlyBurnRateINR / 100000).toFixed(2)} Lakhs
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Runway Factor</span>
            <div className="text-xs font-mono font-bold text-emerald-400">
              {metrics.projectedRunwayMonths} Months
            </div>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Main Studio Body (3 Columns: Left Node Palette | Center Canvas | Right Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Node Palette Drawer (Stakent Style) */}
        <div className="w-64 bg-[#0B0D13]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Add Pipeline Node
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search blocks..."
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-mono">
            {/* Group 1: Triggers */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1">
                Ingress & Triggers
              </span>
              <button
                onClick={() => addCanvasNode('customerIngestion', { x: 80, y: 150 })}
                className="w-full p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.14] text-left transition flex items-center gap-3 active:scale-98"
              >
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Customer Ingestion</div>
                  <div className="text-[10px] text-slate-400 font-sans">Order webhook intake</div>
                </div>
              </button>
            </div>

            {/* Group 2: Fulfillment & Operations */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1">
                Pipeline Logic
              </span>
              <button
                onClick={() => addCanvasNode('fulfillmentPipeline', { x: 380, y: 150 })}
                className="w-full p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.14] text-left transition flex items-center gap-3 active:scale-98"
              >
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Fulfillment Pipeline</div>
                  <div className="text-[10px] text-slate-400 font-sans">Queue dispatch & SLA</div>
                </div>
              </button>

              <button
                onClick={() => addCanvasNode('legalLedger', { x: 680, y: 50 })}
                className="w-full p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.14] text-left transition flex items-center gap-3 active:scale-98"
              >
                <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Legal Ledger</div>
                  <div className="text-[10px] text-slate-400 font-sans">ZTA compliance seal</div>
                </div>
              </button>
            </div>

            {/* Group 3: Financial Settlements */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1">
                Financial Gates
              </span>
              <button
                onClick={() => addCanvasNode('taxCalculator', { x: 680, y: 260 })}
                className="w-full p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.14] text-left transition flex items-center gap-3 active:scale-98"
              >
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Tax Calculator</div>
                  <div className="text-[10px] text-slate-400 font-sans">GST 18% / HSN schedule</div>
                </div>
              </button>

              <button
                onClick={() => addCanvasNode('bankingGateway', { x: 980, y: 150 })}
                className="w-full p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.14] text-left transition flex items-center gap-3 active:scale-98"
              >
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Banking Gateway</div>
                  <div className="text-[10px] text-slate-400 font-sans">Escrow & MDR fee split</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: React Flow Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#080A0F]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={1.5} 
              color="rgba(255, 255, 255, 0.08)" 
            />
            <Controls className="bg-[#11141D] border border-white/[0.08]" />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'customerIngestion': return '#06B6D4';
                  case 'fulfillmentPipeline': return '#38BDF8';
                  case 'legalLedger': return '#8B5CF6';
                  case 'taxCalculator': return '#F59E0B';
                  case 'bankingGateway': return '#10B981';
                  default: return '#64748B';
                }
              }}
              maskColor="rgba(8, 10, 15, 0.9)"
              className="bg-[#0B0D13] border border-white/[0.08] rounded-2xl"
            />

            {/* Bottom Engine Telemetry Pill */}
            <Panel position="bottom-left" className="px-4 py-1.5 rounded-full bg-[#0E1118]/90 backdrop-blur-md border border-white/[0.08] flex items-center gap-3 text-[11px] font-mono shadow-lg">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>DuckDB WASM Core</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Latency: {telemetry.queryLatencyMs}ms</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">State: {metrics.grossIngressINR > 0 ? 'Active Stream' : 'Idle'}</span>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Column: Node Inspector & Parameter Drawer (Stakent Style) */}
        <div className="w-80 bg-[#0B0D13]/80 backdrop-blur-xl border-l border-white/[0.06] flex flex-col shrink-0 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">INSPECTOR</span>
              <h3 className="text-xs font-bold text-white">{selectedNode?.data?.label || 'Selected Node'}</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-slate-300 border border-white/[0.08]">
              {selectedNode?.id}
            </span>
          </div>

          {/* Node Config Editor */}
          {selectedNode?.type === 'customerIngestion' && (
            <div className="space-y-3.5 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Daily Order Volume</span>
                <div className="flex justify-between items-center text-sm font-bold text-cyan-400">
                  <span>{selectedNode.data.config.ingressVolumePerDay || 450} orders / day</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={selectedNode.data.config.ingressVolumePerDay || 450}
                  onChange={e => updateCanvasNodeConfig(selectedNode.id, { ingressVolumePerDay: Number(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Consignment Unit Value</span>
                <div className="flex justify-between items-center text-sm font-bold text-emerald-400">
                  <span>₹{(selectedNode.data.config.orderValueINR || 8500).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={selectedNode.data.config.orderValueINR || 8500}
                  onChange={e => updateCanvasNodeConfig(selectedNode.id, { orderValueINR: Number(e.target.value) })}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
          )}

          {selectedNode?.type === 'taxCalculator' && (
            <div className="space-y-3.5 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">GST Rate Schedule</span>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {([5, 12, 18, 28] as const).map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => updateCanvasNodeConfig(selectedNode.id, { gstRate: rate })}
                      className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                        (selectedNode.data.config.gstRate || 18) === rate
                          ? 'bg-violet-600 text-white border-violet-500 shadow-glow-purple'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Territory Tax Boundary</span>
                <button
                  type="button"
                  onClick={() => updateCanvasNodeConfig(selectedNode.id, { isInterState: !selectedNode.data.config.isInterState })}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200 text-xs font-bold hover:border-violet-500 transition flex items-center justify-between"
                >
                  <span>Supply Boundary:</span>
                  <span className="text-amber-400">
                    {selectedNode.data.config.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {selectedNode?.type === 'bankingGateway' && (
            <div className="space-y-3.5 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Gateway MDR Fee</span>
                <div className="flex justify-between items-center text-sm font-bold text-amber-400">
                  <span>{selectedNode.data.config.gatewayMdrPct || 1.85}% + GST</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.05"
                  value={selectedNode.data.config.gatewayMdrPct || 1.85}
                  onChange={e => updateCanvasNodeConfig(selectedNode.id, { gatewayMdrPct: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Escrow Reserve Holdback</span>
                <div className="flex justify-between items-center text-sm font-bold text-purple-400">
                  <span>{selectedNode.data.config.escrowHoldbackPct || 10}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={selectedNode.data.config.escrowHoldbackPct || 10}
                  onChange={e => updateCanvasNodeConfig(selectedNode.id, { escrowHoldbackPct: Number(e.target.value) })}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>
          )}

          {/* Test Run Execution Card */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>LIVE TEST RECORD</span>
              <span className="text-emerald-400">PINNED SAMPLE</span>
            </div>
            <div className="text-white font-bold text-xs">
              Consignment #AXM-9482
            </div>
            <div className="text-slate-400 text-[11px]">
              Gross Value: ₹{((selectedNode?.data?.config?.orderValueINR || 8500) * 2).toLocaleString()}
            </div>
            <div className="text-slate-500 text-[10px]">
              Destination: Mumbai Dock → Delhi NCR Transit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
