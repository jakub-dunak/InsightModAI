import json
import boto3
import uuid
import os
from datetime import datetime
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Process S3 object creation events and API Gateway requests for feedback ingestion."""
    try:
        # Handle S3 trigger
        if event.get('Records'):
            for record in event['Records']:
                if record['eventSource'] == 'aws:s3':
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']
                    process_s3_feedback(bucket, key)
        # Handle API Gateway request
        elif event.get('body'):
            body = json.loads(event['body'])
            result = process_api_feedback(body)
            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }

        return {'statusCode': 200}
    except Exception as e:
        print(f"Error processing feedback: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def process_s3_feedback(bucket, key):
    """Process feedback uploaded to S3."""
    s3 = boto3.client('s3')
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        feedback_data = json.loads(response['Body'].read())

        # Store in DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['FEEDBACK_TABLE_NAME'])

        feedback_id = str(uuid.uuid4())
        table.put_item(Item={
            'feedback_id': feedback_id,
            'timestamp': datetime.utcnow().isoformat(),
            'source': 's3',
            's3_bucket': bucket,
            's3_key': key,
            **feedback_data
        })

        print(f"Stored feedback {feedback_id} from S3")
    except Exception as e:
        print(f"Error processing S3 feedback: {e}")
        raise

def process_api_feedback(feedback_data):
    """Process feedback from API Gateway."""
    # Validate required fields
    required_fields = ['customer_id', 'feedback_text', 'channel']
    for field in required_fields:
        if field not in feedback_data:
            raise ValueError(f"Missing required field: {field}")

    # Store in DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-feedback-records-{os.environ["ENVIRONMENT"]}')

    feedback_id = str(uuid.uuid4())
    table.put_item(Item={
        'feedback_id': feedback_id,
        'timestamp': datetime.utcnow().isoformat(),
        'source': 'api',
        **feedback_data
    })

    # Optionally trigger agent processing
    trigger_agent_processing(feedback_id, feedback_data)

    return {'feedback_id': feedback_id, 'status': 'processed'}

def trigger_agent_processing(feedback_id, feedback_data):
    """Trigger AgentCore agent processing if enabled."""
    # Get config from DynamoDB
    dynamodb = boto3.resource('dynamodb')
    config_table = dynamodb.Table(os.environ['CONFIG_TABLE_NAME'])

    try:
        response = config_table.get_item(Key={'config_key': 'auto_process_feedback'})
        if response.get('Item', {}).get('config_value') == 'true':
            # Invoke agent processing
            lambda_client = boto3.client('lambda')
            lambda_client.invoke(
                FunctionName=f'{os.environ["STACK_NAME"]}-agent-invoker-{os.environ["ENVIRONMENT"]}',
                InvocationType='Event',
                Payload=json.dumps({
                    'feedback_id': feedback_id,
                    'feedback_data': feedback_data
                })
            )
    except Exception as e:
        print(f"Error triggering agent processing: {e}")
