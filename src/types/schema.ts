/**
 * Project Axiom — workspace.axiom Central Schema Definition
 * Strict, type-safe blueprint capturing the absolute state of a business venture.
 */

export type OperationalTier = 'Solo Founder' | 'Growth Scale' | 'Global Enterprise';

export type ProblemDomain = 
  | 'Logistics & Supply Chain'
  | 'FinTech & Payments'
  | 'Tax & Regulatory Compliance'
  | 'Enterprise Operations'
  | 'Healthcare & Life Sciences'
  | 'Consumer Commerce';

export type ProblemSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type FrictionCategory = 
  | 'Operational Bottleneck'
  | 'Supply Chain Inefficiency'
  | 'Regulatory Friction'
  | 'Capital Leakage'
  | 'Data Silo'
  | 'Custom';

export type EAVValueType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'currency'
  | 'json'
  | 'relation'
  | 'datetime';

export type CheckpointStage = 
  | 'Stage 1: Initiation Infrastructure'
  | 'Stage 2: Job Procedure and Workflows'
  | 'Stage 3: Legalities, Taxation, and GST'
  | 'Stage 4: Transaction Management';

export type CheckpointStatus = 'LOCKED' | 'ACTIVE' | 'PENDING' | 'ROLLED_BACK';

/** Root Block 1: Client Information */
export interface ClientInfo {
  companyName: string;
  legalEntityType: 'Private Limited' | 'Public Limited' | 'LLC' | 'Sole Proprietorship' | 'Partnership';
  foundingDate: string;
  jurisdiction: string;
  taxIdentifier: string; // e.g. GSTIN (27AABCU9603R1ZN) or EIN
  baseCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';
  operationalTier: OperationalTier;
  contactEmail: string;
  primaryIndustry: string;
  hqLocation: string;
}

/** Root Block 2: Isolated Business Problem Nodes */
export interface BusinessProblemNode {
  id: string;
  title: string;
  domain: ProblemDomain;
  severity: ProblemSeverity;
  frictionCategory: FrictionCategory;
  description: string;
  affectedStakeholders: string[];
  isLocked: boolean;
  complianceImpact: {
    governingAct: string;
    riskScore: number; // 0 - 100
    mitigationStrategy: string;
  };
  metrics: {
    estimatedWasteHoursPerMonth: number;
    estimatedCapitalLeakageUSD: number;
  };
  createdAt: string;
  updatedAt: string;
}

/** Root Block 3: Data Schema Attributes (Entity-Attribute-Value graph variables) */
export interface EAVAttribute {
  id: string;
  entity: string; // e.g., 'CustomerOrder', 'GSTLedger', 'VendorPayout'
  attribute: string; // e.g., 'cgst_amount', 'hsn_sac_code', 'kyc_verified'
  valueType: EAVValueType;
  defaultValue: string | number | boolean | null;
  currentValue: string | number | boolean | null;
  isEncrypted: boolean;
  constraints: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enumOptions?: string[];
    relationTarget?: string;
  };
  graphEdges: string[]; // IDs of interconnected EAV attributes
  description: string;
  updatedAt: string;
}

/** Root Block 4: Chronological Milestone Checkpoint Markers */
export interface MilestoneCheckpoint {
  id: string;
  stage: CheckpointStage;
  stageIndex: 1 | 2 | 3 | 4;
  title: string;
  status: CheckpointStatus;
  timestamp: string;
  snapshotHash: string; // SHA-256 signature
  authorSignature: string; // e.g., on-device biometric token
  deltaSummary: string;
  dependencies: string[];
  stateSnapshot?: {
    nodesCount: number;
    attributesCount: number;
    complianceScore: number;
  };
}

/** Operational Canvas Node Configuration */
export interface CanvasNodeConfig {
  ingressVolumePerDay?: number;
  leadSource?: string;
  orderValueINR?: number;
  dispatchStage?: string;
  handlingMinutes?: number;
  slaAdherencePct?: number;
  activeQueueCount?: number;
  complianceSeal?: string;
  governanceStatus?: string;
  auditVerified?: boolean;
  gstRate?: 5 | 12 | 18 | 28;
  isInterState?: boolean;
  hsnSacCode?: string;
  settlementGateway?: string;
  gatewayMdrPct?: number;
  escrowHoldbackPct?: number;
  grossRevenueMonthly?: number;
}

export interface WorkflowCanvasNode {
  id: string;
  type: 'customerIngestion' | 'fulfillmentPipeline' | 'legalLedger' | 'taxCalculator' | 'bankingGateway';
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: 'customerIngestion' | 'fulfillmentPipeline' | 'legalLedger' | 'taxCalculator' | 'bankingGateway';
    config: CanvasNodeConfig;
    metrics?: Record<string, number | string>;
  };
}

