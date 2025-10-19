<!-- 0d41eb42-f2e2-4e03-a04b-c4c99e4c2d92 104acb3f-08aa-4536-b5bd-ad755682f156 -->
# InsightModAI Agent - Complete AWS Deployment

## Architecture Overview

Serverless AI agent using **Amazon Bedrock AgentCore Runtime** with **Strands agents** for autonomous customer insights analysis, modular CRM integration, React admin UI, and comprehensive monitoring.

## Core Components to Build

### 1. CloudFormation Template (`cloudformation/template.yaml`)

Main infrastructure-as-code file deploying:

- **Storage**: S3 buckets (feedback-data, processed-insights, amplify-source), DynamoDB tables (feedback-records, sentiment-analysis, agent-config)
- **Compute**: 
  - Lambda functions for feedback ingestion, invoking AgentCore agent, optional CRM integration
  - CodeBuild project for building agent Docker container
  - Custom CloudFormation resource (Lambda-backed) for AgentCore Runtime deployment
- **AI/ML**: 
  - **Strands Agent** (containerized): Main insights agent with tools for sentiment analysis, database operations, report generation
  - **AgentCore Runtime**: Managed container runtime for the agent (deployed via custom resource)
  - **AgentCore Memory**: Short-term and long-term memory for conversation tracking
  - ECR repository for agent container images
- **API**: API Gateway REST API with routes (/feedback POST, /insights GET, /config PUT, /agent POST for direct agent invocation)
- **Auth**: Cognito User Pool + Identity Pool for admin dashboard
- **Frontend**: Amplify app for React dashboard hosting
- **Monitoring**: CloudWatch log groups, custom dashboard, alarms (negative sentiment spikes, latency)
- **IAM**: Least-privilege roles for Lambda, AgentCore Runtime, API Gateway, CodeBuild

### 2. React Admin Dashboard (Inline in CloudFormation as Amplify source)

Complete application with:

- **Authentication**: Cognito integration with login/logout
- **Module Control Panel**: Toggle CRM integration, set sentiment thresholds, enable/disable processing modules
- **Observability**: Display AgentCore agent execution traces, tool invocations, streaming responses, session tracking
- **Monitoring Dashboard**: Real-time sentiment trends (custom charts using CloudWatch metrics), feedback volume, processing latency
- **Memory Viewer**: View agent conversation history, memory namespaces (STM/LTM), session summaries
- **CloudWatch Integration**: View logs, alarms, custom metrics

### 3. Strands Agent (Containerized Python Application)

**File**: `agent/insights_agent.py`

Main AgentCore agent using Strands framework:

- **Framework**: Strands + `BedrockAgentCoreApp` wrapper
- **Endpoints**: `/ping` (health check), `/invocations` (main agent entrypoint)
- **Tools** (decorated with `@tool`):
  - `analyze_sentiment(feedback_text)` - Sentiment analysis using Bedrock Claude
  - `store_feedback(feedback_data)` - Write to DynamoDB feedback table
  - `query_sentiment_trends(timeframe)` - Aggregate sentiment from DynamoDB
  - `generate_report(criteria)` - Create insights report, store in S3
  - `call_crm_api(action, data)` - Optional CRM integration (conditional on config)
- **Memory Integration**: AgentCore Memory for maintaining conversation context across sessions
- **Model**: Claude 3.5 Sonnet via Bedrock (configured in agent)

**Dockerfile**: Multi-stage build using `ghcr.io/astral-sh/uv:python3.11-bookworm-slim` (ARM64 for Graviton)

### 4. Lambda Functions (Inline Python in CloudFormation)

- **FeedbackIngestionFunction**: Receives JSON via API Gateway, validates, stores in DynamoDB/S3, optionally triggers agent
- **AgentInvokerFunction**: Invokes AgentCore Runtime via `bedrock-agentcore` client, handles streaming responses, manages session IDs
- **CRMIntegratorFunction**: Standalone CRM integration logic (Salesforce/HubSpot), called by agent tool or independently
- **AgentDeploymentFunction**: Custom resource handler for creating/updating/deleting AgentCore Runtime via `create_agent_runtime` API

