import json
import boto3
import os
import zipfile
import tempfile
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Custom CloudFormation resource for AgentCore Runtime deployment."""
    try:
        request_type = event['RequestType']

        if request_type == 'Create':
            return create_agent_runtime(event, context)
        elif request_type == 'Update':
            return update_agent_runtime(event, context)
        elif request_type == 'Delete':
            return delete_agent_runtime(event, context)
        else:
            return {'Status': 'Failed', 'Reason': f'Unknown request type: {request_type}'}

    except Exception as e:
        print(f"Error in agent deployment: {e}")
        return {'Status': 'Failed', 'Reason': str(e)}

def create_agent_runtime(event, context):
    """Create AgentCore Runtime."""
    try:
        # Get ECR repository URI
        ecr_client = boto3.client('ecr')
        repo_response = ecr_client.describe_repositories(repositoryNames=[f'insightmodai-agent-{os.environ["ENVIRONMENT"]}'])
        repository_uri = repo_response['repositories'][0]['repositoryUri']

        # Get latest image
        image_response = ecr_client.list_images(repositoryName=f'insightmodai-agent-{os.environ["ENVIRONMENT"]}')
        if not image_response['imageIds']:
            raise Exception('No images found in ECR repository')

        latest_image = image_response['imageIds'][0]
        image_uri = f'{repository_uri}:{latest_image["imageTag"] or "latest"}'

        # Create AgentCore Runtime
        agentcore_client = boto3.client('bedrock-agentcore')
        runtime_response = agentcore_client.create_agent_runtime(
            agentRuntimeName=f'insightmodai-agent-{os.environ["ENVIRONMENT"]}',
            agentRuntimeArtifact={
                'containerConfiguration': {
                    'containerUri': image_uri
                }
            },
            networkConfiguration={'networkMode': 'PUBLIC'},
            roleArn=os.environ['AGENTCORE_EXECUTION_ROLE_ARN']
        )

        runtime_arn = runtime_response['agentRuntimeArn']

        # Store ARN in SSM Parameter Store
        ssm = boto3.client('ssm')
        ssm.put_parameter(
            Name=f'/insightmodai/agent-runtime-arn-{os.environ["ENVIRONMENT"]}',
            Value=runtime_arn,
            Type='String',
            Overwrite=True
        )

        return {
            'Status': 'Success',
            'PhysicalResourceId': runtime_arn,
            'Data': {
                'AgentRuntimeArn': runtime_arn,
                'ImageUri': image_uri
            }
        }

    except Exception as e:
        print(f"Error creating agent runtime: {e}")
        raise

def update_agent_runtime(event, context):
    """Update AgentCore Runtime (placeholder - would need update API when available)."""
    physical_resource_id = event.get('PhysicalResourceId', '')
    return {
        'Status': 'Success',
        'PhysicalResourceId': physical_resource_id
    }

def delete_agent_runtime(event, context):
    """Delete AgentCore Runtime."""
    try:
        physical_resource_id = event.get('PhysicalResourceId', '')
        if physical_resource_id:
            agentcore_client = boto3.client('bedrock-agentcore')
            # Note: delete_agent_runtime API may not be available yet
            # agentcore_client.delete_agent_runtime(agentRuntimeArn=physical_resource_id)

        # Clean up SSM parameter
        ssm = boto3.client('ssm')
        try:
            ssm.delete_parameter(Name=f'/insightmodai/agent-runtime-arn-{os.environ["ENVIRONMENT"]}')
        except ssm.exceptions.ParameterNotFound:
            pass  # Parameter already deleted

        return {
            'Status': 'Success',
            'PhysicalResourceId': physical_resource_id
        }

    except Exception as e:
        print(f"Error deleting agent runtime: {e}")
        return {'Status': 'Failed', 'Reason': str(e)}
