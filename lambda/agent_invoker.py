import json
import boto3
import uuid
import os
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Invoke AgentCore Runtime for feedback processing."""
    try:
        # Extract feedback data
        feedback_id = event.get('feedback_id')
        feedback_data = event.get('feedback_data', {})

        if not feedback_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'feedback_id required'})}

        # Get agent runtime ARN from SSM
        ssm = boto3.client('ssm')
        try:
            response = ssm.get_parameter(Name=f'/insightmodai/agent-runtime-arn-{os.environ["ENVIRONMENT"]}')
            agent_runtime_arn = response['Parameter']['Value']
        except ssm.exceptions.ParameterNotFound:
            return {'statusCode': 503, 'body': json.dumps({'error': 'Agent runtime not deployed'})}

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
            'statusCode': 200,
            'body': json.dumps({
                'feedback_id': feedback_id,
                'agent_response': full_response,
                'session_id': session_id
            })
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
            'model_used': os.environ.get('BEDROCK_MODEL_ID', 'us.anthropic.claude-3-5-sonnet-20241022-v2:0')
        })
    except Exception as e:
        print(f"Error storing sentiment analysis: {e}")
