# GlobalInvoiceAI Agent

## 🚀 Autonomous AI Agent for Invoice Management & Insights

GlobalInvoiceAI Agent is a serverless, autonomous AI agent that processes invoices, extracts key information, and provides intelligent insights for business operations. Built entirely on AWS with Amazon Bedrock AgentCore Runtime, it automates invoice processing workflows with enterprise-grade reliability.

## ✨ Key Features

- **🧠 Autonomous Processing**: Automatically processes invoices using advanced AI models for data extraction
- **📊 Real-time Insights**: Extracts invoice data, validates information, and generates reports in real-time
- **🔗 ERP Integration**: Optional integration with SAP, Oracle, and other ERP systems
- **📈 Visual Dashboard**: React-based admin interface for monitoring and configuration
- **🔒 Enterprise Security**: AWS Cognito authentication with least-privilege IAM roles
- **📊 Monitoring**: Comprehensive CloudWatch monitoring and alerting
- **💰 Cost Optimized**: Serverless architecture with pay-per-use pricing

## 🏗️ Architecture

### Core Components

1. **Amazon Bedrock AgentCore Runtime** - Containerized Strands agent for AI processing
2. **AWS Lambda Functions** - Serverless compute for invoice ingestion and processing
3. **Amazon DynamoDB** - NoSQL database for invoice storage and configuration
4. **Amazon S3** - Object storage for processed invoices, reports, and static assets
5. **Amazon API Gateway** - REST API for external integrations
6. **AWS Amplify** - React dashboard hosting with Cognito authentication
7. **Amazon CloudWatch** - Monitoring, logging, and alerting

### Data Flow

```
Invoice Upload → API Gateway → Lambda (Ingestion) → DynamoDB (Storage)
                                                           ↓
AgentCore Runtime (Strands Agent) → Data Extraction → DynamoDB (Results)
                                                           ↓
Report Generation → S3 (Reports) → React Dashboard (Visualization)
```

## 🚀 Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- Node.js 16+ and npm (for React dashboard development)
- AWS CLI configured with credentials

### Deployment

1. **Deploy Infrastructure**
   ```bash
   # Clone the repository
   git clone https://github.com/your-org/GlobalInvoiceAI.git
   cd GlobalInvoiceAI

   # Deploy CloudFormation stack
   aws cloudformation create-stack \
     --stack-name globalinvoiceai-agent \
     --template-body file://cloudformation/template.yaml \
     --parameters \
       ParameterKey=AdminEmail,ParameterValue=admin@yourcompany.com \
       ParameterKey=EnvironmentName,ParameterValue=prod \
       ParameterKey=EnableCRM,ParameterValue=false \
     --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
   ```

2. **Create Admin User**
   ```bash
   # Get stack outputs
   aws cloudformation describe-stacks --stack-name globalinvoiceai-agent --query 'Stacks[0].Outputs'

   # Create Cognito user (replace with actual UserPoolId)
   aws cognito-idp admin-create-user \
     --user-pool-id YOUR_USER_POOL_ID \
     --username admin@yourcompany.com \
     --user-attributes Name=email,Value=admin@yourcompany.com Name=email_verified,Value=true \
     --temporary-password TempPass123! \
     --message-action SUPPRESS
   ```

3. **Access Dashboard**
   - Open the Amplify URL from stack outputs in your browser
   - Sign in with the admin email and temporary password
   - Set a permanent password when prompted

4. **Test the System**
   ```bash
   # Submit sample invoice via API Gateway
   curl -X POST https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/invoices \
     -H "Content-Type: application/json" \
     -d '{
       "invoice_number": "INV-2024-001",
       "vendor_name": "Acme Corp",
       "invoice_date": "2024-01-15",
       "amount": 1250.00,
       "currency": "USD"
     }'

   # Check processing results
   curl -X GET https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/insights
   ```

## 🔧 Configuration

### Module Control

Access the **Module Control** panel in the dashboard to configure:

