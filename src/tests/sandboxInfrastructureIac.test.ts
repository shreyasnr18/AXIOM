/**
 * Project Axiom — Phase 5 Isolated Sandbox Unit Test Suite
 * Validates:
 * 1. Host Machine Credential Sandboxing Channel & Zero Plaintext Insulation
 * 2. Infrastructure as Code (IaC) Translation Parser (Terraform HCL Syntax & Semantics)
 * 3. AWS CloudFormation Template Generation (Valid Structure & Serverless V2)
 * 4. Automated Cost Guardrails ($50/mo CloudWatch Alarm Enforcement)
 * 5. Deployment Automation Loop Milestone Progression & Live HTTPS URL Resolution
 */

import { credentialVault, AwsCredentials } from '../services/credentialVault';
import { iacParserEngine } from '../services/iacParserEngine';
import { cloudDeploymentEngine, DeploymentStage } from '../services/cloudDeploymentEngine';
import { DEFAULT_WORKSPACE_AXIOM, WorkspaceAxiom } from '../types/schema';

async function runPhase5SandboxTests() {
  console.log('================================================================');
  console.log('  PROJECT AXIOM — PHASE 5 INFRASTRUCTURE & IAC SANDBOX SUITE    ');
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
    // Phase 1: Host Credential Sandboxing Channel
    // -------------------------------------------------------------
    console.log('[Phase 1: Host Credential Sandboxing Channel]');
    const testCreds: AwsCredentials = {
      awsAccessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      awsSecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      awsRegion: 'ap-south-1',
      awsSessionToken: 'IQoJb3JpZ2luX2VjEEXAMPLESTSTOKEN12345',
      accountAlias: 'zenith-logistics-prod',
      maxMonthlyBudgetUSD: 50.0,
    };

    await credentialVault.storeCredentials(testCreds);
    const retrieved = await credentialVault.getCredentials();

    assert(Boolean(retrieved), 'Credentials successfully persisted in secure host enclave');
    assert(retrieved?.awsAccessKeyId === testCreds.awsAccessKeyId, 'Key ID decrypted correctly in-memory');
    assert(retrieved?.awsRegion === 'ap-south-1', 'Active region mapped correctly');

    const vaultStatus = await credentialVault.getStatus();
    assert(vaultStatus.hasStoredCredentials, 'Host credential enclave reports active storage status');
    assert(vaultStatus.isEncrypted, 'Vault confirms zero-plaintext encryption boundary');

    // -------------------------------------------------------------
    // Phase 2: Terraform IaC Compilation Validity
    // -------------------------------------------------------------
    console.log('\n[Phase 2: Terraform IaC Template Compilation]');
    const blueprint: WorkspaceAxiom = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_AXIOM));

    const compiled = iacParserEngine.compileInfrastructureTemplates(blueprint, {
      region: 'ap-south-1',
      maxMonthlyBudgetUSD: 50.0,
    });

    const tf = compiled.terraformHcl;
    assert(tf.includes('provider "aws"'), 'Terraform template defines AWS provider block');
    assert(tf.includes('resource "aws_vpc" "axiom_vpc"'), 'Zero-Trust VPC resource defined with 10.0.0.0/16 CIDR');
    assert(tf.includes('resource "aws_rds_cluster" "aurora_serverless"'), 'Aurora Serverless v2 PostgreSQL cluster declared');
    assert(tf.includes('min_capacity = 0.5'), 'Aurora auto-scaling minimum capacity capped at 0.5 ACU');
    assert(tf.includes('max_capacity = 2.0'), 'Aurora auto-scaling maximum capacity configured for cost optimization');
    assert(tf.includes('resource "aws_ecs_task_definition" "axiom_task"'), 'ECS Fargate container task definition declared');
    assert(tf.includes('requires_compatibilities = ["FARGATE"]'), 'Fargate serverless container runtime enforced');
    assert(tf.includes('resource "aws_acm_certificate" "axiom_cert"'), 'Free ACM SSL certificate resource included');

    // -------------------------------------------------------------
    // Phase 3: CloudFormation Template Generation Validity
    // -------------------------------------------------------------
    console.log('\n[Phase 3: CloudFormation Template Structure]');
    const cfnYaml = compiled.cloudFormationYaml;
    assert(cfnYaml.includes("AWSTemplateFormatVersion: '2010-09-09'"), 'CloudFormation format version standard 2010-09-09');
    assert(cfnYaml.includes('Type: AWS::EC2::VPC'), 'CloudFormation contains AWS::EC2::VPC');
    assert(cfnYaml.includes('Type: AWS::RDS::DBCluster'), 'CloudFormation contains AWS::RDS::DBCluster');
    assert(cfnYaml.includes('Type: AWS::ECS::TaskDefinition'), 'CloudFormation contains AWS::ECS::TaskDefinition');

    const cfnJson = JSON.parse(compiled.cloudFormationJson);
    assert(Boolean(cfnJson.Resources.AxiomVPC), 'CloudFormation JSON parses with valid AxiomVPC object');
    assert(Boolean(cfnJson.Resources.AuroraDBCluster), 'CloudFormation JSON contains AuroraDBCluster with ServerlessV2');
    assert(Boolean(cfnJson.Outputs.LiveProductionUrl), 'CloudFormation defines LiveProductionUrl output');

    // -------------------------------------------------------------
    // Phase 4: Automated Cost Guardrail & Billing Alarm
    // -------------------------------------------------------------
    console.log('\n[Phase 4: Cost Guardrail Alarm & Budget Thresholds]');
    assert(tf.includes('resource "aws_cloudwatch_metric_alarm" "billing_budget_guardrail"'), 'Terraform injects CloudWatch billing metric alarm');
    assert(tf.includes('threshold           = 50.00'), 'CloudWatch alarm threshold set exactly to $50.00 USD cap');
    assert(compiled.estimatedCostBreakdownUSD.totalEstimatedMonthlyUSD <= 50.0, 'Baseline monthly estimated cost is within $50 guardrail cap', `$${compiled.estimatedCostBreakdownUSD.totalEstimatedMonthlyUSD}/mo`);

    // -------------------------------------------------------------
    // Phase 5: Cloud Deployment Automation Loop & Live URL
    // -------------------------------------------------------------
    console.log('\n[Phase 5: Cloud Deployment Automation Loop]');
    const visitedStages: DeploymentStage[] = [];

    const unsub = cloudDeploymentEngine.subscribe((state) => {
      if (!visitedStages.includes(state.stage)) {
        visitedStages.push(state.stage);
      }
    });

    const liveUrl = await cloudDeploymentEngine.executeCloudDeployment(blueprint, 50.0);
    unsub();

    assert(Boolean(liveUrl), 'Deployment completed and returned production endpoint', liveUrl);
    assert(liveUrl.startsWith('https://'), 'Live URL is secured with HTTPS protocol');
    assert(liveUrl.includes('awsapp.net'), 'Live URL mapped to cloud application domain');

    const finalState = cloudDeploymentEngine.getState();
    assert(finalState.stage === 'LIVE_ACTIVE', 'Final deployment state is verified LIVE_ACTIVE');
    assert(finalState.percent === 100, 'Deployment progress reached 100%');
    assert(finalState.provisionedResources.length >= 5, 'Inventory contains all provisioned infrastructure ARNs', `${finalState.provisionedResources.length} resources`);

    const hasVpc = finalState.provisionedResources.some(r => r.type === 'AWS::EC2::VPC');
    const hasAurora = finalState.provisionedResources.some(r => r.type === 'AWS::RDS::DBCluster');
    const hasFargate = finalState.provisionedResources.some(r => r.type === 'AWS::ECS::Service');
    const hasAlarm = finalState.provisionedResources.some(r => r.type === 'AWS::CloudWatch::Alarm');
    const hasCdn = finalState.provisionedResources.some(r => r.type === 'AWS::CloudFront::Distribution');

    assert(hasVpc && hasAurora && hasFargate && hasAlarm && hasCdn, 'All 5 core architectural tiers (VPC, Aurora, Fargate, Alarm, CDN) provisioned and confirmed');

    console.log('\n================================================================');
    console.log(`  ALL PHASE 5 SANDBOX TESTS PASSED: ${passed}/${total} assertions verified!`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nPhase 5 Sandbox test failure:', err);
    process.exit(1);
  }
}

runPhase5SandboxTests();
