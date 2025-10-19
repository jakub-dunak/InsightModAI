# Architecture Documentation

## System Overview

InsightModAI Agent is a serverless, autonomous AI system for customer insights analysis built entirely on AWS services. The architecture leverages Amazon Bedrock AgentCore Runtime for AI processing, with a complete React admin dashboard for monitoring and control.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   AWS API       │    │   React         │
│   Applications  │───▶│   Gateway       │───▶│   Dashboard     │
│   & Users       │    │                 │    │   (Amplify)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Lambda        │    │   AgentCore     │    │   DynamoDB      │
│   Functions     │◀──▶│   Runtime       │◀──▶│   Tables        │
│   (Ingestion)   │    │   (Strands)     │    │   (Data)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Amazon        │    │   S3 Buckets    │    │   CloudWatch    │
│   Bedrock       │    │   (Storage)     │    │   (Monitoring)  │
│   (AI Models)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Amazon Bedrock AgentCore Runtime

**Purpose**: Containerized AI agent runtime for autonomous processing

**Key Features**:
- **Strands Framework**: Python-based agent framework with tool decorators
- **Containerized Deployment**: Docker container running in managed runtime
- **Memory Management**: Built-in short-term and long-term memory systems
- **Tool Integration**: Custom tools for database operations, CRM calls, reporting

**Agent Structure**:
```python
# Main agent with BedrockAgentCoreApp wrapper
app = BedrockAgentCoreApp()

@tool
def analyze_sentiment(feedback_text: str) -> Dict[str, Any]:
    # Sentiment analysis using Bedrock Claude
    pass

@tool
def store_feedback(feedback_data: Dict[str, Any]) -> str:
    # Store in DynamoDB
    pass

@app.entrypoint
async def process_feedback(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Main processing logic
    pass
```

### 2. AWS Lambda Functions

**Serverless compute components**:

- **FeedbackIngestionFunction**: Processes API/S3 feedback submissions
- **AgentInvokerFunction**: Invokes AgentCore Runtime for processing
- **CRMIntegratorFunction**: Handles CRM API integrations
- **AgentDeploymentFunction**: Custom resource for AgentCore Runtime management

### 3. Amazon DynamoDB

**NoSQL database for data storage**:

- **FeedbackRecordsTable**: Raw customer feedback data
- **SentimentAnalysisTable**: Processed sentiment results
- **AgentConfigTable**: System configuration and settings

**Table Schemas**:
```json
{
  "FeedbackRecordsTable": {
    "PartitionKey": "feedback_id",
    "GSI1": {"PartitionKey": "timestamp", "Name": "TimestampIndex"},
    "GSI2": {"PartitionKey": "customer_id", "Name": "CustomerIndex"}
  },
  "SentimentAnalysisTable": {
    "PartitionKey": "feedback_id",
    "GSI1": {"PartitionKey": "sentiment_score", "Name": "SentimentIndex"},
    "GSI2": {"PartitionKey": "analysis_timestamp", "Name": "AnalysisTimestampIndex"}
  }
}
```

### 4. Amazon S3

**Object storage for various data types**:

- **FeedbackDataBucket**: Raw feedback files and bulk uploads
- **ProcessedInsightsBucket**: Generated reports and analysis results
- **AmplifySourceBucket**: React dashboard build artifacts

### 5. Amazon API Gateway

**REST API for external integrations**:

- **Routes**:
  - `POST /feedback` - Submit customer feedback
  - `GET /insights` - Retrieve analysis results
  - `POST /agent` - Direct agent invocation
  - `PUT /config` - Update system configuration

**Security**:
- Cognito authentication for protected endpoints
- IAM authorization for admin operations
- CORS enabled for web dashboard access

### 6. AWS Cognito

**Authentication and authorization**:

- **User Pool**: Email-based authentication for admin users
- **Identity Pool**: AWS credential vending for authenticated users
- **MFA Support**: Optional multi-factor authentication

### 7. AWS Amplify

**React dashboard hosting**:

- **Build Pipeline**: Automatic React app building and deployment
- **CDN Distribution**: Global content delivery for dashboard
- **Environment Variables**: Secure configuration injection

