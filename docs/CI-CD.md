# CI/CD Pipeline Documentation

## Overview

InsightModAI Agent includes a comprehensive GitHub Actions workflow that automates the entire deployment process. This CI/CD pipeline handles building, testing, containerization, and deployment to AWS using Infrastructure as Code.

## GitHub Actions Workflow

### Workflow Triggers

The pipeline is triggered by:

- **Push to `main` branch**: Automatic deployment to production
- **Pull requests to `main`**: Validation and testing only (no deployment)
- **Manual trigger**: Deploy to specific environments or destroy stacks

### Pipeline Stages

#### 1. Validate CloudFormation Template
- **Purpose**: Ensure template syntax and AWS resource validity
- **Actions**:
  - Checkout repository code
  - Configure AWS credentials
  - Validate CloudFormation template using `aws cloudformation validate-template`
- **Output**: Template validity status

#### 2. Build Frontend
- **Purpose**: Build and test React dashboard
- **Actions**:
  - Setup Node.js environment
  - Install npm dependencies with caching
  - Run linting (warnings allowed to continue)
  - Execute test suite
  - Build production React application
- **Artifacts**: Frontend build files for deployment

#### 3. Build Agent Container
- **Purpose**: Containerize the Strands agent for AgentCore Runtime
- **Actions**:
  - Setup Python environment
  - Install `uv` package manager
  - Install agent dependencies
  - Run agent tests
  - Build Docker container with ARM64 support
  - Save container image as artifact
- **Artifacts**: Docker container image

#### 4. Deploy to AWS
- **Purpose**: Deploy complete infrastructure to AWS
- **Actions**:
  - Download build artifacts
  - Load Docker container image
  - Determine stack operation (create/update)
  - Deploy CloudFormation stack with parameters
  - Wait for stack completion
  - Extract stack outputs (URLs, ARNs)
  - Create Cognito admin user (if new deployment)
  - Test deployment endpoints
  - Generate deployment summary
- **Outputs**:
  - Deployment summary with access URLs
  - Stack outputs for subsequent workflows

#### 5. Cleanup (On Failure)
- **Purpose**: Clean up failed deployments
- **Actions**:
  - Delete failed CloudFormation stack
  - Remove any partial resources

#### 6. Destroy Stack (Manual)
- **Purpose**: Complete stack destruction for cleanup
- **Actions**:
  - Delete CloudFormation stack
  - Wait for deletion completion

## Manual Deployment Options

### Environment-Specific Deployment

You can manually trigger deployments to specific environments:

1. **Go to Actions Tab**: Navigate to your repository's Actions tab
2. **Select Workflow**: Choose "Deploy InsightModAI Agent"
3. **Click "Run workflow"**
4. **Configure Parameters**:
   - **Environment**: Choose `dev`, `staging`, or `prod`
   - **Action**: Choose `deploy`, `destroy`, or `validate`

### Stack Operations

#### Create New Stack
```bash
aws cloudformation create-stack \
  --stack-name insightmodai-agent-prod \
  --template-body file://cloudformation/template.yaml \
  --parameters \
    ParameterKey=AdminEmail,ParameterValue=admin@yourcompany.com \
    ParameterKey=BedrockModelId,ParameterValue=us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
    ParameterKey=EnvironmentName,ParameterValue=prod \
    ParameterKey=EnableCRM,ParameterValue=false \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --region us-west-2
```

#### Update Existing Stack
```bash
aws cloudformation update-stack \
  --stack-name insightmodai-agent-prod \
  --template-body file://cloudformation/template.yaml \
  --parameters \
    ParameterKey=AdminEmail,ParameterValue=admin@yourcompany.com \
    ParameterKey=BedrockModelId,ParameterValue=us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
    ParameterKey=EnvironmentName,ParameterValue=prod \
    ParameterKey=EnableCRM,ParameterValue=true \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --region us-west-2
```

#### Delete Stack
```bash
aws cloudformation delete-stack \
  --stack-name insightmodai-agent-prod \
  --region us-west-2

aws cloudformation wait stack-delete-complete \
  --stack-name insightmodai-agent-prod \
  --region us-west-2
```

## Required GitHub Secrets

Configure these secrets in your repository settings:

### Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

### Optional Secrets

| Secret | Description | Default |
|--------|-------------|---------|
| `ADMIN_EMAIL` | Admin email for Cognito user | `admin@insightmodai.com` |
| `BEDROCK_MODEL_ID` | Bedrock model to use | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` |
| `ENABLE_CRM` | Enable CRM integration | `false` |

## Deployment Environments

### Development (`dev`)
- **Purpose**: Development and testing
- **Protection**: Required reviewers, 5-minute wait timer
- **Stack Name**: `insightmodai-agent-dev`
- **Use Case**: Feature development, testing new configurations

### Staging (`staging`)
- **Purpose**: Pre-production validation
- **Protection**: Required reviewers, 10-minute wait timer
- **Stack Name**: `insightmodai-agent-staging`
- **Use Case**: Integration testing, performance validation

### Production (`prod`)
- **Purpose**: Live production environment
- **Protection**: Required reviewers, 30-minute wait timer
- **Stack Name**: `insightmodai-agent-prod`
- **Use Case**: Production deployments, customer-facing features

## Workflow Features

### Automatic Rollback
- Failed deployments are automatically cleaned up
- Stack deletion on deployment failure
- Resource cleanup to prevent orphaned resources

### Artifact Management
- Frontend build artifacts retained for 7 days
- Agent container images retained for 7 days
- Deployment summaries retained for 30 days

### Environment Protection
- Required reviewers for sensitive environments
- Wait timers prevent accidental deployments
- Manual approval gates for production

### Monitoring Integration
- Deployment summaries posted to PR comments
- Stack outputs captured for debugging
- Test results included in workflow logs

## Troubleshooting

### Common Issues

#### 1. CloudFormation Validation Fails
```bash
# Check template syntax
aws cloudformation validate-template \
  --template-body file://cloudformation/template.yaml

