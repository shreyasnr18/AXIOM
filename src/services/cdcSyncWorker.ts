/**
 * Project Axiom — Change Data Capture (CDC) Replication Worker
 * Enforces strict HTAP workload concurrency:
 * 1. Polls pending mutation events from SQLite's automated trigger-driven `cdc_log` (OLTP)
 * 2. Streams and bulk-ingests row mutations into in-memory DuckDB columnar core (OLAP)
 * 3. Commits replication offset and computes real-time replication lag
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import { htapDualEngine, BillingLedgerRow, CdcEventPayload } from './htapDualEngine';

export interface DuckDbAggregateMetrics {
  totalOrders: number;
  grossIngressINR: number;
  gatewayFeesINR: number;
  gstCollectedINR: number;
  escrowHeldINR: number;
  netRetainedINR: number;
  avgOrderValueINR: number;
  queryLatencyMs: number;
  timestamp: string;
}

export interface CdcSyncStatus {
  isRunning: boolean;
  totalEventsSynced: number;
  currentReplicationLagMs: number;
  duckDbRowCount: number;
  lastSyncAt: string | null;
  engineStatus: 'DuckDB-WASM-Active' | 'Columnar-RAM-Active' | 'Booting';
}

type SyncStatusListener = (status: CdcSyncStatus) => void;

class CdcSyncWorkerManager {
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private isInitializing = false;
  private isInitialized = false;
  private isRunning = false;
  private pollIntervalTimer: any = null;
  private listeners: Set<SyncStatusListener> = new Set();

  // Columnar In-Memory storage mirror for ultra-resilient zero-dependency execution
  private columnarLedgerMirror: Map<string, BillingLedgerRow> = new Map();

  private status: CdcSyncStatus = {
    isRunning: false,
    totalEventsSynced: 0,
    currentReplicationLagMs: 0,
    duckDbRowCount: 0,
    lastSyncAt: null,
    engineStatus: 'Booting',
  };

  public async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // Ensure SQLite OLTP core is booted first
      await htapDualEngine.initialize();

      // Attempt to load DuckDB WASM bundle
      if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
        try {
          const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
          const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

          const workerBlob = new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' });
          const workerUrl = URL.createObjectURL(workerBlob);
          const worker = new Worker(workerUrl);

          const logger = new duckdb.VoidLogger();
          this.db = new duckdb.AsyncDuckDB(logger, worker);
          await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
          URL.revokeObjectURL(workerUrl);

          this.conn = await this.db.connect();

          // Create OLAP analytical columnar table in DuckDB
          await this.conn.query(`
            CREATE TABLE IF NOT EXISTS duckdb_billing_ledger (
              id VARCHAR PRIMARY KEY,
              order_id VARCHAR,
              gross_amount DOUBLE,
              gateway_fee DOUBLE,
              gst_collected DOUBLE,
              escrow_held DOUBLE,
              net_retained DOUBLE,
              status VARCHAR,
              created_at VARCHAR
            );
          `);

          this.status.engineStatus = 'DuckDB-WASM-Active';
          console.log('[CDC-Sync-Worker] DuckDB WASM OLAP core online.');
        } catch (duckDbErr) {
          console.warn('[CDC-Sync-Worker] DuckDB WASM worker instantiation fallback to columnar RAM:', duckDbErr);
          this.status.engineStatus = 'Columnar-RAM-Active';
        }
      } else {
        this.status.engineStatus = 'Columnar-RAM-Active';
      }

      this.isInitialized = true;
      this.isInitializing = false;

      // Seed initial baseline transactions in SQLite OLTP to initiate the stream
      await this.seedBaselineTransactions();

      // Start the automated CDC streaming loop
      this.startContinuousSyncLoop();
    } catch (err) {
      console.error('[CDC-Sync-Worker] Initialization failure:', err);
      this.status.engineStatus = 'Columnar-RAM-Active';
      this.isInitialized = true;
      this.isInitializing = false;
      this.startContinuousSyncLoop();
    }
  }

  /**
   * Seeds realistic initial orders directly into the SQLite OLTP ledger.
   * This proves real transactional ingress flowing through triggers into cdc_log.
   */
  private async seedBaselineTransactions(): Promise<void> {
    const existingEvents = await htapDualEngine.fetchPendingCdcEvents(1);
    if (existingEvents.length > 0 || this.columnarLedgerMirror.size > 0) return;

    const initialOrders: BillingLedgerRow[] = [
      {
        id: 'tx_seed_101',
        order_id: 'ORD-9821',
        gross_amount: 14500.0,
        gateway_fee: 316.5,
        gst_collected: 2610.0,
        escrow_held: 1450.0,
        net_retained: 10123.5,
        status: 'CLEARED',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'tx_seed_102',
        order_id: 'ORD-9822',
        gross_amount: 28900.0,
        gateway_fee: 630.88,
        gst_collected: 5202.0,
        escrow_held: 2890.0,
        net_retained: 20177.12,
        status: 'CLEARED',
        created_at: new Date(Date.now() - 2400000).toISOString(),
      },
      {
        id: 'tx_seed_103',
        order_id: 'ORD-9823',
        gross_amount: 8200.0,
        gateway_fee: 179.0,
        gst_collected: 1476.0,
        escrow_held: 820.0,
        net_retained: 5725.0,
        status: 'CLEARED',
        created_at: new Date(Date.now() - 1200000).toISOString(),
      },
    ];

    for (const order of initialOrders) {
      await htapDualEngine.recordBillingTransaction(order);
    }
  }

  /**
   * Continuous micro-batching poller that drains SQLite cdc_log and streams mutations into DuckDB.
   */
  public startContinuousSyncLoop(intervalMs = 200): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.status.isRunning = true;

    this.pollIntervalTimer = setInterval(async () => {
      await this.drainAndSyncBatch();
    }, intervalMs);

    console.log(`[CDC-Sync-Worker] Continuous CDC stream active (interval: ${intervalMs}ms).`);
  }

  public stopContinuousSyncLoop(): void {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
    this.isRunning = false;
    this.status.isRunning = false;
    this.notify();
  }

  /**
   * Replicates one micro-batch from SQLite OLTP to DuckDB OLAP
   */
  public async drainAndSyncBatch(batchLimit = 100): Promise<number> {
    const syncStart = performance.now();
    try {
      const pendingEvents: CdcEventPayload[] = await htapDualEngine.fetchPendingCdcEvents(batchLimit);
      if (pendingEvents.length === 0) return 0;

      const acknowledgedIds: number[] = [];

      for (const event of pendingEvents) {
        if (event.table_name === 'billing_ledger') {
          try {
            const rowData: BillingLedgerRow = JSON.parse(event.payload_json);

            // Update Columnar RAM Mirror
            this.columnarLedgerMirror.set(rowData.id, rowData);

            // Update DuckDB WASM if active
            if (this.conn) {
              const sanitizedOrderId = rowData.order_id.replace(/'/g, "''");
              const sanitizedStatus = rowData.status.replace(/'/g, "''");
              const sanitizedCreatedAt = rowData.created_at.replace(/'/g, "''");

              await this.conn.query(`
                INSERT OR REPLACE INTO duckdb_billing_ledger 
                VALUES (
                  '${rowData.id}', 
                  '${sanitizedOrderId}', 
                  ${rowData.gross_amount}, 
                  ${rowData.gateway_fee}, 
                  ${rowData.gst_collected}, 
                  ${rowData.escrow_held}, 
                  ${rowData.net_retained}, 
                  '${sanitizedStatus}', 
                  '${sanitizedCreatedAt}'
                );
              `);
            }

            acknowledgedIds.push(event.id);
          } catch (parseErr) {
            console.error('[CDC-Sync-Worker] Error parsing CDC payload:', parseErr);
            acknowledgedIds.push(event.id); // discard corrupted event
          }
        }
      }

      // Mark replicated events as synced in SQLite OLTP
      if (acknowledgedIds.length > 0) {
        await htapDualEngine.acknowledgeCdcEvents(acknowledgedIds);
      }

      // Update replication telemetry
      const syncLag = Number((performance.now() - syncStart).toFixed(2));
      this.status.totalEventsSynced += acknowledgedIds.length;
      this.status.currentReplicationLagMs = syncLag;
      this.status.duckDbRowCount = this.columnarLedgerMirror.size;
      this.status.lastSyncAt = new Date().toISOString();
      this.notify();

      return acknowledgedIds.length;
    } catch (err) {
      console.warn('[CDC-Sync-Worker] Batch sync error:', err);
      return 0;
    }
  }

  /**
   * High-throughput OLTP Ingress: Writes directly to SQLite, immediately replicated via CDC.
   */
  public async ingestRowLevelTransaction(entry: Partial<BillingLedgerRow> & { gross_amount: number }): Promise<string> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const gross = entry.gross_amount;
    const fee = entry.gateway_fee ?? Number(((gross * 0.0185) * 1.18).toFixed(2));
    const gst = entry.gst_collected ?? Number((gross * 0.18).toFixed(2));
    const escrow = entry.escrow_held ?? Number((gross * 0.10).toFixed(2));
    const net = Number((gross - fee - gst - escrow).toFixed(2));

    const fullRow: BillingLedgerRow = {
      id,
      order_id: entry.order_id ?? `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      gross_amount: gross,
      gateway_fee: fee,
      gst_collected: gst,
      escrow_held: escrow,
      net_retained: net,
      status: entry.status ?? 'CLEARED',
      created_at: entry.created_at ?? new Date().toISOString(),
    };

    // OLTP Write to SQLite
    const rowId = await htapDualEngine.recordBillingTransaction(fullRow);

    // Eagerly trigger immediate micro-sync for ultra-low latency response
    setTimeout(() => this.drainAndSyncBatch(10), 10);

    return rowId;
  }

  /**
   * OLAP Columnar Aggregation Query:
   * Runs analytical aggregation directly on replicated DuckDB in-memory tables.
   */
  public async executeDuckDbAggregation(): Promise<DuckDbAggregateMetrics> {
    const start = performance.now();

    // Query native DuckDB WASM if online
    if (this.conn) {
      try {
        const result = await this.conn.query(`
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(gross_amount), 0.0) as gross_ingress,
            COALESCE(SUM(gateway_fee), 0.0) as gateway_fees,
            COALESCE(SUM(gst_collected), 0.0) as gst_collected,
            COALESCE(SUM(escrow_held), 0.0) as escrow_held,
            COALESCE(SUM(net_retained), 0.0) as net_retained,
            COALESCE(AVG(gross_amount), 0.0) as avg_order_val
          FROM duckdb_billing_ledger;
        `);

        const rows = result.toArray();
        if (rows.length > 0) {
          const r = rows[0];
          const queryLatencyMs = Number((performance.now() - start).toFixed(3));
          return {
            totalOrders: Number(r.total_orders ?? 0),
            grossIngressINR: Math.round(Number(r.gross_ingress ?? 0)),
            gatewayFeesINR: Math.round(Number(r.gateway_fees ?? 0)),
            gstCollectedINR: Math.round(Number(r.gst_collected ?? 0)),
            escrowHeldINR: Math.round(Number(r.escrow_held ?? 0)),
            netRetainedINR: Math.round(Number(r.net_retained ?? 0)),
            avgOrderValueINR: Math.round(Number(r.avg_order_val ?? 0)),
            queryLatencyMs,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('[CDC-Sync-Worker] DuckDB query error, using fast columnar RAM aggregator:', e);
      }
    }

    // High-performance columnar RAM mirror calculation
    let gross = 0;
    let fee = 0;
    let gst = 0;
    let escrow = 0;
    let net = 0;
    const count = this.columnarLedgerMirror.size;

    for (const r of this.columnarLedgerMirror.values()) {
      gross += r.gross_amount;
      fee += r.gateway_fee;
      gst += r.gst_collected;
      escrow += r.escrow_held;
      net += r.net_retained;
    }

    const queryLatencyMs = Number((performance.now() - start).toFixed(3));
    return {
      totalOrders: count,
      grossIngressINR: Math.round(gross),
      gatewayFeesINR: Math.round(fee),
      gstCollectedINR: Math.round(gst),
      escrowHeldINR: Math.round(escrow),
      netRetainedINR: Math.round(net),
      avgOrderValueINR: count > 0 ? Math.round(gross / count) : 0,
      queryLatencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  public getStatus(): CdcSyncStatus {
    return { ...this.status };
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => fn({ ...this.status }));
  }
}

export const cdcSyncWorker = new CdcSyncWorkerManager();
