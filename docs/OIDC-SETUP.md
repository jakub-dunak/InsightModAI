# GitHub OIDC Setup for AWS

This document outlines the steps to configure GitHub OIDC (OpenID Connect) authentication with AWS for secure CI/CD deployments.

## Overview

GitHub Actions can authenticate to AWS using OIDC instead of storing long-lived AWS credentials as GitHub secrets. This provides better security by eliminating the need for permanent access keys.

## Prerequisites

- AWS CLI installed and configured
- GitHub repository access
- Administrator access to AWS account

## Step 1: Create IAM OIDC Identity Provider

First, create an OIDC identity provider in AWS IAM:

```bash
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

## Step 2: Create IAM Role for GitHub Actions

Create a trust policy document (`trust-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG>/<GITHUB_REPO>:ref:refs/heads/main"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG>/<GITHUB_REPO>:ref:refs/heads/*"
        }
      }
    }
  ]
}
```

Create the IAM role:

```bash
aws iam create-role \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --assume-role-policy-document file://trust-policy.json \
    --description "Role for GitHub Actions OIDC authentication"
```

## Step 3: Attach Required Policies

Attach the necessary permissions for CloudFormation deployment:

```bash
aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
    --role-name InsightModAI-GitHubActionsRole-Prod \
    --policy-arn arn:aws:iam::aws:policy/AWSAmplifyAdminAccess
```

## Step 4: Create Development Role (Optional)

For development deployments, create a separate role with more restricted permissions:

```bash
# Create trust policy for dev environment
aws iam create-role \
    --role-name InsightModAI-GitHubActionsRole-Dev \
    --assume-role-policy-document file://trust-policy-dev.json \
    --description "Role for GitHub Actions OIDC authentication (Dev)"
```

Attach appropriate policies for development (same as production but potentially with fewer permissions).

## Step 5: Update Environment Configuration

The workflow is already configured to read the role ARN from `.github/environments/*.yml` files. Update these files with your actual AWS account ID and role names:

```yaml
# In .github/environments/prod.yml
aws:
  region: us-east-1
  role_arn: arn:aws:iam::YOUR_ACCOUNT_ID:role/InsightModAI-GitHubActionsRole-Prod

# In .github/environments/dev.yml
aws:
  region: us-east-1
  role_arn: arn:aws:iam::YOUR_ACCOUNT_ID:role/InsightModAI-GitHubActionsRole-Dev
```

## Step 6: Verify Setup

Test the OIDC setup by running a GitHub Actions workflow. The workflow will automatically assume the IAM role using OIDC.

## Additional Security Considerations

1. **Branch Protection**: Limit OIDC to specific branches (e.g., main, develop)
2. **Environment Protection**: Use GitHub Environments with required reviewers
3. **Least Privilege**: Grant only necessary permissions to the IAM role
4. **Role Rotation**: Regularly rotate IAM roles and review access patterns

## Troubleshooting

### Common Issues

1. **Thumbprint Error**: Ensure you use the correct thumbprint for GitHub's OIDC provider
2. **Permission Denied**: Verify the IAM role has the required policies attached
3. **Branch Mismatch**: Ensure the branch pattern in the trust policy matches your workflow triggers

### Verification Commands

Check OIDC provider:
```bash
aws iam get-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

List roles:
```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `GitHubActions`)].RoleName'
```

Test role assumption:
```bash
aws sts assume-role-with-web-identity \
    --role-arn arn:aws:iam::<ACCOUNT_ID>:role/InsightModAI-GitHubActionsRole-Prod \
    --role-session-name test-session \
    --web-identity-token <JWT_TOKEN>
```
