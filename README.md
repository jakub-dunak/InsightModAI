# InsightModAI Agent

## 🚀 Autonomous AI Agent for Customer Insights Analysis

InsightModAI Agent is a serverless, autonomous AI agent that processes customer feedback, analyzes sentiment, identifies themes, and generates actionable insights for business operations. Built entirely on AWS with Amazon Bedrock AgentCore Runtime, it automates customer insights workflows with enterprise-grade reliability.

## ✨ Key Features

- **🧠 Autonomous Processing**: Automatically processes customer feedback using advanced AI models for sentiment analysis
- **📊 Real-time Insights**: Extracts themes, validates sentiment, and generates reports in real-time
- **🔗 CRM Integration**: Optional integration with Salesforce, HubSpot, and other CRM systems
- **📈 Visual Dashboard**: React-based admin interface for monitoring and configuration
- **🔒 Enterprise Security**: AWS Cognito authentication with least-privilege IAM roles
- **📊 Monitoring**: Comprehensive CloudWatch monitoring and alerting
- **💰 Cost Optimized**: Serverless architecture with pay-per-use pricing

## 🏗️ Architecture

### Core Components

1. **Amazon Bedrock AgentCore Runtime** - Containerized Strands agent for AI processing
2. **AWS Lambda Functions** - Serverless compute for feedback ingestion and processing
3. **Amazon DynamoDB** - NoSQL database for feedback storage and configuration
4. **Amazon S3** - Object storage for processed insights, reports, and static assets
5. **Amazon API Gateway** - REST API for external integrations
6. **AWS Amplify** - React dashboard hosting with Cognito authentication
7. **Amazon CloudWatch** - Monitoring, logging, and alerting

### Data Flow

```
Feedback Upload → API Gateway → Lambda (Ingestion) → DynamoDB (Storage)
                                                          ↓
AgentCore Runtime (Strands Agent) → Sentiment Analysis → DynamoDB (Results)
                                                          ↓
Report Generation → S3 (Reports) → React Dashboard (Visualization)
```

## 🚀 Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+ and npm (for React dashboard development)
- AWS CLI configured with credentials
- GitHub account (for GitHub Actions OIDC deployment)

### Deployment

The project uses **GitHub Actions** for automated deployment with OIDC authentication.

1. **Set up AWS OIDC Provider** (one-time setup)
   
   Follow the instructions in `docs/OIDC-SETUP.md` to configure GitHub OIDC authentication in your AWS account.

2. **Configure GitHub Secrets**
   
   Add the following secret to your GitHub repository:
   - `AWS_ACCOUNT_ID`: Your AWS account ID

3. **Deploy via GitHub Actions**
   
   ```bash
   # Clone the repository
   git clone https://github.com/your-org/InsightModAI.git
   cd InsightModAI

   # Push to GitHub to trigger deployment
   git push origin main

   # Or manually trigger deployment
   # Go to Actions → Deploy InsightModAI Agent → Run workflow
   # Select environment (dev/prod)
   ```

### Manual Deployment

If you prefer to deploy manually without GitHub Actions:

```bash
# Package CloudFormation template
aws cloudformation package \
  --template-file cloudformation/template.yaml \
  --s3-bucket insightmodai-deployment-us-west-2-dev \
  --output-template-file packaged-template.yaml \
  --region us-west-2

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file packaged-template.yaml \
  --stack-name insightmodai-agent-dev \
  --parameter-overrides \
    EnvironmentName=dev \
    AdminEmail=admin@yourcompany.com \
    BedrockModelId=us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
    CognitoDomainName=insightmodai-dev-$(openssl rand -hex 2) \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-west-2
```

## 📊 Usage Examples

### 1. Submit Feedback via API

```bash
curl -X POST https://your-api-id.execute-api.us-west-2.amazonaws.com/prod/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_12345",
    "feedback_text": "Great product! Love the new features.",
    "source": "web_survey",
    "timestamp": "2024-10-20T10:00:00Z"
  }'
```

### 2. Query Sentiment Trends

```bash
curl -X GET https://your-api-id.execute-api.us-west-2.amazonaws.com/prod/insights/trends \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Generate Report

```bash
curl -X POST https://your-api-id.execute-api.us-west-2.amazonaws.com/prod/insights/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "report_type": "weekly_sentiment",
    "start_date": "2024-10-13",
    "end_date": "2024-10-20"
  }'
