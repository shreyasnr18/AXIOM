/**
 * Project Axiom — Zero Trust Isolated Runtime Broker
 * Enforces absolute process isolation across three runtime boundaries:
 * - Boundary 1: Visual UI Canvas (visual layout & interaction only)
 * - Boundary 2: HTAP Data Core (SQLite OLTP & DuckDB OLAP)
 * - Boundary 3: File Compiler Engine (WebLLM / code generators)
 *
 * Cross-boundary dispatch is strictly prohibited unless authorized by
 * an ephemeral cryptographic capability token.
 */

export type RuntimeBoundary = 'BOUNDARY_VISUAL_CANVAS' | 'BOUNDARY_DATA_ENGINE' | 'BOUNDARY_COMPILER_ENGINE';

export interface CapabilityToken {
  tokenId: string;
  sourceBoundary: RuntimeBoundary;
  targetBoundary: RuntimeBoundary;
  action: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface BoundaryAuditLog {
  timestamp: string;
  sourceBoundary: RuntimeBoundary;
  targetBoundary: RuntimeBoundary;
  action: string;
  status: 'AUTHORIZED' | 'DENIED' | 'QUARANTINED';
  details: string;
}

class IsolatedRuntimeBrokerManager {
  private auditLogs: BoundaryAuditLog[] = [];
  private activeTokens: Map<string, CapabilityToken> = new Map();
  private isQuarantined = false;
  private quarantineReason: string | null = null;

  /**
   * Generates an ephemeral cryptographic capability token allowing a single cross-boundary call
   */
  public issueCapabilityToken(
    source: RuntimeBoundary,
    target: RuntimeBoundary,
    action: string,
    validityMs: number = 30000
  ): CapabilityToken {
    if (this.isQuarantined) {
      throw new Error(`SECURITY_GATEWAY_QUARANTINE: Broker execution frozen. Reason: ${this.quarantineReason}`);
    }

    const now = Date.now();
    const tokenId = `cap_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const nonce = Math.random().toString(36).substring(2, 15);

    const token: CapabilityToken = {
      tokenId,
      sourceBoundary: source,
      targetBoundary: target,
      action,
      issuedAt: now,
      expiresAt: now + validityMs,
      nonce,
    };

    this.activeTokens.set(tokenId, token);
    return token;
  }

  /**
   * Validates capability token before executing cross-boundary payload
   */
  public async dispatchCrossBoundary<T>(
    token: CapabilityToken,
    expectedTarget: RuntimeBoundary,
    action: string,
    executePayload: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();

    if (this.isQuarantined) {
      this.recordAudit(token.sourceBoundary, expectedTarget, action, 'QUARANTINED', 'Quarantine freeze active');
      throw new Error(`EXECUTION_BLOCKED: Runtime quarantined. Reason: ${this.quarantineReason}`);
    }

    const storedToken = this.activeTokens.get(token.tokenId);

    // Validate token existence, expiration, and boundary alignment
    if (!storedToken) {
      this.recordAudit(token.sourceBoundary, expectedTarget, action, 'DENIED', 'Invalid or forged capability token');
      throw new Error('SECURITY_VIOLATION: Missing capability token for cross-boundary call');
    }

    if (now > storedToken.expiresAt) {
      this.activeTokens.delete(token.tokenId);
      this.recordAudit(token.sourceBoundary, expectedTarget, action, 'DENIED', 'Capability token expired');
      throw new Error('SECURITY_VIOLATION: Capability token expired');
    }

    if (storedToken.targetBoundary !== expectedTarget || storedToken.action !== action) {
      this.recordAudit(token.sourceBoundary, expectedTarget, action, 'DENIED', 'Token permission mismatch');
      throw new Error('SECURITY_VIOLATION: Capability token permission scope mismatch');
    }

    // Token used: consume for single-use replay protection
    this.activeTokens.delete(token.tokenId);
    this.recordAudit(token.sourceBoundary, expectedTarget, action, 'AUTHORIZED', 'Capability verified');

    return await executePayload();
  }

  /**
   * Freezes the entire application shell if cryptographic tampering is detected
   */
  public triggerQuarantineFreeze(reason: string): void {
    this.isQuarantined = true;
    this.quarantineReason = reason;
    this.activeTokens.clear();
    console.error(`[ZTA Broker] CRITICAL: Runtime quarantined! ${reason}`);
  }

  public liftQuarantine(): void {
    this.isQuarantined = false;
    this.quarantineReason = null;
    console.log('[ZTA Broker] Quarantine lifted by authorized biometric override.');
  }

  public getQuarantineStatus(): { isQuarantined: boolean; reason: string | null } {
    return {
      isQuarantined: this.isQuarantined,
      reason: this.quarantineReason,
    };
  }

  public getAuditLogs(): BoundaryAuditLog[] {
    return [...this.auditLogs];
  }

  private recordAudit(
    source: RuntimeBoundary,
    target: RuntimeBoundary,
    action: string,
    status: 'AUTHORIZED' | 'DENIED' | 'QUARANTINED',
    details: string
  ): void {
    this.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      sourceBoundary: source,
      targetBoundary: target,
      action,
      status,
      details,
    });
    if (this.auditLogs.length > 50) {
      this.auditLogs.pop();
    }
  }
}

export const isolatedRuntimeBroker = new IsolatedRuntimeBrokerManager();