export interface WorkflowCanvasEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  type?: string;
  data?: {
    tokenType: 'currency' | 'task';
    speed: number;
    flowRatePerHour: number;
  };
}

export interface WorkflowCanvasState {
  version: string;
  viewport: { x: number; y: number; zoom: number };
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
}

/** Security & ZTA Metadata */
export interface SecurityMoatConfig {
  encryptionStandard: 'AES-256-GCM';
  zeroTrustIsolation: boolean;
  keyDerivationSource: 'Host Hardware Enclave / Windows Hello';
  integrityChecksum: string;
  lastBiometricAudit: string;
}

/** Central Root Schema: workspace.axiom */
export interface WorkspaceAxiom {
  axiomVersion: string;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  updatedAt: string;
  securityMoat: SecurityMoatConfig;
  clientInfo: ClientInfo;
  problemNodes: BusinessProblemNode[];
  dataSchemaAttributes: EAVAttribute[];
  milestoneCheckpoints: MilestoneCheckpoint[];
  workflowCanvas: WorkflowCanvasState;
  metadata: {
    environment: 'production-edge' | 'local-sandbox';
    compiledBinaryTarget: 'tauri-windows-x86_64';
    edgeComputeAllocatedMB: number;
  };
}

/** Default initial blueprint for new workspaces */
export const DEFAULT_WORKSPACE_AXIOM: WorkspaceAxiom = {
  axiomVersion: '1.0.0-polymorphic',
  workspaceId: 'axm-ws-' + Math.random().toString(36).substring(2, 9),
  workspaceName: 'Zenith Logistics Core Venture',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  securityMoat: {
    encryptionStandard: 'AES-256-GCM',
    zeroTrustIsolation: true,
    keyDerivationSource: 'Host Hardware Enclave / Windows Hello',
    integrityChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    lastBiometricAudit: new Date().toISOString(),
  },
  clientInfo: {
    companyName: 'Zenith Multi-Modal Logistics Pvt Ltd',
    legalEntityType: 'Private Limited',
    foundingDate: '2024-03-15',
    jurisdiction: 'India (GST & MCA Framework)',
    taxIdentifier: '27AABCZ9988P1ZN',
    baseCurrency: 'INR',
    operationalTier: 'Growth Scale',
    contactEmail: 'operations@zenithlogistics.internal',
    primaryIndustry: 'Intermodal Freight & Supply Chain Tech',
    hqLocation: 'Mumbai, Maharashtra, India',
  },
  problemNodes: [
    {
      id: 'prob-node-01',
      title: 'Inter-State GST E-Way Bill Reconciliation Lag',
      domain: 'Tax & Regulatory Compliance',
      severity: 'Critical',
      frictionCategory: 'Regulatory Friction',
      description: 'Discrepancies between transit warehouse dispatch logs and GST Portal E-Way bill generation lead to 18-hour transport impoundment at regional borders.',
      affectedStakeholders: ['Fleet Drivers', 'Compliance Officers', 'Consignees'],
      isLocked: true,
      complianceImpact: {
        governingAct: 'CGST Act Section 68 / Rule 138',
        riskScore: 92,
        mitigationStrategy: 'Automated on-device geo-fenced API token dispatch prior to dock release.',
      },
      metrics: {
        estimatedWasteHoursPerMonth: 340,
        estimatedCapitalLeakageUSD: 14500,
      },
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-08T10:30:00Z',
    },
    {
      id: 'prob-node-02',
      title: 'Multi-Leg Split Payment Settlement Delays',
      domain: 'FinTech & Payments',
      severity: 'High',
      frictionCategory: 'Capital Leakage',
      description: 'Vendor payment terms require T+1 escrow payouts across 3rd-party freight operators, causing cash flow bottlenecks during peak quarter-end volume.',
      affectedStakeholders: ['Subcontracted Carriers', 'Treasury Team', 'Fuel Vendors'],
      isLocked: false,
      complianceImpact: {
        governingAct: 'RBI Payment & Settlement Systems Act',
        riskScore: 78,
        mitigationStrategy: 'Micro-token escrow ledger with programmatic dual-key release triggers.',
      },
      metrics: {
        estimatedWasteHoursPerMonth: 120,
        estimatedCapitalLeakageUSD: 8200,
      },
      createdAt: '2026-09-02T11:15:00Z',
      updatedAt: '2026-09-07T14:20:00Z',
    },
    {
      id: 'prob-node-03',
      title: 'Cold-Chain IoT Telemetry Sensor Ingestion Drops',
      domain: 'Logistics & Supply Chain',
      severity: 'Medium',
      frictionCategory: 'Operational Bottleneck',
      description: 'High packet loss in remote highway corridors breaks continuous temperature logs required for perishable pharma compliance.',
      affectedStakeholders: ['Pharma Audit Inspectors', 'Quality Assurance Managers'],
      isLocked: false,
      complianceImpact: {
        governingAct: 'Drugs & Cosmetics Rules (Cold Chain Schedule M)',
        riskScore: 65,
        mitigationStrategy: 'Local edge DuckDB buffering on vehicle gateway before batch relay.',
      },
      metrics: {
        estimatedWasteHoursPerMonth: 85,
        estimatedCapitalLeakageUSD: 5100,
      },
      createdAt: '2026-09-05T09:40:00Z',
      updatedAt: '2026-09-08T09:10:00Z',
    }
  ],
  dataSchemaAttributes: [
    {
      id: 'eav-001',
      entity: 'ConsignmentManifest',
      attribute: 'gstin_consignor',
      valueType: 'string',
      defaultValue: '',
      currentValue: '27AABCZ9988P1ZN',
      isEncrypted: false,
      constraints: {
        required: true,
        pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
      },
      graphEdges: ['eav-002', 'eav-003'],
      description: 'Unique 15-character GST identification number of originating shipper.',
      updatedAt: '2026-09-08T10:00:00Z',
    },
    {
      id: 'eav-002',
      entity: 'ConsignmentManifest',
      attribute: 'eway_bill_number',
      valueType: 'string',
      defaultValue: '',
      currentValue: '381900284711',
      isEncrypted: false,
      constraints: {
        required: true,
        pattern: '^[0-9]{12}$',
      },
      graphEdges: ['eav-001'],
      description: '12-digit electronic waybill generated for movement of goods above threshold.',
      updatedAt: '2026-09-08T10:00:00Z',
    },
    {
      id: 'eav-003',
      entity: 'FinancialLedgerEntry',
      attribute: 'igst_collected_inr',
      valueType: 'currency',
      defaultValue: 0,
      currentValue: 18450.00,
      isEncrypted: true,
      constraints: {
        required: true,
        min: 0,
      },
      graphEdges: ['eav-001', 'eav-004'],
      description: 'Integrated GST tax amount calculated at standard 18% inter-state tariff.',
      updatedAt: '2026-09-08T10:00:00Z',
    },
    {
      id: 'eav-004',
      entity: 'VendorEscrowContract',
      attribute: 'payout_clearance_status',
      valueType: 'relation',
      defaultValue: 'PENDING_GEO_VERIFICATION',
      currentValue: 'ESCROW_FUNDS_LOCKED',
      isEncrypted: false,
      constraints: {
        required: true,
        enumOptions: ['PENDING_GEO_VERIFICATION', 'ESCROW_FUNDS_LOCKED', 'RELEASED_TO_CARRIER', 'DISPUTED'],
      },
      graphEdges: ['eav-003'],
      description: 'State machine condition linking GPS gate clearance with bank token release.',
      updatedAt: '2026-09-08T10:00:00Z',
    }
  ],
  milestoneCheckpoints: [
    {
      id: 'chk-stg1-001',
      stage: 'Stage 1: Initiation Infrastructure',
      stageIndex: 1,
      title: 'Company Incorporation & Cloud ZTA Enclave Setup',
      status: 'LOCKED',
      timestamp: '2026-09-01T14:00:00Z',
      snapshotHash: 'a718c3924f0c91837bc2818938d2f091c7a82910394819283746192837461928',
      authorSignature: 'HW-ENCLAVE-WINHELLO-RSA4096-AUTH',
      deltaSummary: 'Corporate charter registered; local cryptographic keys generated and pinned.',
      dependencies: [],
      stateSnapshot: {
        nodesCount: 1,
        attributesCount: 1,
        complianceScore: 100,
      }
    },
    {
      id: 'chk-stg2-002',
      stage: 'Stage 2: Job Procedure and Workflows',
      stageIndex: 2,
      title: 'Dispatch Order Ingestion & Routing Pipeline',
      status: 'LOCKED',
      timestamp: '2026-09-03T18:30:00Z',
      snapshotHash: 'b829d4035g1d02948cd3929049e3g102d8b93021405920394857203948572039',
      authorSignature: 'HW-ENCLAVE-WINHELLO-RSA4096-AUTH',
      deltaSummary: 'Order ingestion webhooks tied with real-time fleet telematics buffer.',
      dependencies: ['chk-stg1-001'],
      stateSnapshot: {
        nodesCount: 2,
        attributesCount: 2,
        complianceScore: 94,
      }
    },
    {
      id: 'chk-stg3-003',
      stage: 'Stage 3: Legalities, Taxation, and GST',
      stageIndex: 3,
      title: 'Automated Inter-State E-Way & GST Reconciliation',
      status: 'ACTIVE',
      timestamp: '2026-09-07T12:00:00Z',
      snapshotHash: 'c930e5146h2e13059de4030150f4h213e9c04132516031405968314059683140',
      authorSignature: 'OPERATOR-VERIFIED-LEVEL3',
      deltaSummary: 'Rule 138 threshold monitoring with real-time tax bracket validation active.',
      dependencies: ['chk-stg2-002'],
      stateSnapshot: {
        nodesCount: 3,
        attributesCount: 4,
        complianceScore: 88,
      }
    },
    {
      id: 'chk-stg4-004',
      stage: 'Stage 4: Transaction Management',
      stageIndex: 4,
      title: 'Autonomous Escrow Split & Payout Network',
      status: 'PENDING',
      timestamp: '2026-09-08T09:00:00Z',
      snapshotHash: 'd041f6257i3f24160ef5141261g5i324f0d15243627142516079425160794251',
      authorSignature: 'SYSTEM-PENDING-STAGE3-SIGN-OFF',
      deltaSummary: 'Vendor escrow smart payout contract staged awaiting final GST audit seal.',
      dependencies: ['chk-stg3-003'],
      stateSnapshot: {
        nodesCount: 3,
        attributesCount: 4,
        complianceScore: 75,
      }
    }
  ],
  workflowCanvas: {
    version: '1.0.0',
    viewport: { x: 50, y: 50, zoom: 0.9 },
    nodes: [
      {
        id: 'node-ingestion',
        type: 'customerIngestion',
        position: { x: 80, y: 150 },
        data: {
          label: 'Customer Ingestion Node',
          nodeType: 'customerIngestion',
          config: {
            ingressVolumePerDay: 450,
            leadSource: 'B2B API + EDI Stream',
            orderValueINR: 8500,
          }
        }
      },
      {
        id: 'node-fulfillment',
        type: 'fulfillmentPipeline',
        position: { x: 380, y: 150 },
        data: {
          label: 'Fulfillment Pipeline Node',
          nodeType: 'fulfillmentPipeline',
          config: {
            dispatchStage: 'Automated Routing',
            handlingMinutes: 12,
            slaAdherencePct: 98.4,
            activeQueueCount: 38,
          }
        }
      },
      {
        id: 'node-legal',
        type: 'legalLedger',
        position: { x: 680, y: 40 },
        data: {
          label: 'Legal Ledger Node',
          nodeType: 'legalLedger',
          config: {
            complianceSeal: 'MCA-VERIFIED-L2',
            governanceStatus: 'AUDIT_SEALED',
            auditVerified: true,
          }
        }
      },
      {
        id: 'node-tax',
        type: 'taxCalculator',
        position: { x: 680, y: 260 },
        data: {
          label: 'Tax Calculator Node',
          nodeType: 'taxCalculator',
          config: {
            gstRate: 18,
            isInterState: true,
            hsnSacCode: '996511 - Freight Transportation',
          }
        }
      },
      {
        id: 'node-banking',
        type: 'bankingGateway',
        position: { x: 980, y: 150 },
        data: {
          label: 'Banking Gateway Node',
          nodeType: 'bankingGateway',
          config: {
            settlementGateway: 'Razorpay / HDFC Escrow',
            gatewayMdrPct: 1.85,
            escrowHoldbackPct: 10,
            grossRevenueMonthly: 3825000,
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge-ingest-fulfill',
        source: 'node-ingestion',
        target: 'node-fulfillment',
        animated: true,
        type: 'tokenStream',
        data: { tokenType: 'task', speed: 2, flowRatePerHour: 450 }
      },
      {
        id: 'edge-fulfill-legal',
        source: 'node-fulfillment',
        target: 'node-legal',
        animated: true,
        type: 'tokenStream',
        data: { tokenType: 'task', speed: 2, flowRatePerHour: 450 }
      },
      {
        id: 'edge-fulfill-tax',
        source: 'node-fulfillment',
        target: 'node-tax',
        animated: true,
        type: 'tokenStream',
        data: { tokenType: 'currency', speed: 1.5, flowRatePerHour: 450 }
      },
      {
        id: 'edge-legal-banking',
        source: 'node-legal',
        target: 'node-banking',
        animated: true,
        type: 'tokenStream',
        data: { tokenType: 'task', speed: 2, flowRatePerHour: 450 }
      },
      {
        id: 'edge-tax-banking',
        source: 'node-tax',
        target: 'node-banking',
        animated: true,
        type: 'tokenStream',
        data: { tokenType: 'currency', speed: 1.5, flowRatePerHour: 450 }
      }
    ]
  },
  metadata: {
    environment: 'local-sandbox',
    compiledBinaryTarget: 'tauri-windows-x86_64',
    edgeComputeAllocatedMB: 512,
  }
};
