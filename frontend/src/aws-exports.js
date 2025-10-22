// AWS Amplify configuration
// Auto-generated from CloudFormation outputs
// Environment: production

const awsmobile = {
  "aws_project_region": process.env.REACT_APP_REGION || 'us-west-2',
  "aws_cognito_region": process.env.REACT_APP_REGION || 'us-west-2',
  "aws_user_pools_id": process.env.REACT_APP_USER_POOL_ID,
  "aws_user_pools_web_client_id": process.env.REACT_APP_USER_POOL_CLIENT_ID,
  "oauth": {},
  "aws_cognito_username_attributes": ["EMAIL"],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": ["EMAIL", "NAME"],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": [],
  "aws_cognito_password_protection_settings": {
    "passwordPolicyMinLength": 8,
    "passwordPolicyCharacters": [
      "REQUIRES_LOWERCASE",
      "REQUIRES_UPPERCASE",
      "REQUIRES_NUMBERS",
      "REQUIRES_SYMBOLS"
    ]
  },
  "aws_cognito_verification_mechanisms": ["EMAIL"],
  "aws_appsync_graphqlEndpoint": "",
  "aws_appsync_region": process.env.REACT_APP_REGION || 'us-west-2',
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
  "API": {
    endpoints: [
      {
        name: 'InsightModAIApi',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_REGION || 'us-west-2',
      },
    ],
  },
};

export default awsmobile;
