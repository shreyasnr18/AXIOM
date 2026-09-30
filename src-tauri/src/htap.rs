use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

pub struct HtapDatabaseState {
    pub conn: Mutex<Option<Connection>>,
}

impl Default for HtapDatabaseState {
    fn default() -> Self {
        Self {
            conn: Mutex::new(None),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CdcEvent {
    pub id: i64,
    pub table_name: String,
    pub operation: String,
    pub row_id: String,
    pub payload_json: String,
    pub created_at: String,
    pub is_synced: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BillingLedgerEntry {
    pub id: String,
    pub order_id: String,
    pub gross_amount: f64,
    pub gateway_fee: f64,
    pub gst_collected: f64,
    pub escrow_held: f64,
    pub net_retained: f64,
    pub status: String,
    pub created_at: String,
}

/// Initializes local SQLite database with OLTP tables and automated CDC triggers
pub fn init_htap_schema(conn: &Connection) -> Result<()> {
    // 1. Transactional Billing Ledger
    conn.execute(
        "CREATE TABLE IF NOT EXISTS billing_ledger (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            gross_amount REAL NOT NULL,
            gateway_fee REAL NOT NULL,
            gst_collected REAL NOT NULL,
            escrow_held REAL NOT NULL,
            net_retained REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // 2. User Session & Operational Events
    conn.execute(
        "CREATE TABLE IF NOT EXISTS session_events (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // 3. Node Configurations
    conn.execute(
        "CREATE TABLE IF NOT EXISTS node_configurations (
            node_id TEXT PRIMARY KEY,
            node_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 4. Change Data Capture (CDC) Log Table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cdc_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            operation TEXT NOT NULL,
            row_id TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_synced INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // 5. Automated Triggers for CDC: Billing Ledger
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS trg_billing_ledger_insert
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
        END;",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS trg_billing_ledger_update
        AFTER UPDATE ON billing_ledger
        BEGIN
            INSERT INTO cdc_log (table_name, operation, row_id, payload_json, created_at, is_synced)
            VALUES (
                'billing_ledger', 
                'UPDATE', 
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
        END;",
        [],
    )?;

    // 6. Automated Triggers for CDC: Node Configurations
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS trg_node_configs_upsert
        AFTER INSERT ON node_configurations
        BEGIN
            INSERT INTO cdc_log (table_name, operation, row_id, payload_json, created_at, is_synced)
            VALUES (
                'node_configurations',
                'INSERT',
                NEW.node_id,
                json_object(
                    'node_id', NEW.node_id,
                    'node_type', NEW.node_type,
                    'config_json', NEW.config_json,
                    'updated_at', NEW.updated_at
                ),
                datetime('now'),
                0
            );
        END;",
        [],
    )?;

    Ok(())
}

#[tauri::command]
pub fn htap_init_db(
    app_handle: tauri::AppHandle,
    state: State<'_, HtapDatabaseState>,
) -> Result<String, String> {
    let mut lock = state.conn.lock().map_err(|e| e.to_string())?;
    
    // In Tauri, initialize local SQLite file inside workspace/data
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    
    let db_path = app_dir.join("axiom_oltp.sqlite");
    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open SQLite database: {}", e))?;
    
    init_htap_schema(&conn).map_err(|e| format!("Failed to initialize schema: {}", e))?;
    *lock = Some(conn);

    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn htap_insert_billing_entry(
    entry: BillingLedgerEntry,
    state: State<'_, HtapDatabaseState>,
) -> Result<String, String> {
    let lock = state.conn.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or_else(|| "Database not initialized".to_string())?;

    conn.execute(
        "INSERT INTO billing_ledger (id, order_id, gross_amount, gateway_fee, gst_collected, escrow_held, net_retained, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            entry.id,
            entry.order_id,
            entry.gross_amount,
            entry.gateway_fee,
            entry.gst_collected,
            entry.escrow_held,
            entry.net_retained,
            entry.status,
            entry.created_at
        ],
    ).map_err(|e| format!("Insert error: {}", e))?;

    Ok(entry.id)
}

#[tauri::command]
pub fn htap_get_cdc_events(
    limit: i64,
    state: State<'_, HtapDatabaseState>,
) -> Result<Vec<CdcEvent>, String> {
    let lock = state.conn.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or_else(|| "Database not initialized".to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, table_name, operation, row_id, payload_json, created_at, is_synced FROM cdc_log WHERE is_synced = 0 ORDER BY id ASC LIMIT ?1")
        .map_err(|e| e.to_string())?;

    let event_iter = stmt
        .query_map(params![limit], |row| {
            Ok(CdcEvent {
                id: row.get(0)?,
                table_name: row.get(1)?,
                operation: row.get(2)?,
                row_id: row.get(3)?,
                payload_json: row.get(4)?,
                created_at: row.get(5)?,
                is_synced: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut events = Vec::new();
    for event in event_iter {
        events.push(event.map_err(|e| e.to_string())?);
    }

    Ok(events)
}

#[tauri::command]
pub fn htap_ack_cdc_events(
    event_ids: Vec<i64>,
    state: State<'_, HtapDatabaseState>,
) -> Result<usize, String> {
    let lock = state.conn.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or_else(|| "Database not initialized".to_string())?;

    if event_ids.is_empty() {
        return Ok(0);
    }

    let placeholders = event_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let query = format!("UPDATE cdc_log SET is_synced = 1 WHERE id IN ({})", placeholders);

    let params_from_iter = rusqlite::params_from_iter(event_ids.iter());
    let updated = conn.execute(&query, params_from_iter).map_err(|e| e.to_string())?;

    Ok(updated)
}
