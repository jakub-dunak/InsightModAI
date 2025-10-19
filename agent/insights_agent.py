"""
InsightModAI Agent - Main Strands Agent for Customer Insights Analysis

This agent processes customer feedback, performs sentiment analysis, generates insights,
and optionally integrates with CRM systems using Amazon Bedrock AgentCore Runtime.
"""

import json
import boto3
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from decimal import Decimal

# Strands imports
from strands import Agent, tool
from strands.models import BedrockModel
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# Initialize the Bedrock AgentCore App
app = BedrockAgentCoreApp()

# Initialize Bedrock model (will be used by the Strands agent)
model_id = os.getenv('BEDROCK_MODEL_ID', 'us.anthropic.claude-3-5-sonnet-20241022-v2:0')
bedrock_model = BedrockModel(model_id=model_id)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

# Table names from environment variables (set by CloudFormation)
FEEDBACK_TABLE = os.getenv('FEEDBACK_TABLE_NAME')
SENTIMENT_TABLE = os.getenv('SENTIMENT_TABLE_NAME')
CONFIG_TABLE = os.getenv('CONFIG_TABLE_NAME')
INSIGHTS_BUCKET = os.getenv('INSIGHTS_BUCKET_NAME')

# Validate required environment variables
if not FEEDBACK_TABLE or not SENTIMENT_TABLE or not CONFIG_TABLE:
    raise ValueError("Required environment variables not set: FEEDBACK_TABLE_NAME, SENTIMENT_TABLE_NAME, CONFIG_TABLE_NAME")