### 8. Amazon CloudWatch

**Monitoring and observability**:

- **Log Groups**: Centralized logging for all Lambda functions
- **Custom Dashboard**: Real-time system metrics visualization
- **Alarms**: Automated alerting for sentiment spikes and errors
- **Metrics**: Custom metrics for business KPIs

## Data Flow Architecture

### Feedback Processing Flow

1. **Ingestion**:
   ```
   External Source → API Gateway → FeedbackIngestionFunction → DynamoDB
   ```

2. **AI Processing**:
   ```
   DynamoDB → AgentInvokerFunction → AgentCore Runtime → Sentiment Analysis → DynamoDB
   ```

3. **Report Generation**:
   ```
   Sentiment Data → Report Generation → S3 → Dashboard Visualization
   ```

### Real-time Processing

- **Streaming Responses**: AgentCore Runtime supports real-time streaming
- **WebSocket Support**: Dashboard can receive live updates
- **Event-driven**: S3 triggers and DynamoDB streams for reactive processing

## Security Architecture

### Authentication Flow

```
User → Cognito Login → JWT Token → API Gateway → Lambda Authorization → Resource Access
```

### Data Protection

- **Encryption at Rest**: All data encrypted using AWS KMS
- **Encryption in Transit**: TLS 1.3 for all communications
- **Access Control**: Least-privilege IAM roles and policies
- **Audit Logging**: All operations logged to CloudTrail

### Network Security

- **VPC Endpoints**: Private API access for internal services
- **Security Groups**: Restricted access between components
- **WAF**: Web Application Firewall for API Gateway

## Scalability Architecture

### Auto-scaling Components

- **Lambda Functions**: Automatic scaling based on invocation load
- **DynamoDB**: On-demand capacity with burst capability
- **API Gateway**: Automatic throttling and rate limiting
- **AgentCore Runtime**: Container-based scaling

### Performance Optimization

- **Caching**: API Gateway caching for frequent requests
- **CDN**: CloudFront for global dashboard access
- **Connection Pooling**: Optimized database connections
- **Batch Processing**: Efficient bulk operations

## Cost Optimization

### Pay-per-Use Model

- **Lambda**: Billed per invocation and duration
- **DynamoDB**: On-demand billing with no provisioned capacity
- **S3**: Billed per GB stored and requests
- **API Gateway**: Billed per API call
- **Bedrock**: Billed per token processed

### Cost Management Strategies

- **Intelligent Tiering**: S3 automatic cost optimization
- **Lambda Memory Tuning**: Right-size function memory
- **DynamoDB GSI Optimization**: Efficient secondary index usage
- **CloudWatch Free Tier**: Basic monitoring at no cost

### Estimated Monthly Costs

**Small Scale (1K feedback/month)**:
- Lambda: $2-5
- DynamoDB: $1-2
- S3: $0.50-1
- Bedrock: $5-15
- API Gateway: $1-2
- Cognito: Free tier
- **Total: $10-25/month**

**Medium Scale (10K feedback/month)**:
- Lambda: $15-30
- DynamoDB: $5-10
- S3: $2-5
- Bedrock: $50-100
- API Gateway: $5-10
- **Total: $80-160/month**

## Deployment Architecture

### Infrastructure as Code

- **CloudFormation**: Complete infrastructure definition
- **Custom Resources**: Lambda-backed AgentCore Runtime deployment
- **Parameter Management**: SSM Parameter Store for configuration
- **Cross-Stack References**: Shared resource references

### CI/CD Pipeline

1. **Source Control**: Git-based version management
2. **Build Process**: CodeBuild for agent containerization
3. **Deployment**: CloudFormation stack updates
4. **Testing**: Automated integration tests

## Monitoring Architecture

### Observability Stack

- **CloudWatch Logs**: Centralized logging for all services
- **CloudWatch Metrics**: Custom business metrics
- **CloudWatch Dashboards**: Real-time system visualization
- **CloudWatch Alarms**: Automated alerting and notifications

### Key Metrics Tracked

- **Business Metrics**:
  - Feedback volume and trends
  - Average sentiment scores
  - Processing success rates
  - Report generation frequency