- **ERP Integration**: Enable/disable SAP/Oracle integration
- **Auto Processing**: Enable/disable automatic invoice processing
- **Validation Rules**: Set thresholds for invoice validation alerts
- **Processing Settings**: Configure batch sizes and timeouts

### ERP Integration Setup

1. Enable ERP integration in the Module Control panel
2. Configure ERP credentials in the DynamoDB config table:
   ```json
   {
     "config_key": "erp_provider",
     "config_value": "sap"
   }
   {
     "config_key": "erp_api_key",
     "config_value": "your_erp_api_key"
   }
   ```

## 📊 Dashboard Features

### Dashboard Overview
- **System Status**: Real-time health checks of all components
- **Key Metrics**: Total invoices processed, average processing times, validation success rates
- **Recent Activity**: Latest invoice processing events
- **Alerts**: Critical system alerts and notifications

### Module Control Panel
- Toggle system modules on/off
- Configure validation rules
- Set processing parameters
- Manage ERP integrations

### Observability Dashboard
- Agent execution traces
- Tool invocation logs
- Session tracking
- Real-time streaming responses

### Monitoring Dashboard
- Invoice processing trends
- Validation accuracy metrics
- Processing latency graphs
- CloudWatch alarm status

### Memory Viewer
- Processing history
- Memory namespace browsing
- Session summaries
- Pattern insights

## 🔒 Security

### Authentication
- AWS Cognito User Pool with MFA support
- Role-based access control (RBAC)
- Secure token-based API authentication

### Data Protection
- All data encrypted at rest (KMS)
- TLS 1.3 for all data in transit
- Least-privilege IAM roles
- VPC endpoints for internal communications

### Compliance
- GDPR-ready data handling
- SOC 2 Type II compliance framework
- Audit logging for all operations

## 📈 Performance & Cost

### Performance Characteristics
- **Sub-second API responses** for invoice ingestion
- **< 30 second processing** for complex data extraction
- **99.9% uptime** with multi-AZ deployment
- **Auto-scaling** based on demand

### Cost Optimization
- **Serverless architecture** - pay only for usage
- **Intelligent Tiering** on S3 for cost-effective storage
- **On-demand DynamoDB** billing
- **Free tier** for CloudWatch basic monitoring

### Estimated Monthly Costs (Small Scale)
- **Lambda**: $5-20 (1M invocations)
- **DynamoDB**: $1-5 (on-demand)
- **S3**: $1-2 (5GB storage)
- **Bedrock**: $10-50 (depending on usage)
- **API Gateway**: $3-5 (1M requests)
- **Cognito**: Free tier covers basic usage

## 🛠️ Development

### Local Development Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### Agent Development

The Strands agent is containerized and can be developed locally:

```bash
# Install Python dependencies
pip install -r agent/requirements.txt

# Run agent locally
cd agent
python insights_agent.py

# Test agent endpoints
curl http://localhost:8080/ping
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "Hello"}}'
```

## 🧪 Testing

### Automated Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Manual Testing
1. Submit feedback via API
2. Check processing in dashboard
3. Verify sentiment analysis results
4. Test CRM integration (if enabled)

## 📋 Deployment Guide

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🏛️ Architecture Details

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for comprehensive architecture documentation.

## 🎬 Demo Script

See [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for a complete 3-minute demo walkthrough.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

### What This Means

- ✅ **You are free to:**
  - Share — copy and redistribute the material in any medium or format
  - Adapt — remix, transform, and build upon the material

- ❌ **Under the following terms:**
  - **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
  - **NonCommercial** — You may not use the material for commercial purposes
  - **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original

For full license details, see the [LICENSE](LICENSE) file.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@insightmodai.com

## 🔄 Updates

### Version 1.0.0
- Initial release with AgentCore Runtime integration
- Complete serverless architecture
- React admin dashboard
- CRM integration framework
- Comprehensive monitoring

---

**Built with ❤️ using AWS Serverless services**