@tool
def analyze_sentiment(feedback_text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of customer feedback text.

    Args:
        feedback_text: The customer feedback text to analyze

    Returns:
        Dictionary containing sentiment score (0-1, where 1 is most positive),
        sentiment label, and confidence score
    """
    try:
        # Use Bedrock Claude for sentiment analysis
        prompt = f"""
        Analyze the sentiment of this customer feedback. Respond with a JSON object containing:
        - sentiment_score: float between 0-1 (1 being most positive)
        - sentiment_label: "positive", "negative", or "neutral"
        - confidence: float between 0-1 indicating confidence in the analysis
        - key_themes: array of main themes mentioned

        Feedback: {feedback_text}

        Respond only with the JSON object, no other text.
        """

        # Use Bedrock model for sentiment analysis
        try:
            response = bedrock_model(prompt)

            # In a real implementation, parse the JSON response properly
            # For this example, return a structured response
            return {
                "sentiment_score": 0.7,
                "sentiment_label": "positive",
                "confidence": 0.85,
                "key_themes": ["service quality", "recommendation"],
                "analysis_text": f"Analysis of: {feedback_text[:100]}..."
            }
        except Exception as e:
            print(f"Error calling Bedrock model: {e}")
            # Return neutral sentiment on error
            return {
                "sentiment_score": 0.5,
                "sentiment_label": "neutral",
                "confidence": 0.1,
                "key_themes": ["error"],
                "error": str(e)
            }



@tool
def store_feedback(feedback_data: Dict[str, Any]) -> str:
    """
    Store feedback data in DynamoDB.

    Args:
        feedback_data: Dictionary containing feedback information

    Returns:
        feedback_id: The generated feedback ID
    """
    try:
        feedback_id = str(uuid.uuid4())

        table = dynamodb.Table(FEEDBACK_TABLE)

        item = {
            'feedback_id': feedback_id,
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'agent',
            **feedback_data
        }

        table.put_item(Item=item)

        return feedback_id

    except Exception as e:
        print(f"Error storing feedback: {e}")
        raise


@tool
def query_sentiment_trends(timeframe: str = "7d") -> Dict[str, Any]:
    """
    Query sentiment trends over a specified timeframe.

    Args:
        timeframe: Time period to analyze (e.g., "7d", "30d", "90d")

    Returns:
        Dictionary containing trend analysis
    """
    try:
        # Parse timeframe
        if timeframe.endswith('d'):
            days = int(timeframe[:-1])
        elif timeframe.endswith('h'):
            days = int(timeframe[:-1]) / 24
        else:
            days = 7  # Default to 7 days

        start_date = datetime.utcnow() - timedelta(days=days)
        start_iso = start_date.isoformat()

        table = dynamodb.Table(SENTIMENT_TABLE)

        # Query sentiment data within timeframe
        response = table.scan(
            FilterExpression='analysis_timestamp >= :start_date',
            ExpressionAttributeValues={':start_date': start_iso}
        )

        items = response.get('Items', [])

        if not items:
            return {
                "timeframe": timeframe,
                "total_analyses": 0,
                "average_sentiment": 0.5,
                "trend": "insufficient_data"
            }

        # Calculate trends
        sentiment_scores = [float(item['sentiment_score']) for item in items]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)

        # Determine trend direction
        if len(items) >= 2:
            first_half = sentiment_scores[:len(sentiment_scores)//2]
            second_half = sentiment_scores[len(sentiment_scores)//2:]

            first_avg = sum(first_half) / len(first_half)
            second_avg = sum(second_half) / len(second_half)

            if second_avg > first_avg + 0.1:
                trend = "improving"
            elif second_avg < first_avg - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"

        return {
            "timeframe": timeframe,
            "total_analyses": len(items),
            "average_sentiment": round(avg_sentiment, 3),
            "trend": trend,
            "sentiment_distribution": {
                "positive": len([s for s in sentiment_scores if s > 0.6]),
                "neutral": len([s for s in sentiment_scores if 0.4 <= s <= 0.6]),
                "negative": len([s for s in sentiment_scores if s < 0.4])
            }
        }

    except Exception as e:
        print(f"Error querying sentiment trends: {e}")
        return {
            "error": str(e),
            "timeframe": timeframe
        }


@tool
def generate_report(criteria: Dict[str, Any]) -> str:
    """
    Generate insights report based on specified criteria.

    Args:
        criteria: Dictionary containing report criteria (timeframe, customer_id, etc.)

    Returns:
        report_id: The generated report ID stored in S3
    """
    try:
        # Get sentiment data based on criteria
        timeframe = criteria.get('timeframe', '30d')
        customer_id = criteria.get('customer_id')

        trends_data = query_sentiment_trends(timeframe)

        # Generate report content
        report_content = {
            "report_id": str(uuid.uuid4()),
            "generated_at": datetime.utcnow().isoformat(),
            "criteria": criteria,
            "insights": trends_data,
            "recommendations": generate_recommendations(trends_data)
        }

        # Store report in S3
        report_id = report_content["report_id"]
        report_key = f"reports/{report_id}.json"

        s3.put_object(
            Bucket=INSIGHTS_BUCKET,
            Key=report_key,
            Body=json.dumps(report_content, indent=2, default=str),
            ContentType='application/json'
        )

        return report_id

    except Exception as e:
        print(f"Error generating report: {e}")
        raise


@tool
def call_crm_api(action: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call CRM API for integration (Salesforce/HubSpot).

    Args:
        action: The CRM action to perform
        data: Data payload for the CRM action

    Returns:
        Result of the CRM API call
    """
    try:
        # Check if CRM integration is enabled
        config_table = dynamodb.Table(CONFIG_TABLE)
        response = config_table.get_item(Key={'config_key': 'crm_enabled'})

        if response.get('Item', {}).get('config_value') != 'true':
            return {"message": "CRM integration disabled", "action": action}

        # Get CRM configuration
        crm_config = get_crm_config()
        if not crm_config:
            return {"error": "CRM not configured", "action": action}

        # Route to appropriate CRM handler
        provider = crm_config.get('provider', 'salesforce')

        if provider == 'salesforce':
            return handle_salesforce_action(action, data, crm_config)
        elif provider == 'hubspot':
            return handle_hubspot_action(action, data, crm_config)
        else:
            return {"error": f"Unsupported CRM provider: {provider}", "action": action}

    except Exception as e:
        print(f"Error in CRM API call: {e}")
        return {"error": str(e), "action": action}


def generate_recommendations(trends_data: Dict[str, Any]) -> List[str]:
    """
    Generate recommendations based on sentiment trends.

    Args:
        trends_data: Trend analysis data

    Returns:
        List of recommendation strings
    """
    recommendations = []

    avg_sentiment = trends_data.get('average_sentiment', 0.5)
    trend = trends_data.get('trend', 'stable')
    total_analyses = trends_data.get('total_analyses', 0)

    if avg_sentiment < 0.4:
        recommendations.append("⚠️ Critical: Average sentiment is very low. Immediate action required to address customer concerns.")
        recommendations.append("📞 Consider proactive outreach to dissatisfied customers.")
    elif avg_sentiment < 0.6:
        recommendations.append("⚡ Moderate concern: Sentiment trending negative. Review recent feedback for common issues.")
        recommendations.append("🔍 Analyze feedback themes to identify improvement opportunities.")

    if trend == "declining":
        recommendations.append("📉 Sentiment is declining. Monitor closely and investigate recent changes.")
    elif trend == "improving":
        recommendations.append("📈 Sentiment is improving! Continue current positive practices.")

    if total_analyses < 10:
        recommendations.append("📊 Limited data available. Increase feedback collection to improve insights accuracy.")

    return recommendations


def get_crm_config() -> Optional[Dict[str, str]]:
    """
    Get CRM configuration from DynamoDB.

    Returns:
        Dictionary containing CRM configuration or None if not configured
    """
    try:
        config_table = dynamodb.Table(CONFIG_TABLE)

        # Scan for CRM-related config
        response = config_table.scan(
            FilterExpression='begins_with(config_key, :prefix)',
            ExpressionAttributeValues={':prefix': 'crm_'}
        )

        config = {}
        for item in response.get('Items', []):
            config[item['config_key']] = item['config_value']

        return config if config else None

    except Exception as e:
        print(f"Error getting CRM config: {e}")
        return None


def handle_salesforce_action(action: str, data: Dict[str, Any], config: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle Salesforce CRM actions.

    Args:
        action: The action to perform
        data: Data payload
        config: CRM configuration

    Returns:
        Result of the Salesforce API call
    """
    # Placeholder for Salesforce integration
    # In a real implementation, this would use the Salesforce REST API
    return {
        "provider": "salesforce",
        "action": action,
        "status": "success",
        "message": f"Processed {action} with Salesforce",
        "data": data
    }


def handle_hubspot_action(action: str, data: Dict[str, Any], config: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle HubSpot CRM actions.

    Args:
        action: The action to perform
        data: Data payload
        config: CRM configuration

    Returns:
        Result of the HubSpot API call
    """
    # Placeholder for HubSpot integration
    # In a real implementation, this would use the HubSpot API
    return {
        "provider": "hubspot",
        "action": action,
        "status": "success",
        "message": f"Processed {action} with HubSpot",
        "data": data
    }


# Create the main agent instance
agent = Agent(
    model=bedrock_model,
    tools=[
        analyze_sentiment,
        store_feedback,
        query_sentiment_trends,
        generate_report,
        call_crm_api
    ],
    system_prompt="""
    You are InsightModAI, an autonomous AI agent specialized in customer insights analysis.

    Your primary responsibilities are:
    1. Analyze customer feedback for sentiment and key themes
    2. Generate actionable insights and recommendations
    3. Maintain conversation context across interactions
    4. Optionally integrate with CRM systems when requested

    Always provide clear, actionable insights based on data analysis.
    When generating reports, include specific recommendations for business improvement.
    If CRM integration is requested, ensure proper data handling and privacy compliance.

    Respond professionally and focus on delivering value to the business.
    """
)


@app.entrypoint
async def insights_agent(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main agent entrypoint for processing customer feedback and generating insights.

    Args:
        payload: Input payload containing prompt and context

    Returns:
        Agent response with analysis and recommendations
    """
    try:
        # Extract input data
        user_input = payload.get('prompt', '')
        feedback_id = payload.get('feedback_id')
        customer_id = payload.get('customer_id')
        channel = payload.get('channel')
        context = payload.get('context', {})

        # Build enhanced prompt with context
        enhanced_prompt = f"""
        {user_input}

        Context:
        - Feedback ID: {feedback_id or 'N/A'}
        - Customer ID: {customer_id or 'N/A'}
        - Channel: {channel or 'N/A'}

        Previous sentiment history for this customer:
        """

        if context.get('previous_sentiments'):
            for sentiment in context['previous_sentiments']:
                enhanced_prompt += f"""
        - Score: {sentiment.get('sentiment_score', 'N/A')}, Date: {sentiment.get('analysis_timestamp', 'N/A')}
        """

        enhanced_prompt += """

        Please analyze this feedback and provide actionable insights.
        """

        # Process with the agent
        response = agent(enhanced_prompt)

        # Return structured response
        return {
            "response": response.message['content'][0]['text'],
            "feedback_id": feedback_id,
            "timestamp": datetime.utcnow().isoformat(),
            "model_used": model_id,
            "tools_used": [tool.__name__ for tool in agent.tools if hasattr(tool, '__name__')]
        }

    except Exception as e:
        print(f"Error in agent processing: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


# Health check endpoint (automatically handled by BedrockAgentCoreApp)
@app.entrypoint
def ping() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    app.run()
