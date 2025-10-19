// AWS Amplify configuration
// This file will be populated by the CloudFormation template
const awsconfig = {
  Auth: {
    region: process.env.REACT_APP_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    mandatorySignIn: false,
  },
  API: {
    endpoints: [
      {
        name: 'InsightModAIApi',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_REGION || 'us-east-1',
      },
    ],
  },
  // Storage configuration can be added here if needed for file uploads
  // Storage: {
  //   AWSS3: {
  //     bucket: process.env.REACT_APP_S3_BUCKET,
  //     region: process.env.REACT_APP_REGION || 'us-east-1',
  //   },
  // },
};

export default awsconfig;
