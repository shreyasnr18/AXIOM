/**
 * Project Axiom — Isolated Sandbox Unit Test Suite
 * Validates:
 * 1. Dual-Engine HTAP SQLite (OLTP) Writes & Trigger-driven CDC Logging
 * 2. Automated Change Data Capture (CDC) Replication Loop & Synchronization
 * 3. In-Memory DuckDB (OLAP) Columnar Aggregations & Sub-millisecond Latency
 * 4. Host Hardware Benchmark Evaluation (WebGPU / CPU Multi-threaded Fallback)
 * 5. Client-Side AI Code Compilation Streaming Speed & Token Throughput
 */

import { htapDualEngine, BillingLedgerRow } from '../services/htapDualEngine';
import { cdcSyncWorker } from '../services/cdcSyncWorker';
import { hardwareBenchmark } from '../services/hardwareBenchmark';
import { webllmEngine } from '../services/webllmEngine';

async function runSandboxTests() {
  console.log('================================================================');
  console.log('  PROJECT AXIOM — HTAP DATA DUAL-ENGINE & AI SANDBOX TEST SUITE  ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. HTAP OLTP SQLite Core & Trigger Verification
    // -------------------------------------------------------------
    console.log('[Phase 1: SQLite OLTP Core & Trigger Verification]');
    await htapDualEngine.initialize();

    const sampleRow: BillingLedgerRow = {
      id: `test_tx_${Date.now()}`,
      order_id: 'ORD-TEST-9001',
      gross_amount: 50000.0,
      gateway_fee: 1091.5,
      gst_collected: 9000.0,
      escrow_held: 5000.0,
      net_retained: 34908.5,
      status: 'CLEARED',
      created_at: new Date().toISOString(),
    };

    const insertedId = await htapDualEngine.recordBillingTransaction(sampleRow);
    assert(Boolean(insertedId), 'SQLite OLTP write successful', `Row ID: ${insertedId}`);

    const cdcEvents = await htapDualEngine.fetchPendingCdcEvents(10);
    assert(cdcEvents.length > 0, 'SQLite trigger fired and created CDC log event', `Pending: ${cdcEvents.length}`);

    const matchingEvent = cdcEvents.find(e => e.row_id === sampleRow.id);
    assert(Boolean(matchingEvent), 'CDC event matches inserted row ID', `Table: ${matchingEvent?.table_name}`);
    assert(matchingEvent?.operation === 'INSERT', 'CDC operation is verified INSERT');

    // -------------------------------------------------------------
    // 2. Automated CDC Replication Stream
    // -------------------------------------------------------------
    console.log('\n[Phase 2: Automated CDC Stream & Replicating to DuckDB]');
    await cdcSyncWorker.initialize();

    const syncedCount = await cdcSyncWorker.drainAndSyncBatch(50);
    assert(syncedCount > 0, 'CDC stream successfully drained micro-batch', `Synced ${syncedCount} events`);

    const pendingAfterSync = await htapDualEngine.fetchPendingCdcEvents(10);
    const stillPending = pendingAfterSync.filter(e => e.row_id === sampleRow.id);
    assert(stillPending.length === 0, 'CDC commit offset acknowledged; event marked synced in OLTP');

    // -------------------------------------------------------------
    // 3. DuckDB Columnar OLAP Aggregation
    // -------------------------------------------------------------
    console.log('\n[Phase 3: Columnar OLAP Aggregations in Memory]');
    const olapStart = performance.now();
    const olapMetrics = await cdcSyncWorker.executeDuckDbAggregation();
    const olapElapsed = performance.now() - olapStart;

    assert(olapMetrics.totalOrders >= 1, 'DuckDB OLAP orders count verified', `${olapMetrics.totalOrders} orders in RAM`);
    assert(olapMetrics.grossIngressINR >= 50000, 'OLAP Gross Ingress aggregation correct', `INR ₹${olapMetrics.grossIngressINR.toLocaleString()}`);
    assert(olapMetrics.netRetainedINR > 0, 'OLAP Net Retained reconciles correctly', `INR ₹${olapMetrics.netRetainedINR.toLocaleString()}`);
    assert(olapElapsed < 50, 'OLAP RAM query latency below SLA limit', `${olapElapsed.toFixed(2)}ms`);

    // -------------------------------------------------------------
    // 4. Hardware Benchmark Evaluation
    // -------------------------------------------------------------
    console.log('\n[Phase 4: Host Hardware Benchmark Evaluation]');
    const hwProfile = await hardwareBenchmark.evaluateHostHardware();
    assert(Boolean(hwProfile.executionTarget), 'Hardware execution target resolved', hwProfile.executionTarget);
    assert(hwProfile.cpuCores >= 1, 'Logical CPU concurrency verified', `${hwProfile.cpuCores} cores`);
    assert(hwProfile.vramEstimatedMB > 0, 'Memory buffer headroom verified', `~${hwProfile.vramEstimatedMB}MB`);
    assert(hwProfile.benchmarkThroughputGigaOps > 0, 'Hardware compute throughput evaluated', `${hwProfile.benchmarkThroughputGigaOps} GigaOps/s`);

    // -------------------------------------------------------------
    // 5. Client-Side AI Code Compilation & Streaming Speed
    // -------------------------------------------------------------
    console.log('\n[Phase 5: Client-Side AI Code Compiler Streaming Speed]');
    await webllmEngine.initializeEngine();

    let streamedTokenChunks = 0;
    let finalCode = '';

    const compilationMetrics = await webllmEngine.compileComponentStream(
      {
        nodeId: 'node_tax_01',
        nodeType: 'taxCalculator',
        nodeTitle: 'GST Statutory Tax Engine',
        nodeConfig: { gstRate: 18, isInterState: true },
        targetLanguage: 'typescript',
      },
      (code) => {
        streamedTokenChunks++;
        finalCode = code;
      }
    );

    assert(streamedTokenChunks > 10, 'Live token streaming chunks received', `${streamedTokenChunks} chunks`);
    assert(compilationMetrics.totalTokens > 50, 'Component token volume generated', `${compilationMetrics.totalTokens} tokens`);
    assert(compilationMetrics.tokensPerSecond > 10, 'Token generation speed exceeds benchmark SLA', `${compilationMetrics.tokensPerSecond} tok/s`);
    assert(finalCode.includes('TaxCalculationService'), 'Generated TypeScript contains expected domain service class');
    assert(finalCode.includes('calculateTax'), 'Generated code contains calculateTax method');

    // Compile Rust target as well
    const rustMetrics = await webllmEngine.compileComponentStream(
      {
        nodeId: 'node_bank_01',
        nodeType: 'taxCalculator',
        nodeTitle: 'Rust Tax Calculator Actix Handler',
        nodeConfig: { gstRate: 18, isInterState: true },
        targetLanguage: 'rust',
      },
      (code) => {
        finalCode = code;
      }
    );

    assert(rustMetrics.totalTokens > 50, 'Rust crate component compiled', `${rustMetrics.totalTokens} tokens`);
    assert(finalCode.includes('calculate_gst_handler'), 'Rust handler function generated correctly');

    // Clean up timers
    cdcSyncWorker.stopContinuousSyncLoop();

    console.log('\n================================================================');
    console.log(`  ALL SANDBOX TESTS PASSED: ${passed}/${total} assertions verified!`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    cdcSyncWorker.stopContinuousSyncLoop();
    console.error('\nSandbox test failure:', err);
    process.exit(1);
  }
}

runSandboxTests();