```

## 🎯 Agent Configuration

Configure the agent behavior via the admin dashboard or API:

```json
{
  "sentiment_threshold": 0.7,
  "theme_extraction_enabled": true,
  "auto_report_generation": true,
  "crm_integration": {
    "enabled": false,
    "provider": "salesforce",
    "sync_interval": "hourly"
  },
  "notification_preferences": {
    "negative_sentiment_alert": true,
    "threshold": -0.5
  }
}
```

## 🔧 Tech Stack

### AI & Processing
- **Amazon Bedrock** - Claude 3.5 Sonnet for sentiment analysis and theme extraction
- **AgentCore Runtime** - Containerized Strands framework for agent orchestration
- **AWS Lambda** - Serverless Python 3.11 functions

### Data & Storage
- **Amazon DynamoDB** - NoSQL database with on-demand billing
- **Amazon S3** - Object storage with lifecycle policies
- **Amazon ECR** - Container registry for AgentCore images

### API & Integration
- **Amazon API Gateway** - REST API with CORS support
- **AWS Amplify** - React dashboard hosting
- **Amazon Cognito** - User authentication and authorization

### DevOps & Monitoring
- **GitHub Actions** - CI/CD with OIDC authentication
- **Amazon CloudWatch** - Logs, metrics, and alarms
- **AWS CloudFormation** - Infrastructure as Code

## 📈 Monitoring & Observability

The system includes comprehensive monitoring:

- **Dashboard Metrics**: Real-time feedback processing rates, sentiment distributions
- **CloudWatch Alarms**: Automated alerts for errors, latency spikes, negative sentiment trends
- **Logs**: Structured logging for all Lambda functions and agent operations
- **Tracing**: X-Ray integration for distributed tracing (optional)

Access the CloudWatch Dashboard:
```bash
aws cloudwatch get-dashboard \
  --dashboard-name insightmodai-agent-dev-dashboard \
  --region us-west-2
```

## 🔒 Security

- **Authentication**: AWS Cognito with hosted UI
- **Authorization**: IAM roles with least-privilege policies
- **Encryption**: Data encrypted at rest (S3, DynamoDB) and in transit (TLS 1.2+)
- **API Security**: API Gateway with JWT validation
- **Secrets Management**: AWS Secrets Manager for CRM credentials
- **Network**: VPC endpoints for private communication (optional)

## 💰 Cost Optimization

**Estimated Monthly Costs (Development Environment):**
- Lambda: ~$0.50 (pay-per-invocation)
- Bedrock: ~$2.00 (pay-per-token)
- DynamoDB: ~$1.00 (on-demand)
- S3: ~$0.10 (storage + requests)
- **Total: ~$3.60/month** (near-zero when idle)

**Production Scale (10,000 feedback items/month):**
- Lambda: ~$5.00
- Bedrock: ~$20.00
- DynamoDB: ~$10.00
- S3: ~$1.00
- API Gateway: ~$3.50
- **Total: ~$39.50/month**

## 🧪 Testing

### Run Unit Tests
```bash
cd agent
uv run python -m pytest tests/
```

### Test API Endpoints
```bash
# Test feedback ingestion
npm run test:api -- --endpoint feedback

# Test sentiment analysis
npm run test:api -- --endpoint insights
```

### Load Testing
```bash
# Run load test with 100 requests
npm run test:load -- --requests 100 --concurrency 10
```

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Detailed system architecture
- **[CI/CD Setup](docs/CI-CD.md)** - GitHub Actions workflow documentation
- **[OIDC Setup](docs/OIDC-SETUP.md)** - GitHub OIDC authentication setup
- **[Demo Script](docs/DEMO_SCRIPT.md)** - 3-minute demo walkthrough

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

### 📋 License Summary

**✅ Allowed for Non-Commercial Use:**
- Educational and research purposes
- Personal projects and learning
- Non-profit organizations
- Sharing and adaptation with attribution

**❌ Not Allowed for Commercial Use:**
- Any commercial software development
- For-profit business applications
- Commercial services or products
- Monetized deployments

### 📝 Attribution Requirements

When using this software for non-commercial purposes, provide attribution:

```
InsightModAI Agent - AI-Powered Customer Insights Analysis
Copyright (c) 2024 InsightModAI
Licensed under CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)
```

### 💼 Commercial Licensing

For commercial use, please contact:
- **Email**: licensing@insightmodai.com
- **Purpose**: Commercial licensing inquiries

---

**Full license text:** See the [LICENSE](LICENSE) file for complete terms and conditions.

**License URL:** https://creativecommons.org/licenses/by-nc/4.0/

## 🙏 Acknowledgments

- **Amazon Bedrock** for providing state-of-the-art AI capabilities
- **Strands Framework** for simplifying agent development
- **AWS Serverless** for enabling cost-effective cloud solutions
- **React Community** for the beautiful UI components

## 📞 Support

For questions or issues:
- Create an issue in the GitHub repository
- Contact the development team at support@insightmodai.com

---

**Built with ❤️ using AWS Serverless and AI technologies**
