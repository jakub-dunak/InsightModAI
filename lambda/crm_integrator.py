import json
import boto3
import os
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Integrate with CRM systems (Salesforce, HubSpot)."""
    try:
        action = event.get('action')
        data = event.get('data', {})

        if not action:
            return {'statusCode': 400, 'body': json.dumps({'error': 'action required'})}

        # Check if CRM integration is enabled
        if not is_crm_enabled():
            return {'statusCode': 200, 'body': json.dumps({'message': 'CRM integration disabled'})}

        # Get CRM credentials from DynamoDB config
        crm_config = get_crm_config()
        if not crm_config:
            return {'statusCode': 503, 'body': json.dumps({'error': 'CRM not configured'})}

        # Route to appropriate CRM handler
        if crm_config['provider'] == 'salesforce':
            result = handle_salesforce_action(action, data, crm_config)
        elif crm_config['provider'] == 'hubspot':
            result = handle_hubspot_action(action, data, crm_config)
        else:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Unsupported CRM provider'})}

        return {'statusCode': 200, 'body': json.dumps(result)}

    except Exception as e:
        print(f"Error in CRM integration: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def is_crm_enabled():
    """Check if CRM integration is enabled."""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-agent-config-{os.environ["ENVIRONMENT"]}')

        response = table.get_item(Key={'config_key': 'crm_enabled'})
        return response.get('Item', {}).get('config_value') == 'true'
    except Exception as e:
        print(f"Error checking CRM status: {e}")
        return False

def get_crm_config():
    """Get CRM configuration from DynamoDB."""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(f'{os.environ["STACK_NAME"]}-agent-config-{os.environ["ENVIRONMENT"]}')

        # Get all CRM-related config
        response = table.scan(
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

def handle_salesforce_action(action, data, config):
    """Handle Salesforce CRM actions."""
    # Implementation would use Salesforce REST API
    # This is a placeholder for the actual Salesforce integration
    return {
        'provider': 'salesforce',
        'action': action,
        'status': 'success',
        'data': data
    }

def handle_hubspot_action(action, data, config):
    """Handle HubSpot CRM actions."""
    # Implementation would use HubSpot API
    # This is a placeholder for the actual HubSpot integration
    return {
        'provider': 'hubspot',
        'action': action,
        'status': 'success',
        'data': data
    }
