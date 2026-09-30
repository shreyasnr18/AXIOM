/**
 * Project Axiom — Financial Simulation Worker
 * High-speed pure TypeScript worker calculating payment fees, runway burn, and GST tax brackets.
 */

import { analyticalEngine, FinancialMetrics, AnalyticalTelemetry } from './analyticalEngine';
import { WorkflowCanvasNode } from '../types/schema';

export interface SimulationState {
  metrics: FinancialMetrics;
  telemetry: AnalyticalTelemetry;
  flowVelocity: number; // 0.5 to 3.0 animation speed modifier
  flowActive: boolean;
}

type SimulationListener = (state: SimulationState) => void;

class FinancialSimulationWorker {
  private listeners: Set<SimulationListener> = new Set();
  private currentState: SimulationState;

  constructor() {
    const initialMetrics = analyticalEngine.executeFinancialAggregation();
    this.currentState = {
      metrics: initialMetrics,
      telemetry: analyticalEngine.getTelemetry(),
      flowVelocity: 1.0,
      flowActive: true,
    };
  }

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Recalculates metrics based on active visual canvas nodes
   */
  public updateFromCanvasNodes(nodes: WorkflowCanvasNode[]) {
    // Extract parameters from nodes
    const ingestNode = nodes.find(n => n.type === 'customerIngestion');
    const taxNode = nodes.find(n => n.type === 'taxCalculator');
    const bankNode = nodes.find(n => n.type === 'bankingGateway');

    const dailyVolume = ingestNode?.data.config.ingressVolumePerDay ?? 450;
    const orderValue = ingestNode?.data.config.orderValueINR ?? 8500;
    const gstRate = taxNode?.data.config.gstRate ?? 18;
    const isInterState = taxNode?.data.config.isInterState ?? true;
    const mdrPct = bankNode?.data.config.gatewayMdrPct ?? 1.85;
    const escrowPct = bankNode?.data.config.escrowHoldbackPct ?? 10;

    const metrics = analyticalEngine.executeFinancialAggregation(
      dailyVolume,
      orderValue,
      gstRate,
      isInterState,
      mdrPct,
      escrowPct
    );

    // Calculate animation velocity based on order throughput
    const normalizedVolume = Math.min(Math.max(dailyVolume / 300, 0.5), 2.5);

    this.currentState = {
      metrics,
      telemetry: analyticalEngine.getTelemetry(),
      flowVelocity: Number(normalizedVolume.toFixed(2)),
      flowActive: dailyVolume > 0,
    };

    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentState));
  }

  public getState(): SimulationState {
    return this.currentState;
  }
}

export const financialSimulationWorker = new FinancialSimulationWorker();
