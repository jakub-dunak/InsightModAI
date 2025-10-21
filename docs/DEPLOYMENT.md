# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the InsightModAI Agent to AWS using CloudFormation. The deployment process creates a complete serverless infrastructure including Lambda functions, DynamoDB tables, S3 buckets, API Gateway, Cognito authentication, and AWS Amplify for the React dashboard.

## Prerequisites

### Required Tools
- **AWS CLI** (version 2.0+)
- **Node.js** (version 16+)
- **npm** (version 8+)
- **Python** (version 3.11+) - for local agent development
- **Docker** - for containerizing the Strands agent
- **Git** - for version control

### AWS Requirements
- **AWS Account** with administrator access
- **IAM permissions** for CloudFormation, Lambda, DynamoDB, S3, API Gateway, Cognito, Amplify, ECR, CodeBuild
- **Bedrock access** - Ensure your AWS account has access to Amazon Bedrock in your region
- **Region support** - Bedrock AgentCore Runtime is available in select regions (us-west-2, us-west-2, eu-west-1)

### Environment Setup

1. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, default region, and output format
   ```

2. **Verify Bedrock Access**
   ```bash
   # Check if Bedrock is available in your region
   aws bedrock list-foundation-models --region us-west-2
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/InsightModAI.git
   cd InsightModAI
   ```

## Deployment Steps

### Step 1: Deploy CloudFormation Stack

Deploy the main infrastructure using the CloudFormation template.

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name insightmodai-agent \
  --template-body file://cloudformation/template.yaml \
  --parameters \
    ParameterKey=AdminEmail,ParameterValue=admin@yourcompany.com \
    ParameterKey=BedrockModelId,ParameterValue=amazon.titan-text-premier-v1:0 \
    ParameterKey=EnvironmentName,ParameterValue=prod \
    ParameterKey=EnableCRM,ParameterValue=false \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --region us-west-2
```

**Parameter Explanations:**

- `AdminEmail`: Email address for the initial Cognito admin user
- `BedrockModelId`: Bedrock model to use (Amazon Titan Text Premier recommended)
- `EnvironmentName`: Environment identifier (dev/staging/prod)
- `EnableCRM`: Enable CRM integration (true/false)

**Alternative: Using AWS Console**
1. Open AWS CloudFormation Console
2. Click "Create Stack" → "With new resources"
3. Upload `cloudformation/template.yaml`
4. Enter parameter values
5. Click "Create Stack"

### Step 2: Monitor Deployment Progress

Monitor the stack creation progress:

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name insightmodai-agent \
  --query 'Stacks[0].StackStatus' \
  --output text

# View stack events (for troubleshooting)
aws cloudformation describe-stack-events \
  --stack-name insightmodai-agent \
  --max-items 10
```

**Expected Duration**: 10-15 minutes

**Common Issues**:
- IAM permission errors - Ensure your user/role has the required permissions
- Bedrock access - Verify Bedrock is enabled in your account and region
- Resource limits - Check if you've hit any AWS service limits

### Step 3: Domain Generation & Deployment

The deployment process will automatically:

1. **Generate a unique Cognito domain** by checking AWS for available domains based on your stack name
2. **Deploy all infrastructure** using the generated domain
3. **Create Cognito authentication** with the unique domain

Once deployment completes, retrieve the resource URLs and IDs:

```bash
aws cloudformation describe-stacks \
  --stack-name insightmodai-agent \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Key Outputs to Note:**
- `ApiEndpoint`: API Gateway URL for submitting feedback
- `AmplifyAppURL`: React dashboard URL
- `UserPoolId`: Cognito User Pool ID
- `CognitoDomain`: Auto-generated unique Cognito hosted UI domain for authentication
- `ECRRepositoryUri`: Container registry for agent images

### Step 4: Create Admin User

Create the initial admin user in Cognito:

```bash
# Get User Pool ID from stack outputs
USER_POOL_ID="your-user-pool-id-from-outputs"

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@yourcompany.com \
  --user-attributes \
    Name=email,Value=admin@yourcompany.com \
    Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region us-west-2
```

### Step 5: Set Permanent Password

The admin user needs to set a permanent password on first login:

1. Open the Amplify dashboard URL in your browser
2. Enter email: `admin@yourcompany.com`
3. Enter temporary password: `TempPass123!`
4. Set a new permanent password (minimum 8 characters, mixed case, numbers, symbols)

### Step 6: Verify Deployment

Test the deployed system:

1. **Dashboard Access**
   - Open the Amplify URL in your browser
   - Sign in with admin credentials
   - Verify dashboard loads successfully

2. **API Testing**
   ```bash
   # Test feedback submission
   API_ENDPOINT="your-api-endpoint-from-outputs"

   curl -X POST $API_ENDPOINT/feedback \
     -H "Content-Type: application/json" \
     -d '{
       "customer_id": "test_customer_001",
       "feedback_text": "Excellent service! The team was very helpful and resolved my issue quickly. Highly recommended!",
       "channel": "email",
       "rating": 5
     }'

   # Check insights
   curl -X GET $API_ENDPOINT/insights
   ```

3. **Agent Health Check**
   ```bash
   # The agent container should be accessible via the runtime endpoint
   # This will be tested through the dashboard observability features
   ```

## Post-Deployment Configuration