- **Technical Metrics**:
  - Lambda invocation counts and duration
  - DynamoDB read/write capacity
  - API Gateway error rates
  - AgentCore Runtime health

### Alerting Strategy

- **Critical Alerts**:
  - Agent runtime failures
  - High error rates (>5%)
  - Sentiment score drops below threshold

- **Warning Alerts**:
  - Processing delays (>30s)
  - High memory usage (>80%)
  - CRM integration failures

## Error Handling

### Error Types

1. **Infrastructure Errors**:
   - Lambda timeout/execution errors
   - DynamoDB throttling
   - S3 access denied

2. **Application Errors**:
   - Invalid feedback format
   - Sentiment analysis failures
   - CRM API errors

3. **Agent Errors**:
   - Tool execution failures
   - Memory access errors
   - Model invocation issues

### Error Recovery

- **Retry Logic**: Exponential backoff for transient failures
- **Dead Letter Queues**: Failed message handling
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Continue operation with reduced functionality

## Data Architecture

### Data Models

**Feedback Record**:
```json
{
  "feedback_id": "uuid",
  "customer_id": "string",
  "feedback_text": "string",
  "channel": "email|phone|chat|survey",
  "timestamp": "iso8601",
  "metadata": {
    "rating": "1-5",
    "category": "string",
    "priority": "low|medium|high"
  }
}
```

**Sentiment Analysis**:
```json
{
  "feedback_id": "uuid",
  "sentiment_score": 0.0-1.0,
  "sentiment_label": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "key_themes": ["array", "of", "themes"],
  "analysis_timestamp": "iso8601"
}
```

**System Configuration**:
```json
{
  "config_key": "crm_enabled",
  "config_value": "true|false",
  "updated_at": "iso8601",
  "updated_by": "user_id"
}
```

### Data Retention

- **Feedback Data**: 7 years (business requirement)
- **Analysis Results**: 3 years
- **System Logs**: 90 days
- **Temporary Files**: 24 hours

### Backup Strategy

- **DynamoDB**: Point-in-time recovery enabled
- **S3**: Versioning and cross-region replication
- **Critical Config**: SSM Parameter Store backups
- **Recovery Testing**: Quarterly disaster recovery tests

## Integration Architecture

### CRM Integration

**Supported Platforms**:
- Salesforce (REST API)
- HubSpot (API v3)
- Custom webhooks

**Integration Pattern**:
```
Agent Tool Call → CRM Lambda Function → CRM API → Response Processing → Database Update
```

### External API Integration

- **Authentication**: OAuth 2.0 / API keys
- **Rate Limiting**: Respects external API limits
- **Error Handling**: Retry with exponential backoff
- **Monitoring**: Integration health checks

## Development Architecture

### Local Development Environment

- **Agent Development**: Local Strands agent testing
- **Dashboard Development**: React development server
- **API Testing**: Local API Gateway simulation
- **Database**: Local DynamoDB for testing

### Testing Strategy

- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load testing with realistic data
- **Security Tests**: Vulnerability scanning and penetration testing

## Future Enhancements

### Scalability Improvements

- **Multi-region deployment** for global availability
- **Read replicas** for improved query performance
- **Caching layer** for frequently accessed data
- **Asynchronous processing** for large batch operations

### Feature Additions

- **Advanced analytics** with QuickSight integration
- **Multi-language support** for global deployments
- **Voice processing** for phone feedback
- **Advanced ML models** for deeper insights

### Operational Excellence

- **Infrastructure as Code** improvements
- **Automated compliance** checking
- **Enhanced monitoring** with custom dashboards
- **Self-healing capabilities** for common issues

## Conclusion

The InsightModAI Agent architecture provides a robust, scalable, and cost-effective solution for autonomous customer insights analysis. Built entirely on serverless AWS services, it offers enterprise-grade security, monitoring, and reliability while maintaining the flexibility to adapt to changing business needs.

The modular design allows for easy extension and customization, while the comprehensive monitoring and alerting ensure operational visibility and rapid issue resolution. The architecture successfully balances performance, cost, and maintainability requirements for a production AI system.
