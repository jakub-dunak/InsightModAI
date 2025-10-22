import json
import boto3
import uuid
import os
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Invoke AgentCore Runtime for feedback processing."""
    try:
        # Check if this is a DynamoDB Stream event
        if 'Records' in event:
            return process_dynamodb_stream(event, context)
        
        # Handle direct invocation (backward compatibility)
        feedback_id = event.get('feedback_id')
        feedback_data = event.get('feedback_data', {})
        
        result = process_single_feedback(feedback_id, feedback_data)
        
        return {
            'statusCode': 200 if 'error' not in result else 400,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error invoking agent: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def get_recent_sentiments(customer_id):
    """Get recent sentiment history for context."""
    if not customer_id:
        return []

    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-sentiment-analysis-{os.environ["ENVIRONMENT"]}')

        response = table.query(
            IndexName='CustomerIndex',
            KeyConditionExpression='customer_id = :cid',
            ExpressionAttributeValues={':cid': customer_id},
            ScanIndexForward=False,
            Limit=5
        )

        return [
            {
                'sentiment_score': item['sentiment_score'],
                'analysis_timestamp': item['analysis_timestamp'],
                'sentiment_label': item.get('sentiment_label', 'unknown')
            }
            for item in response.get('Items', [])
        ]
    except Exception as e:
        print(f"Error getting recent sentiments: {e}")
        return []

def process_dynamodb_stream(event, context):
    """Process DynamoDB stream events from feedback table."""
    results = []
    
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            try:
                # Extract new feedback from stream
                new_image = record['dynamodb']['NewImage']
                
                feedback_id = new_image.get('feedback_id', {}).get('S')
                feedback_text = new_image.get('feedback_text', {}).get('S')
                customer_id = new_image.get('customer_id', {}).get('S')
                channel = new_image.get('channel', {}).get('S')
                rating = new_image.get('rating', {}).get('N')
                
                # Build feedback data object
                feedback_data = {
                    'feedback_text': feedback_text,
                    'customer_id': customer_id,
                    'channel': channel,
                    'rating': int(rating) if rating else None
                }
                
                print(f"Processing feedback from stream: {feedback_id}")
                
                # Process the feedback
                result = process_single_feedback(feedback_id, feedback_data)
                results.append(result)
                
            except Exception as e:
                print(f"Error processing stream record: {e}")
                # Continue processing other records
                continue
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': results
        })
    }

def process_single_feedback(feedback_id, feedback_data):
    """Process a single feedback item."""
    if not feedback_id:
        return {'error': 'feedback_id required'}
    
    try:
        # Get agent runtime ARN from SSM
        ssm = boto3.client('ssm')
        try:
            response = ssm.get_parameter(Name=f'/insightmodai/agent-runtime-arn-{os.environ["ENVIRONMENT"]}')
            agent_runtime_arn = response['Parameter']['Value']
        except ssm.exceptions.ParameterNotFound:
            # Agent not deployed yet - store basic sentiment based on rating
            print(f"Agent runtime not deployed, using rating-based sentiment for {feedback_id}")
            store_rating_based_sentiment(feedback_id, feedback_data)
            return {'feedback_id': feedback_id, 'status': 'processed_without_agent', 'method': 'rating_based'}
        
        # Generate session ID (33+ characters required)
        session_id = str(uuid.uuid4()) + str(uuid.uuid4()) + str(uuid.uuid4())
        
        # Prepare payload for agent
        agent_payload = {
            'input': {
                'prompt': f'Analyze this customer feedback: {feedback_data.get("feedback_text", "")}',
                'feedback_id': feedback_id,
                'customer_id': feedback_data.get('customer_id'),
                'channel': feedback_data.get('channel'),
                'context': {
                    'previous_sentiments': get_recent_sentiments(feedback_data.get('customer_id'))
                }
            }
        }
        
        # Invoke AgentCore Runtime
        agentcore_client = boto3.client('bedrock-agentcore')
        response = agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=agent_runtime_arn,
            runtimeSessionId=session_id,
            payload=json.dumps(agent_payload),
            qualifier='DEFAULT'
        )
        
        # Process streaming response
        if 'text/event-stream' in response.get('contentType', ''):
            content = []
            for line in response['response'].iter_lines(chunk_size=1):
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:].strip('"')
                        if data and data != '[DONE]':
                            content.append(data)
            full_response = ' '.join(content)
        else:
            full_response = json.loads(response['response'].read())
        
        # Store analysis results
        store_sentiment_analysis(feedback_id, full_response)
        
        return {
            'feedback_id': feedback_id,
            'agent_response': full_response,
            'session_id': session_id,
            'status': 'processed_with_agent'
        }
        
    except Exception as e:
        print(f"Error processing feedback {feedback_id}: {e}")
        # Fallback to rating-based sentiment
        store_rating_based_sentiment(feedback_id, feedback_data)
        return {'feedback_id': feedback_id, 'error': str(e), 'status': 'fallback_to_rating'}

def store_rating_based_sentiment(feedback_id, feedback_data):
    """Store sentiment based on rating (fallback when agent not available)."""
    try:
        from datetime import datetime
        
        rating = feedback_data.get('rating', 3)
        
        # Simple sentiment mapping based on rating
        if rating >= 4:
            sentiment_score = 0.8
            sentiment_label = 'positive'
        elif rating >= 3:
            sentiment_score = 0.5
            sentiment_label = 'neutral'
        else:
            sentiment_score = 0.2
            sentiment_label = 'negative'
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-sentiment-analysis-{os.environ["ENVIRONMENT"]}')
        
        table.put_item(Item={
            'feedback_id': feedback_id,
            'sentiment_score': sentiment_score,
            'sentiment_label': sentiment_label,
            'analysis_timestamp': datetime.utcnow().isoformat(),
            'agent_response': f"Rating-based analysis: {sentiment_label} (rating: {rating})",
            'model_used': 'rating_based_fallback'
        })
        
        print(f"Stored rating-based sentiment for {feedback_id}: {sentiment_label}")
        
    except Exception as e:
        print(f"Error storing rating-based sentiment: {e}")

def store_sentiment_analysis(feedback_id, agent_response):
    """Store sentiment analysis results in DynamoDB."""
    try:
        # Parse agent response (assuming JSON format)
        if isinstance(agent_response, str):
            try:
                parsed_response = json.loads(agent_response)
                sentiment_score = parsed_response.get('sentiment_score', 0.5)
                sentiment_label = parsed_response.get('sentiment_label', 'neutral')
                analysis_text = parsed_response.get('analysis_text', agent_response)
            except json.JSONDecodeError:
                sentiment_score = 0.5  # Neutral default
                sentiment_label = 'neutral'
                analysis_text = agent_response
        else:
            sentiment_score = agent_response.get('sentiment_score', 0.5)
            sentiment_label = agent_response.get('sentiment_label', 'neutral')
            analysis_text = agent_response.get('analysis_text', str(agent_response))

        sentiment_score = 0.5  # Neutral default
        analysis_text = str(agent_response)

        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-sentiment-analysis-{os.environ["ENVIRONMENT"]}')

        table.put_item(Item={
            'feedback_id': feedback_id,
            'sentiment_score': sentiment_score,
            'analysis_timestamp': boto3.client('dynamodb').meta.service_model.operation_model('PutItem').metadata['timestamp'],
            'agent_response': analysis_text,
            'model_used': os.environ.get('BEDROCK_MODEL_ID', 'amazon.titan-text-premier-v1:0')
        })
    except Exception as e:
        print(f"Error storing sentiment analysis: {e}")