# Check AWS service limits
aws service-quotas list-service-quotas \
  --service-code cloudformation
```

#### 2. Docker Build Fails
```bash
# Check Docker installation
docker --version

# Build manually for debugging
cd agent
docker build -t insightmodai-agent:debug .
```

#### 3. AWS Credentials Issues
```bash
# Test AWS CLI configuration
aws sts get-caller-identity

# Verify permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:policy/InsightModAI-Policy \
  --action-names cloudformation:CreateStack \
  --resource-arns "*"
```

#### 4. AgentCore Runtime Issues
```bash
# Check ECR repository
aws ecr describe-repositories \
  --repository-names insightmodai-agent-prod

# Check runtime status
aws bedrock-agentcore describe-agent-runtime \
  --agent-runtime-arn YOUR_RUNTIME_ARN
```

### Debug Commands

#### View Workflow Logs
```bash
# View recent workflow runs
gh run list --limit 5

# View specific run logs
gh run view RUN_ID --log

# Download workflow artifacts
gh run download RUN_ID
```

#### Check Stack Status
```bash
# Get stack status
aws cloudformation describe-stacks \
  --stack-name insightmodai-agent-prod \
  --query 'Stacks[0].StackStatus'

# View stack events
aws cloudformation describe-stack-events \
  --stack-name insightmodai-agent-prod \
  --max-items 10
```

#### Test API Endpoints
```bash
# Test API Gateway
curl -I https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/prod/feedback

# Test agent health
curl http://localhost:8080/ping  # If running locally
```

## Performance Optimization

### Build Caching
- **Node.js**: npm cache enabled for faster installs
- **Docker**: Multi-stage builds for smaller images
- **Python**: uv for fast dependency management

### Parallel Execution
- Frontend and agent builds run in parallel
- Validation happens before expensive operations
- Cleanup runs only on failure

### Resource Limits
- **Memory**: Optimized for GitHub Actions runners
- **Timeout**: Appropriate timeouts for each step
- **Retries**: Automatic retries for transient failures

## Security Considerations

### Secret Management
- All AWS credentials stored as GitHub secrets
- No hardcoded credentials in workflow files
- Secrets automatically masked in logs

### Permission Scoping
- Minimal required IAM permissions for deployment
- Environment-specific protection rules
- Audit logging for all deployment actions

### Network Security
- VPC endpoints for internal AWS communications
- Private ECR repositories for container storage
- Secure parameter passing between workflow steps

## Cost Management

### AWS Costs by Environment

| Environment | Estimated Monthly Cost | Use Case |
|-------------|----------------------|----------|
| Dev | $10-25 | Development and testing |
| Staging | $20-50 | Pre-production validation |
| Prod | $50-200 | Production deployment |

### Cost Optimization Strategies

1. **On-Demand Resources**: Pay only for actual usage
2. **Intelligent Tiering**: Automatic S3 storage optimization
3. **Lambda Memory Tuning**: Right-size function memory
4. **Build Caching**: Reduce CI/CD costs

## Maintenance

### Regular Updates

1. **Dependencies**: Update npm and Python packages monthly
2. **Base Images**: Update Docker base images quarterly
3. **AWS Services**: Keep up with service updates and new features
4. **Security**: Regular security patches and vulnerability scans

### Monitoring Setup

1. **CloudWatch Alarms**: Set up for deployment failures
2. **Budget Alerts**: Monitor AWS costs by environment
3. **Performance Metrics**: Track deployment times and success rates
4. **Error Tracking**: Monitor and alert on deployment errors

### Backup Strategy

1. **Code Repository**: GitHub repository backup
2. **Configuration**: SSM Parameter Store backups
3. **Data**: DynamoDB point-in-time recovery
4. **Artifacts**: S3 versioning for build artifacts

## Support and Troubleshooting

### Getting Help

1. **Workflow Logs**: Check GitHub Actions logs for errors
2. **CloudWatch Logs**: Monitor Lambda function logs
3. **Stack Events**: Review CloudFormation stack events
4. **AWS Support**: Use AWS support for infrastructure issues

### Common Solutions

- **Permission Denied**: Verify IAM permissions and secret configuration
- **Build Failures**: Check dependency versions and Docker configurations
- **Deployment Timeouts**: Monitor AWS service health and resource limits
- **Access Issues**: Verify Cognito user creation and stack outputs

## Best Practices

### Development Workflow

1. **Feature Branches**: Create feature branches for new work
2. **Pull Requests**: Require PR reviews for main branch merges
3. **Testing**: Run tests before merging to main
4. **Documentation**: Update docs for significant changes

### Deployment Strategy

1. **Environment Promotion**: Dev → Staging → Prod
2. **Rollback Plan**: Always have a rollback strategy
3. **Gradual Rollout**: Use canary deployments for major changes
4. **Monitoring**: Set up comprehensive monitoring before deployment

### Security

1. **Least Privilege**: Use minimal required permissions
2. **Secret Rotation**: Regularly rotate AWS credentials
3. **Audit Logging**: Enable CloudTrail for all operations
4. **Vulnerability Scanning**: Regular security scans of code and containers

---

This CI/CD pipeline provides a robust, automated deployment process for the InsightModAI Agent, ensuring reliable, secure, and cost-effective deployments across all environments.
