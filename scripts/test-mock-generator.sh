#!/bin/bash
# Test script for mock data generator Lambda function

set -e

# Configuration
ENVIRONMENT="${1:-prod}"
STACK_NAME="insightmodai-agent-${ENVIRONMENT}"
FUNCTION_NAME="${STACK_NAME}-mock-data-generator-${ENVIRONMENT}"
REGION="us-west-2"

echo "Testing Mock Data Generator Lambda..."
echo "Function: ${FUNCTION_NAME}"
echo "Region: ${REGION}"
echo ""

# Invoke the Lambda function
echo "Invoking Lambda function..."
aws lambda invoke \
  --function-name "${FUNCTION_NAME}" \
  --region "${REGION}" \
  --log-type Tail \
  --query 'LogResult' \
  --output text \
  /tmp/mock-generator-response.json | base64 -d

echo ""
echo "Response:"
cat /tmp/mock-generator-response.json | jq '.'

echo ""
echo "Checking DynamoDB for recent feedback..."
TABLE_NAME="${STACK_NAME}-feedback-records-${ENVIRONMENT}"

# Get the most recent feedback items
aws dynamodb scan \
  --table-name "${TABLE_NAME}" \
  --region "${REGION}" \
  --limit 5 \
  --query 'Items[*].[feedback_id.S, timestamp.S, customer_id.S, rating.N, source.S]' \
  --output table

echo ""
echo "Test complete!"

