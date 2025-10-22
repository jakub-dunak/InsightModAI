import json
import boto3
import random
import os
import uuid
from datetime import datetime, timedelta

def lambda_handler(event, context):
    """
    Periodically generate and send mock feedback data to the feedback ingestion endpoint.
    This provides realistic data for testing and demonstration purposes.
    """
    try:
        # Generate random feedback data
        feedback = generate_random_feedback()

        # Send to feedback ingestion
        result = send_feedback(feedback)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Mock feedback generated successfully',
                'feedback_id': result.get('feedback_id')
            })
        }
    except Exception as e:
        print(f"Error generating mock feedback: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def generate_random_feedback():
    """Generate realistic random feedback data."""
    
    # Customer ID pool
    customer_ids = [f"customer_{str(i).zfill(3)}" for i in range(1, 101)]
    
    # Feedback templates by sentiment
    positive_feedback = [
        "Excellent service! The support team was incredibly helpful and resolved my issue within minutes.",
        "The new mobile app is fantastic! Much faster and easier to use than before.",
        "Outstanding experience from start to finish! The website is intuitive and the ordering process was smooth.",
        "Love the new features in the latest release! The dark mode is especially appreciated.",
        "The product quality is excellent and meets all my expectations. Very satisfied!",
        "Amazing customer support! They went above and beyond to help me.",
        "The interface is clean and intuitive. Great user experience overall.",
        "Very impressed with the quick response time and professional service.",
        "Everything works perfectly. No complaints whatsoever!",
        "Best experience I've had with any service provider. Highly recommend!"
    ]
    
    neutral_feedback = [
        "The product is okay, but there is room for improvement in the logistics department.",
        "Mixed feelings about the recent update. Some improvements are great but I miss some old features.",
        "The service is decent but the pricing structure is a bit confusing.",
        "Average experience. Nothing exceptional but nothing terrible either.",
        "The product works as described, though the documentation could be clearer.",
        "Satisfied overall, though delivery took longer than expected.",
        "The interface is functional but could be more modern.",
        "Good service but a few minor issues that need attention.",
        "Met my expectations but didn't exceed them.",
        "Reasonable quality for the price point."
    ]
    
    negative_feedback = [
        "Very disappointed with the recent changes. The new interface is confusing and difficult to navigate.",
        "TERRIBLE customer service experience! I was transferred between multiple departments and still didn't get my issue resolved.",
        "The product quality has declined significantly. Not worth the price anymore.",
        "Frustrated with the constant bugs and glitches. This needs serious improvement.",
        "Poor communication from support team. Waited hours for a response.",
        "The app keeps crashing and my data was lost. Unacceptable!",
        "Misleading product description. What I received was not what was advertised.",
        "Customer service was unhelpful and dismissive of my concerns.",
        "The checkout process is overly complicated and resulted in errors.",
        "Very slow performance and frequent downtime. Considering switching providers."
    ]
    
    # Channels
    channels = ["phone", "email", "chat", "mobile_app", "web_form", "website", "social_media"]
    
    # Categories
    categories = [
        "technical_support",
        "product_feedback",
        "ui_feedback",
        "delivery_feedback",
        "general_feedback",
        "feature_feedback",
        "customer_service",
        "documentation_feedback",
        "pricing_feedback",
        "billing_inquiry"
    ]
    
    # Select sentiment (weighted towards more realistic distribution)
    sentiment_choice = random.choices(
        ['positive', 'neutral', 'negative'],
        weights=[0.5, 0.3, 0.2],  # 50% positive, 30% neutral, 20% negative
        k=1
    )[0]
    
    # Select feedback based on sentiment
    if sentiment_choice == 'positive':
        feedback_text = random.choice(positive_feedback)
        rating = random.choice([4, 5])
        priority = random.choice(['low', 'medium'])
    elif sentiment_choice == 'neutral':
        feedback_text = random.choice(neutral_feedback)
        rating = 3
        priority = 'medium'
    else:
        feedback_text = random.choice(negative_feedback)
        rating = random.choice([1, 2])
        priority = random.choice(['high', 'critical'])
    
    # Build feedback object
    feedback = {
        'customer_id': random.choice(customer_ids),
        'feedback_text': feedback_text,
        'channel': random.choice(channels),
        'rating': rating,
        'metadata': {
            'category': random.choice(categories),
            'priority': priority,
            'timestamp': datetime.utcnow().isoformat(),
            'session_id': f"session_{random.randint(1000, 9999)}",
            'platform': random.choice(['web', 'mobile', 'desktop']),
            'browser': random.choice(['Chrome', 'Firefox', 'Safari', 'Edge']),
            'version': f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 9)}"
        }
    }
    
    # Add sentiment-specific metadata
    if sentiment_choice == 'positive':
        feedback['metadata']['recommendation_likelihood'] = random.choice(['high', 'very_high'])
        feedback['metadata']['satisfaction_score'] = random.randint(8, 10)
    elif sentiment_choice == 'negative':
        feedback['metadata']['resolution_status'] = random.choice(['unresolved', 'escalated'])
        feedback['metadata']['churn_risk'] = random.choice(['medium', 'high'])
    
    return feedback

def send_feedback(feedback):
    """Send feedback to the feedback ingestion Lambda function."""
    lambda_client = boto3.client('lambda')

    try:
        # Prepare payload for feedback ingestion function
        payload = {
            'body': json.dumps(feedback),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

        # Invoke feedback ingestion function
        function_name = f'{os.environ["STACK_NAME"]}-feedback-ingestion-{os.environ["ENVIRONMENT"]}'
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        if response['StatusCode'] != 200:
            raise Exception(f"Feedback ingestion failed: {response_payload}")

        result = json.loads(response_payload.get('body', '{}'))

        print(f"Sent mock feedback to ingestion function for customer {feedback.get('customer_id')}")
        print(f"Feedback text: {feedback.get('feedback_text')[:100]}...")
        print(f"Rating: {feedback.get('rating')}, Channel: {feedback.get('channel')}")
        print(f"Response: {result}")

        return result

    except Exception as e:
        print(f"Error sending feedback to ingestion function: {e}")
        print(f"Function name: {function_name}")
        raise


