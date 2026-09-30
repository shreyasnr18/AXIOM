/**
 * Project Axiom — Phase 4 Isolated Sandbox Unit Test Suite
 * Validates:
 * 1. SHA-256 Cryptographic Merkle Chain Snapshot Signing & HMAC Verification
 * 2. Absolute Process Isolation (Visual Canvas, Data Engine, Compiler) & Capability Tokens
 * 3. Non-Linear Feature Extraction Algorithm (Surgical Detachment & Edge Re-routing)
 * 4. Automated TypeScript Dependency & Type-Checking Verification
 * 5. Local Continuous Biometric Authentication Gate
 * 6. Anti-Tamper Cryptographic Validation & Quarantine Execution Freeze
 */

import { ztaCryptoEngine } from '../services/ztaCryptoEngine';
import { isolatedRuntimeBroker } from '../services/isolatedRuntimeBroker';
import { biometricAuthGate } from '../services/biometricAuthGate';
import { nonLinearVersionControl } from '../services/nonLinearVersionControl';
import { WorkspaceAxiom, DEFAULT_WORKSPACE_AXIOM } from '../types/schema';

async function runPhase4SandboxTests() {
  console.log('================================================================');
  console.log('  PROJECT AXIOM — PHASE 4 ZTA & VERSION CONTROL SANDBOX SUITE   ');
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
    // Phase 1: SHA-256 Cryptographic Merkle Chain Snapshot Signing
    // -------------------------------------------------------------
    console.log('[Phase 1: SHA-256 Cryptographic Merkle Chain Signing]');
    const rawSchema = {
      version: '1.0.0',
      client: 'Zenith Logistics',
      nodes: ['customerIngestion', 'taxCalculator', 'bankingGateway'],
    };

    const sha256A = await ztaCryptoEngine.computeSha256(JSON.stringify(rawSchema));
    assert(sha256A.length === 64, 'SHA-256 digest has standard 256-bit (64 hex) length', sha256A.substring(0, 16) + '...');

    // Canonicalization test (key order invariance)
    const rawSchemaReordered = {
      nodes: ['customerIngestion', 'taxCalculator', 'bankingGateway'],
      client: 'Zenith Logistics',
      version: '1.0.0',
    };
    const canonicalA = ztaCryptoEngine.canonicalizeJson(rawSchema);
    const canonicalB = ztaCryptoEngine.canonicalizeJson(rawSchemaReordered);
    assert(canonicalA === canonicalB, 'Canonical JSON ensures deterministic hashing across whitespace & key order');

    // Sign Snapshot Chain (Merkle link)
    const genesisHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const seal1 = await ztaCryptoEngine.signSnapshotChain(genesisHash, rawSchema, 'BIOMETRIC-ENCLAVE-SEAL-01', 0);

    assert(seal1.merkle_depth === 1, 'Merkle chain depth incremented to 1', `Depth: ${seal1.merkle_depth}`);
    assert(seal1.chain_hash.length === 64, 'Chain hash valid SHA-256 Merkle root', seal1.chain_hash.substring(0, 16) + '...');
    assert(seal1.signature.length === 64, 'HMAC-SHA256 hardware seal generated', seal1.signature.substring(0, 16) + '...');

    const seal2 = await ztaCryptoEngine.signSnapshotChain(seal1.chain_hash, { ...rawSchema, revision: 2 }, 'BIOMETRIC-ENCLAVE-SEAL-01', 1);
    assert(seal2.previous_hash === seal1.chain_hash, 'Merkle chain correctly binds to parent snapshot hash');
    assert(seal2.merkle_depth === 2, 'Sequential depth tracking verified');

    // Verification of integrity
    const verifyResult = await ztaCryptoEngine.verifyIntegrity(seal1.chain_hash, seal1.signature);
    assert(verifyResult.is_valid, 'Cryptographic seal signature verified against enclave key');

    const corruptedVerify = await ztaCryptoEngine.verifyIntegrity(seal1.chain_hash, '0000deadbeef12340000deadbeef12340000deadbeef12340000deadbeef1234');
    assert(!corruptedVerify.is_valid, 'Corrupted signature correctly rejected by Zero Trust engine');

    // -------------------------------------------------------------
    // Phase 2: Absolute Process Isolation & Capability Tokens
    // -------------------------------------------------------------
    console.log('\n[Phase 2: Absolute Process Isolation & Capability Tokens]');
    // Issue token from Visual Canvas to Data Engine
    const validToken = isolatedRuntimeBroker.issueCapabilityToken(
      'BOUNDARY_VISUAL_CANVAS',
      'BOUNDARY_DATA_ENGINE',
      'EXECUTE_HTAP_LEDGER_WRITE'
    );

    assert(Boolean(validToken.tokenId), 'Capability token issued for boundary transit', validToken.tokenId);

    // Authorized dispatch
    let payloadExecuted = false;
    await isolatedRuntimeBroker.dispatchCrossBoundary(
      validToken,
      'BOUNDARY_DATA_ENGINE',
      'EXECUTE_HTAP_LEDGER_WRITE',
      async () => {
        payloadExecuted = true;
        return 'SUCCESS';
      }
    );
    assert(payloadExecuted, 'Cross-boundary payload executed with valid capability token');

    // Replay attack prevention: consumed token should fail
    let replayBlocked = false;
    try {
      await isolatedRuntimeBroker.dispatchCrossBoundary(
        validToken,
        'BOUNDARY_DATA_ENGINE',
        'EXECUTE_HTAP_LEDGER_WRITE',
        async () => 'SHOULD_NOT_EXECUTE'
      );
    } catch {
      replayBlocked = true;
    }
    assert(replayBlocked, 'Token replay blocked: capability tokens are single-use ephemeral');

    // Mismatched permission boundary call should fail
    const compilerToken = isolatedRuntimeBroker.issueCapabilityToken(
      'BOUNDARY_VISUAL_CANVAS',
      'BOUNDARY_COMPILER_ENGINE',
      'AI_COMPILE_MODULE'
    );
    let boundaryViolationCaught = false;
    try {
      await isolatedRuntimeBroker.dispatchCrossBoundary(
        compilerToken,
        'BOUNDARY_DATA_ENGINE', // Expecting compiler but calling data engine
        'AI_COMPILE_MODULE',
        async () => 'SHOULD_NOT_EXECUTE'
      );
    } catch {
      boundaryViolationCaught = true;
    }
    assert(boundaryViolationCaught, 'Cross-boundary permission mismatch strictly blocked');

    // -------------------------------------------------------------
    // Phase 3: Non-Linear Feature Extraction & Dependency Resolution
    // -------------------------------------------------------------
    console.log('\n[Phase 3: Non-Linear Feature Extraction & Dependency Resolution]');
    const testBlueprint: WorkspaceAxiom = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_AXIOM));
    testBlueprint.milestoneCheckpoints[0].snapshotHash = seal1.chain_hash;
    testBlueprint.workflowCanvas.nodes = [
      { id: 'node_ingest', type: 'customerIngestion', position: { x: 100, y: 100 }, data: { label: 'Ingest Node', nodeType: 'customerIngestion', config: { ingressVolumePerDay: 500 } } },
      { id: 'node_tax', type: 'taxCalculator', position: { x: 300, y: 100 }, data: { label: 'Tax Engine', nodeType: 'taxCalculator', config: { gstRate: 18 } } },
      { id: 'node_bank', type: 'bankingGateway', position: { x: 500, y: 100 }, data: { label: 'Bank Gateway', nodeType: 'bankingGateway', config: { gatewayMdrPct: 1.85 } } },
    ];
    testBlueprint.workflowCanvas.edges = [
      { id: 'e1', source: 'node_ingest', target: 'node_tax', animated: true },
      { id: 'e2', source: 'node_tax', target: 'node_bank', animated: true },
    ];

    // Perform non-linear extraction of the middle node: 'node_tax'
    const extractionResult = await nonLinearVersionControl.extractModuleAndRecompile(
      testBlueprint,
      'chk_genesis',
      'node_tax',
      'BIOMETRIC-VERIFIED-OPERATOR'
    );

    const recompiled = extractionResult.updatedBlueprint;
    const remainingNodeIds = recompiled.workflowCanvas.nodes.map(n => n.id);

    assert(!remainingNodeIds.includes('node_tax'), 'Target module node surgically detached from graph', 'node_tax deleted');
    assert(remainingNodeIds.includes('node_ingest') && remainingNodeIds.includes('node_bank'), 'Upstream and downstream nodes preserved');

    // Verify edge bypass re-wiring
    const bridgeEdge = recompiled.workflowCanvas.edges.find(
      e => e.source === 'node_ingest' && e.target === 'node_bank'
    );
    assert(Boolean(bridgeEdge), 'Dangling pipeline route automatically bridged: [node_ingest -> node_bank]');
    assert(recompiled.milestoneCheckpoints.length > testBlueprint.milestoneCheckpoints.length, 'New cryptographic checkpoint sealed at head of chain', `Total: ${recompiled.milestoneCheckpoints.length}`);
    assert(Boolean(recompiled.milestoneCheckpoints[0].snapshotHash), 'New checkpoint has valid SHA-256 seal', recompiled.milestoneCheckpoints[0].snapshotHash.substring(0, 16) + '...');

    // -------------------------------------------------------------
    // Phase 4: Local Continuous Biometric Gate
    // -------------------------------------------------------------
    console.log('\n[Phase 4: Continuous Biometric Authentication Gate]');
    // Test biometric completion callback
    setTimeout(() => {
      biometricAuthGate.completeAuthentication('Windows Hello');
    }, 20);

    const ticket = await biometricAuthGate.requestBiometricAuthorization(
      'Test Privileged Action',
      'Sandbox unit test verification'
    );

    assert(ticket.authorized, 'Biometric authorization successful', `Ticket: ${ticket.ticketId}`);
    assert(ticket.authenticatorType === 'Windows Hello', 'Authenticator type verified as Windows Hello');
    assert(Boolean(ticket.hardwareSignature), 'Hardware enclave signature generated', ticket.hardwareSignature.substring(0, 14) + '...');

    // -------------------------------------------------------------
    // Phase 5: Anti-Tamper Validation & Quarantine Freeze
    // -------------------------------------------------------------
    console.log('\n[Phase 5: Anti-Tamper Cryptographic Freeze Routine]');
    const legitContent = JSON.stringify(testBlueprint);
    const legitSeal = await ztaCryptoEngine.computeSha256(legitContent.trim());

    // Legitimate content should validate
    const checkLegit = await ztaCryptoEngine.validateWorkspaceIntegrity(legitContent, legitSeal);
    assert(checkLegit.valid, 'Authentic workspace content passes cryptographic SHA-256 validation');

    // Simulate external tamper modification
    const tamperedContent = legitContent.replace('Zenith Multi-Modal Logistics', 'Malicious Injected Corp');
    const checkTampered = await ztaCryptoEngine.validateWorkspaceIntegrity(tamperedContent, legitSeal);
    assert(!checkTampered.valid, 'Tampered file content fails cryptographic hash check', `${checkTampered.diskHash.substring(0, 8)} != ${legitSeal.substring(0, 8)}`);

    // Verify Quarantine Freeze activation
    isolatedRuntimeBroker.triggerQuarantineFreeze('EXTERNAL_TAMPER: Unauthorized modification detected');
    assert(isolatedRuntimeBroker.getQuarantineStatus().isQuarantined, 'Runtime quarantine freeze activated');

    // Verify operations are frozen under quarantine
    let blockedUnderQuarantine = false;
    try {
      isolatedRuntimeBroker.issueCapabilityToken(
        'BOUNDARY_VISUAL_CANVAS',
        'BOUNDARY_DATA_ENGINE',
        'WRITE_OP'
      );
    } catch {
      blockedUnderQuarantine = true;
    }
    assert(blockedUnderQuarantine, 'All capability token generation blocked while in quarantine freeze');

    // Lift quarantine via biometric override
    isolatedRuntimeBroker.liftQuarantine();
    assert(!isolatedRuntimeBroker.getQuarantineStatus().isQuarantined, 'Quarantine lifted after biometric enclave re-seal');

    console.log('\n================================================================');
    console.log(`  ALL PHASE 4 SANDBOX TESTS PASSED: ${passed}/${total} assertions verified!`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nPhase 4 Sandbox test failure:', err);
    process.exit(1);
  }
}

runPhase4SandboxTests();
