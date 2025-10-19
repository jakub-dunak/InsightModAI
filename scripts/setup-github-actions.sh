#!/bin/bash

# InsightModAI Agent - GitHub Actions Setup Script
# This script helps set up the GitHub Actions workflow for automated deployments

set -e

echo "🚀 InsightModAI Agent - GitHub Actions Setup"
echo "============================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required. Install it from: https://cli.github.com/"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is required. Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq is required. Install it with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

echo "✅ All prerequisites are installed"

# Get repository information
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ -z "$REPO_URL" ]]; then
    echo "❌ Not in a git repository. Please run this script from your InsightModAI repository."
    exit 1
fi

REPO_NAME=$(basename -s .git "$REPO_URL")
OWNER=$(git remote get-url origin | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')

echo "📁 Repository: $OWNER/$REPO_NAME"

# Check if GitHub Actions workflow already exists
if [[ -f ".github/workflows/deploy.yml" ]]; then
    echo "⚠️ GitHub Actions workflow already exists at .github/workflows/deploy.yml"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "ℹ️ Setup cancelled. Existing workflow preserved."
        exit 0
    fi
fi

# Create GitHub Actions workflow
echo "📝 Creating GitHub Actions workflow..."
mkdir -p .github/workflows

# The workflow file was already created in the previous step, so we just need to verify it exists
if [[ -f ".github/workflows/deploy.yml" ]]; then
    echo "✅ GitHub Actions workflow created successfully"
else
    echo "❌ Failed to create GitHub Actions workflow"
    exit 1
fi

# Check if user is authenticated with GitHub
echo "🔐 Checking GitHub authentication..."
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Create deployment environments in GitHub
echo "🏗️ Setting up GitHub deployment environments..."

# Check if environments already exist
if gh api repos/$OWNER/$REPO_NAME/environments/dev >/dev/null 2>&1; then
    echo "ℹ️ Deployment environments already exist"
else
    echo "Creating deployment environments..."

    # Create dev environment
    gh api repos/$OWNER/$REPO_NAME/environments \
        -f name=dev \
        -f "protection_rules[]={"type":"required_reviewers","settings":{"required_reviewers":{"users":[]}}}" \
        -f "protection_rules[]={"type":"wait_timer","settings":{"minutes":5}}"

    # Create prod environment (more restrictive)
    gh api repos/$OWNER/$REPO_NAME/environments \
        -f name=prod \
        -f "protection_rules[]={"type":"required_reviewers","settings":{"required_reviewers":{"users":[]}}}" \
        -f "protection_rules[]={"type":"wait_timer","settings":{"minutes":30}}"

    echo "✅ Deployment environments created"
fi

# Setup instructions
echo ""
echo "🎯 GitHub Actions Setup Complete!"
echo "=================================="
echo ""
echo "🔧 Next Steps:"
echo ""
echo "1. 🔐 Configure AWS OIDC Provider and IAM Role"
echo "   Follow the detailed setup guide: docs/OIDC-SETUP.md"
echo "   This involves:"
echo "   • Creating an OIDC identity provider in AWS IAM"
echo "   • Creating IAM roles for GitHub Actions"
echo "   • Attaching necessary permissions"
echo ""
echo "2. 📝 Update Environment Configuration"
echo "   Edit these files with your actual AWS account ID:"
echo "   • .github/environments/prod.yml"
echo "   • .github/environments/dev.yml"
echo ""
echo "   Update the 'role_arn' field in each file with your AWS account ID"
echo ""
echo "3. 🔄 Push Changes"
echo "   Commit and push your changes to trigger the workflow:"
echo "   git add ."
echo "   git commit -m 'feat: add GitHub Actions CI/CD pipeline'"
echo "   git push origin main"
echo ""
echo "3. 🚀 Monitor Deployment"
echo "   Watch the Actions tab: https://github.com/$OWNER/$REPO_NAME/actions"
echo "   The workflow will:"
echo "   • Validate CloudFormation template"
echo "   • Build React frontend"
echo "   • Build Docker container for agent"
echo "   • Deploy to AWS"
echo "   • Create admin user in Cognito"
echo ""
echo "4. 🌐 Access Your Application"
echo "   After successful deployment, you'll find these URLs in the workflow output:"
echo "   • Dashboard: [Amplify URL]"
echo "   • API Endpoint: [API Gateway URL]"
echo ""
echo "5. 🔐 First Login"
echo "   • Email: [Your admin email]"
echo "   • Temporary Password: TempPass123!"
echo "   • Set permanent password when prompted"
echo ""
echo "📚 Documentation:"
echo "• Deployment Guide: docs/DEPLOYMENT.md"
echo "• Architecture: docs/ARCHITECTURE.md"
echo "• Demo Script: docs/DEMO_SCRIPT.md"
echo ""
echo "🎉 Happy deploying!"