### 5. AgentCore Runtime Deployment Strategy

Since CloudFormation doesn't natively support `AWS::BedrockAgentCore::AgentRuntime`, use:

- **Custom Resource**: Lambda function invoking `bedrock-agentcore-control` APIs (`create_agent_runtime`, `delete_agent_runtime`)
- **CodeBuild Project**: Triggered on stack creation/update to:

  1. Build Docker image from `agent/` directory
  2. Push to ECR repository
  3. Trigger custom resource Lambda with new image URI

- **Outputs**: AgentCore Runtime ARN, endpoint URL stored in CloudFormation outputs and SSM Parameter Store

### 5. Hackathon Submission Materials

- **README.md**: Project description, architecture overview, deployment steps, demo instructions
- **ARCHITECTURE.md**: Detailed component descriptions, data flow diagrams (text-based), cost analysis
- **DEPLOYMENT.md**: Step-by-step CloudFormation deployment guide, prerequisites, post-deployment configuration
- **DEMO_SCRIPT.md**: 3-minute video walkthrough script showing feedback ingestion → sentiment analysis → dashboard viewing → report generation
- **assets/**: Architecture diagram image (generated or hand-drawn description for tool creation)

## Key Implementation Details

- **Serverless**: All compute via Lambda (pay-per-invocation), no EC2/RDS
- **Security**: KMS encryption for S3/DynamoDB, IAM least-privilege, Cognito MFA-ready, API Gateway auth
- **Modularity**: DynamoDB config table with feature flags (crm_enabled, sentiment_threshold, active_modules)
- **Cost Optimization**: S3 Intelligent-Tiering, DynamoDB on-demand, Lambda memory tuning, CloudWatch free tier
- **Scalability**: API Gateway throttling, Lambda concurrency limits, DynamoDB auto-scaling

## Project File Structure

```
/
├── cloudformation/
│   └── template.yaml (main IaC with inline code)
├── frontend/ (React app, also inline in CFN for Amplify)
│   ├── src/
│   │   ├── components/ (ModuleControl, ObservabilityView, MonitoringDashboard)
│   │   ├── services/ (api.js, auth.js, cloudwatch.js)
│   │   └── App.js
│   ├── package.json
│   └── public/
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── DEMO_SCRIPT.md
└── assets/
    └── architecture-diagram.png (or .md description)
```

## Deployment Flow

1. Upload CloudFormation template to AWS Console/CLI
2. Specify parameters (admin email, Bedrock model ID, region)
3. Stack creates all resources (~10-15 min)
4. Post-deployment: Create Cognito user, configure CRM credentials in DynamoDB if needed
5. Access Amplify URL for dashboard
6. Test via API Gateway endpoint with sample feedback JSON

### To-dos

- [ ] Create CloudFormation template with S3, DynamoDB, Lambda functions (inline Python), Bedrock Agent, API Gateway, Cognito, Amplify, CloudWatch, IAM roles
- [ ] Write inline Python code for 5 Lambda functions (ingestion, orchestrator, sentiment, report, CRM) with Boto3 Bedrock/DynamoDB integration
- [ ] Configure Bedrock Agent resource with action groups, knowledge base, and agent instructions in CloudFormation
- [ ] Build complete React admin dashboard with Cognito auth, module controls, observability traces, monitoring charts, CloudWatch integration
- [ ] Define API Gateway REST API with routes, request/response models, CORS, Cognito authorizer in CloudFormation
- [ ] Create CloudWatch dashboard, alarms (sentiment spikes, errors, latency), log insights queries in CloudFormation
- [ ] Write README, ARCHITECTURE, DEPLOYMENT guides with deployment instructions, architecture overview, cost analysis
- [ ] Create demo video script, architecture diagram description, sample feedback JSON payloads for testing