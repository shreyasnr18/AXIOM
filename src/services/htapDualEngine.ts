/**
 * Project Axiom — Hybrid Transactional/Analytical Processing (HTAP) Dual-Engine Driver
 * Enforces strict separation of workload concurrency:
 * - OLTP: Local SQLite Core (row-level user session updates & billing ledger edits with automated CDC triggers)
 * - Inter-Engine: Change Data Capture (CDC) event stream
 */

export interface BillingLedgerRow {
  id: string;
  order_id: string;
  gross_amount: number;
  gateway_fee: number;
  gst_collected: number;
  escrow_held: number;
  net_retained: number;
  status: 'PENDING' | 'CLEARED' | 'HELD_ESCROW' | 'RECONCILED';
  created_at: string;
}

export interface CdcEventPayload {
  id: number;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  row_id: string;
  payload_json: string;
  created_at: string;
  is_synced: number;
}

export interface HtapOltpStats {
  engineType: 'Tauri-Rust-SQLite' | 'WASM-SQLite-RAM';
  totalTransactionsRecorded: number;
  pendingCdcEvents: number;
  dbInitialized: boolean;
}

class HtapDualEngineManager {
  private isInitialized = false;
  private isTauri = false;
  private sqliteWasmDb: any = null;
  private transactionCounter = 0;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if Tauri v2 environment is active
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('htap_init_db');
        this.isTauri = true;
        console.log('[HTAP Dual-Engine] Native Tauri SQLite OLTP core initialized.');
      } else {
        await this.initBrowserSqliteWasm();
        this.isTauri = false;
        console.log('[HTAP Dual-Engine] In-Memory SQLite WASM OLTP core initialized with CDC triggers.');
      }
      this.isInitialized = true;
    } catch (err) {
      console.warn('[HTAP Dual-Engine] Tauri SQLite init fallback to in-memory WASM:', err);
      await this.initBrowserSqliteWasm();
      this.isInitialized = true;
    }
  }

  private async initBrowserSqliteWasm(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        this.setupSimulatedStorageBuffer();
        return;
      }
      // @ts-ignore
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
      this.sqliteWasmDb = new SQL.Database();
      this.setupWasmSchema();
    } catch (e) {
      console.warn('[HTAP Dual-Engine] sql.js load failed, using local simulated storage buffer:', e);
      this.setupSimulatedStorageBuffer();
    }
  }

  private setupWasmSchema(): void {
    if (!this.sqliteWasmDb) return;

    // 1. Transactional Billing Ledger table
    this.sqliteWasmDb.run(`
      CREATE TABLE IF NOT EXISTS billing_ledger (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        gross_amount REAL NOT NULL,
        gateway_fee REAL NOT NULL,
        gst_collected REAL NOT NULL,
        escrow_held REAL NOT NULL,
        net_retained REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 2. Change Data Capture log table
    this.sqliteWasmDb.run(`
      CREATE TABLE IF NOT EXISTS cdc_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        row_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 3. Automated CDC Triggers on billing_ledger
    this.sqliteWasmDb.run(`
      CREATE TRIGGER IF NOT EXISTS trg_billing_ledger_insert
      AFTER INSERT ON billing_ledger
      BEGIN
        INSERT INTO cdc_log (table_name, operation, row_id, payload_json, created_at, is_synced)
        VALUES (
          'billing_ledger',
          'INSERT',
          NEW.id,
          json_object(
            'id', NEW.id,
            'order_id', NEW.order_id,
            'gross_amount', NEW.gross_amount,
            'gateway_fee', NEW.gateway_fee,
            'gst_collected', NEW.gst_collected,
            'escrow_held', NEW.escrow_held,
            'net_retained', NEW.net_retained,
            'status', NEW.status,
            'created_at', NEW.created_at
          ),
          datetime('now'),
          0
        );
      END;
    `);
  }

  private inMemoryFallbackCdc: CdcEventPayload[] = [];
  private inMemoryFallbackLedger: BillingLedgerRow[] = [];

  private setupSimulatedStorageBuffer(): void {
    this.inMemoryFallbackCdc = [];
    this.inMemoryFallbackLedger = [];
  }

  /**
   * OLTP: Records row-level transactional billing ledger write directly to SQLite.
   * Automated trigger writes immediately to cdc_log table.
   */
  public async recordBillingTransaction(entry: BillingLedgerRow): Promise<string> {
    await this.initialize();
    this.transactionCounter++;

    if (this.isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('htap_insert_billing_entry', { entry });
    }

    if (this.sqliteWasmDb) {
      const stmt = this.sqliteWasmDb.prepare(`
        INSERT INTO billing_ledger (id, order_id, gross_amount, gateway_fee, gst_collected, escrow_held, net_retained, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        entry.id,
        entry.order_id,
        entry.gross_amount,
        entry.gateway_fee,
        entry.gst_collected,
        entry.escrow_held,
        entry.net_retained,
        entry.status,
        entry.created_at
      ]);
      stmt.free();
      return entry.id;
    }

    // High-performance fallback buffer
    this.inMemoryFallbackLedger.push(entry);
    const cdcItem: CdcEventPayload = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      table_name: 'billing_ledger',
      operation: 'INSERT',
      row_id: entry.id,
      payload_json: JSON.stringify(entry),
      created_at: new Date().toISOString(),
      is_synced: 0,
    };
    this.inMemoryFallbackCdc.push(cdcItem);
    return entry.id;
  }

  /**
   * CDC Poller: Fetches pending unsynced events from SQLite cdc_log
   */
  public async fetchPendingCdcEvents(limit = 100): Promise<CdcEventPayload[]> {
    await this.initialize();

    if (this.isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('htap_get_cdc_events', { limit });
    }

    if (this.sqliteWasmDb) {
      const res = this.sqliteWasmDb.exec(`
        SELECT id, table_name, operation, row_id, payload_json, created_at, is_synced 
        FROM cdc_log 
        WHERE is_synced = 0 
        ORDER BY id ASC 
        LIMIT ${limit}
      `);

      if (!res || res.length === 0 || !res[0].values) return [];
      return res[0].values.map((r: any[]) => ({
        id: Number(r[0]),
        table_name: String(r[1]),
        operation: r[2] as any,
        row_id: String(r[3]),
        payload_json: String(r[4]),
        created_at: String(r[5]),
        is_synced: Number(r[6]),
      }));
    }

    return this.inMemoryFallbackCdc.filter(e => e.is_synced === 0).slice(0, limit);
  }

  /**
   * CDC Commit: Marks replicated events as synced in SQLite
   */
  public async acknowledgeCdcEvents(eventIds: number[]): Promise<void> {
    if (eventIds.length === 0) return;

    if (this.isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('htap_ack_cdc_events', { eventIds });
      return;
    }

    if (this.sqliteWasmDb) {
      const placeholders = eventIds.map(() => '?').join(',');
      this.sqliteWasmDb.run(`UPDATE cdc_log SET is_synced = 1 WHERE id IN (${placeholders})`, eventIds);
      return;
    }

    for (const id of eventIds) {
      const item = this.inMemoryFallbackCdc.find(e => e.id === id);
      if (item) item.is_synced = 1;
    }
  }

  public getStats(): HtapOltpStats {
    let pending = 0;
    if (this.sqliteWasmDb) {
      try {
        const res = this.sqliteWasmDb.exec('SELECT COUNT(*) FROM cdc_log WHERE is_synced = 0');
        if (res && res[0]?.values) pending = Number(res[0].values[0][0]);
      } catch {
        pending = 0;
      }
    } else {
      pending = this.inMemoryFallbackCdc.filter(e => e.is_synced === 0).length;
    }

    return {
      engineType: this.isTauri ? 'Tauri-Rust-SQLite' : 'WASM-SQLite-RAM',
      totalTransactionsRecorded: this.transactionCounter,
      pendingCdcEvents: pending,
      dbInitialized: this.isInitialized,
    };
  }
}

export const htapDualEngine = new HtapDualEngineManager();
