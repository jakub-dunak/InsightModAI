import json
import boto3
import os
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Manage agent configuration settings."""
    try:
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('httpMethod')

        if http_method == 'GET':
            return handle_get_config()
        elif http_method == 'PUT':
            return handle_put_config(event)
        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        print(f"Error in config management: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def handle_get_config():
    """Get all configuration settings."""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-agent-config-{os.environ["ENVIRONMENT"]}')

        # Get all config items
        response = table.scan()
        config = {}

        for item in response.get('Items', []):
            config[item['config_key']] = item['config_value']

        # Set defaults for missing config
        defaults = {
            'crm_enabled': 'false',
            'auto_process_feedback': 'false',
            'enable_memory': 'false',
            'negative_threshold': '0.3',
            'positive_threshold': '0.7',
            'max_processing_time': '300',
            'batch_size': '10'
        }

        for key, default_value in defaults.items():
            if key not in config:
                config[key] = default_value

        return {
            'statusCode': 200,
            'body': json.dumps(config)
        }

    except Exception as e:
        print(f"Error getting config: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def handle_put_config(event):
    """Update configuration settings."""
    try:
        if not event.get('body'):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Request body required'})}

        config_updates = json.loads(event['body'])

        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-agent-config-{os.environ["ENVIRONMENT"]}')

        # Update each config item
        for key, value in config_updates.items():
            table.put_item(Item={
                'config_key': key,
                'config_value': str(value)
            })

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Configuration updated successfully'})
        }

    except json.JSONDecodeError:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid JSON in request body'})}
    except Exception as e:
        print(f"Error updating config: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})})