### Configure CRM Integration (Optional)

1. **Enable CRM Module**
   - Open dashboard → Module Control
   - Enable "CRM Integration" toggle
   - Save configuration

2. **Set CRM Credentials**
   ```bash
   # Update DynamoDB config table
   aws dynamodb put-item \
     --table-name insightmodai-agent-config-prod \
     --item '{
       "config_key": {"S": "crm_provider"},
       "config_value": {"S": "salesforce"}
     }'

   # Add API credentials
   aws dynamodb put-item \
     --table-name insightmodai-agent-config-prod \
     --item '{
       "config_key": {"S": "crm_access_token"},
       "config_value": {"S": "your_crm_token"}
     }'
   ```

### Custom Domain (Optional)

For production deployments, configure custom domains:

1. **API Gateway Custom Domain**
   ```bash
   # Create custom domain for API Gateway
   aws apigateway create-domain-name \
     --domain-name api.yourcompany.com \
     --certificate-arn your-acm-certificate-arn
   ```

2. **Amplify Custom Domain**
   ```bash
   # Add custom domain to Amplify app
   aws amplify create-domain-association \
     --app-id your-amplify-app-id \
     --domain-name dashboard.yourcompany.com \
     --sub-domain-settings '[{"prefix": "", "branchName": "main"}]'
   ```

## Troubleshooting

### Common Issues

**1. Stack Creation Fails**
- Check IAM permissions
- Verify Bedrock access in your region
- Check CloudFormation service limits
- Review stack events for specific error messages

**2. Dashboard Won't Load**
- Verify Amplify build completed successfully
- Check browser console for JavaScript errors
- Ensure Cognito user exists and is confirmed

**3. API Calls Fail**
- Verify API Gateway deployment completed
- Check API Gateway logs in CloudWatch
- Ensure Lambda functions have proper IAM permissions

**4. Agent Runtime Issues**
- Check ECR repository has the agent image
- Verify AgentCore Runtime role permissions
- Check CloudWatch logs for agent container

### Debugging Commands

```bash
# Check Lambda function logs
aws logs tail /aws/lambda/insightmodai-feedback-ingestion-prod --follow

# Check API Gateway logs
aws logs tail /aws/apigateway/insightmodai-api-prod --follow

# Check agent container logs
aws logs describe-log-groups --log-group-name-prefix /aws/bedrock-agentcore

# Test Cognito authentication
aws cognito-idp list-users --user-pool-id your-user-pool-id
```

### Support Resources

- **AWS Documentation**: [Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/)
- **AWS Forums**: Search for "Bedrock AgentCore" issues
- **GitHub Issues**: Report bugs and feature requests
- **Email Support**: support@insightmodai.com

## Cleanup

To remove the entire deployment:

```bash
# Delete CloudFormation stack (this removes all resources)
aws cloudformation delete-stack \
  --stack-name insightmodai-agent \
  --region us-west-2

# Monitor deletion progress
aws cloudformation describe-stacks \
  --stack-name insightmodai-agent \
  --query 'Stacks[0].StackStatus'
```

**Note**: Stack deletion may take 5-10 minutes. Some resources like S3 buckets may need manual deletion if they contain data.

## Security Considerations

### Production Checklist

- [ ] Enable MFA for Cognito users
- [ ] Configure custom domain with SSL certificate
- [ ] Set up CloudWatch alarms for monitoring
- [ ] Enable CloudTrail for audit logging
- [ ] Review and minimize IAM permissions
- [ ] Enable S3 bucket versioning and lifecycle policies
- [ ] Configure VPC endpoints for internal communications
- [ ] Set up backup and disaster recovery procedures

### Compliance

The deployment includes:
- GDPR-ready data handling practices
- SOC 2 Type II compliance framework
- Audit logging for all operations
- Data encryption at rest and in transit

## Performance Optimization

### Cost Optimization Tips

1. **Lambda Functions**
   - Monitor memory usage and adjust allocations
   - Use provisioned concurrency only when needed
   - Enable Lambda Insights for detailed monitoring

2. **DynamoDB**
   - Monitor read/write capacity
   - Consider point-in-time recovery for production
   - Use global tables for multi-region deployments

3. **S3**
   - Enable Intelligent Tiering for cost savings
   - Set lifecycle policies for old data
   - Use S3 Analytics to monitor access patterns

### Scaling Considerations

- **Auto-scaling**: Lambda and DynamoDB scale automatically
- **Rate limiting**: API Gateway handles traffic spikes
- **Monitoring**: Set up CloudWatch alarms for capacity planning
- **CDN**: Consider CloudFront for global dashboard access

## Next Steps

After successful deployment:

1. **Explore Dashboard**: Familiarize yourself with all dashboard features
2. **Submit Test Data**: Use the API to submit sample feedback
3. **Configure Alerts**: Set up monitoring and alerting rules
4. **Enable Features**: Configure CRM integration if needed
5. **Performance Testing**: Load test with realistic traffic patterns
6. **Documentation**: Update internal documentation with deployment details

## Support

For issues during deployment:

1. Check the troubleshooting section above
2. Review CloudWatch logs for error details
3. Verify all prerequisites are met
4. Check AWS service status for regional outages
5. Contact support if issues persist

**Remember**: The deployment creates a production-ready system. Always test thoroughly in a staging environment before production deployment.
