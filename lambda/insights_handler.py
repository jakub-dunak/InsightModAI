import json
import boto3
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    """Handle insights and dashboard data requests."""
    try:
        # Check for summary parameter
        query_params = event.get('queryStringParameters') or {}
        summary = query_params.get('summary') == 'true'

        if summary:
            return handle_summary_insights()
        else:
            return handle_detailed_insights()

    except Exception as e:
        print(f"Error in insights handler: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def handle_summary_insights():
    """Get summary dashboard data."""
    try:
        dynamodb = boto3.resource('dynamodb')

        # Get feedback records table
        feedback_table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-feedback-records-{os.environ["ENVIRONMENT"]}')

        # Get sentiment analysis table
        sentiment_table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-sentiment-analysis-{os.environ["ENVIRONMENT"]}')

        # Calculate metrics
        total_feedback = get_total_feedback_count(feedback_table)
        avg_sentiment = get_average_sentiment(sentiment_table)
        sentiment_trend = get_sentiment_trend(sentiment_table)
        processing_time = get_average_processing_time(sentiment_table)
        active_sessions = get_active_sessions_count(sentiment_table)
        recent_activity = get_recent_activity(feedback_table)
        alerts = get_system_alerts()

        summary_data = {
            'totalFeedback': total_feedback,
            'avgSentiment': avg_sentiment,
            'sentimentTrend': sentiment_trend,
            'avgProcessingTime': processing_time,
            'activeSessions': active_sessions,
            'recentActivity': recent_activity,
            'alerts': alerts
        }

        return {
            'statusCode': 200,
            'body': json.dumps(summary_data)
        }

    except Exception as e:
        print(f"Error getting summary insights: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def handle_detailed_insights():
    """Get detailed insights data."""
    # Placeholder for future detailed insights
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Detailed insights not yet implemented'})
    }

def get_total_feedback_count(table):
    """Get total count of feedback records."""
    try:
        response = table.scan(Select='COUNT')
        return response.get('Count', 0)
    except Exception as e:
        print(f"Error getting feedback count: {e}")
        return 0

def get_average_sentiment(table):
    """Calculate average sentiment score."""
    try:
        response = table.scan(
            ProjectionExpression='sentiment_score'
        )

        scores = []
        for item in response.get('Items', []):
            score = item.get('sentiment_score')
            if isinstance(score, (int, float)):
                scores.append(score)

        return sum(scores) / len(scores) if scores else 0.5
    except Exception as e:
        print(f"Error calculating average sentiment: {e}")
        return 0.5

def get_sentiment_trend(table):
    """Calculate sentiment trend (simplified)."""
    try:
        # Get sentiment scores from last 24 hours vs previous 24 hours
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        two_days_ago = now - timedelta(days=2)

        # This is a simplified trend calculation
        # In a real implementation, you'd compare time periods
        return 0.02  # Placeholder positive trend
    except Exception as e:
        print(f"Error calculating sentiment trend: {e}")
        return 0

def get_average_processing_time(table):
    """Get average processing time (placeholder)."""
    # This would require tracking processing start/end times
    return 150  # milliseconds

def get_active_sessions_count(table):
    """Get count of active sessions (placeholder)."""
    try:
        # Count records from last hour as "active sessions"
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

        response = table.scan(
            FilterExpression='analysis_timestamp >= :timestamp',
            ExpressionAttributeValues={':timestamp': one_hour_ago.isoformat()}
        )

        return len(response.get('Items', []))
    except Exception as e:
        print(f"Error getting active sessions: {e}")
        return 0

def get_recent_activity(table):
    """Get recent activity feed."""
    try:
        response = table.scan(
            ProjectionExpression='feedback_id, timestamp, source, customer_id',
            Limit=10
        )

        activities = []
        for item in response.get('Items', []):
            activities.append({
                'description': f"Feedback {item['feedback_id']} processed from {item.get('source', 'unknown')}",
                'timestamp': item['timestamp']
            })

        return activities
    except Exception as e:
        print(f"Error getting recent activity: {e}")
        return []

def get_system_alerts():
    """Get system alerts (placeholder)."""
    # This would check CloudWatch alarms, error rates, etc.
    return []  # No alerts for now
