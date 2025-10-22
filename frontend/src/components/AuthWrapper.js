import React, { useState, createContext, useContext } from 'react';
import {
  Authenticator,
  useAuthenticator,
  View,
  Heading,
  Text,
  ThemeProvider
} from '@aws-amplify/ui-react';
import {
  Box,
  Paper,
  Typography,
  Container,
  CssBaseline,
} from '@mui/material';

// Context for sharing auth state with components outside the Authenticator tree
const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Check if we have valid Cognito configuration for authentication
const hasValidCognitoConfig = process.env.REACT_APP_USER_POOL_ID && process.env.REACT_APP_USER_POOL_CLIENT_ID;

// Custom theme for Amplify Authenticator
const authTheme = {
  name: 'secureAuditTheme',
  tokens: {
    colors: {
      background: {
        primary: { value: '#fafafa' },
        secondary: { value: '#ffffff' },
      },
      font: {
        primary: { value: '#171717' },
        secondary: { value: '#525252' },
        tertiary: { value: '#737373' },
      },
      brand: {
        primary: {
          10: { value: '#f0f9ff' },
          20: { value: '#e0f2fe' },
          40: { value: '#bae6fd' },
          60: { value: '#7dd3fc' },
          80: { value: '#38bdf8' },
          90: { value: '#0ea5e9' },
          100: { value: '#0284c7' },
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: '{colors.brand.primary.90}' },
          _hover: {
            backgroundColor: { value: '{colors.brand.primary.100}' },
          },
        },
      },
      fieldcontrol: {
        _focus: {
          borderColor: { value: '{colors.brand.primary.90}' },
          boxShadow: { value: '0 0 0 1px {colors.brand.primary.90}' },
        },
      },
    },
  },
};

// Custom sign-in form component
const CustomSignIn = () => {
  return (
    <View style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          margin: '0 auto 16px',
          width: '64px',
          height: '64px',
          backgroundColor: '#e0f2fe',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg style={{ width: '32px', height: '32px', color: '#0ea5e9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <Heading level={1} style={{ fontSize: '24px', fontWeight: 'bold', color: '#171717', marginBottom: '8px' }}>
          Welcome to InsightModAI
        </Heading>
        <Text style={{ color: '#525252' }}>
          Sign in to access your dashboard
        </Text>
      </div>
    </View>
  );
};

// Custom sign-up form component
const CustomSignUp = () => {
  return (
    <View style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          margin: '0 auto 16px',
          width: '64px',
          height: '64px',
          backgroundColor: '#e0f2fe',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg style={{ width: '32px', height: '32px', color: '#0ea5e9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <Heading level={1} style={{ fontSize: '24px', fontWeight: 'bold', color: '#171717', marginBottom: '8px' }}>
          Create Your Account
        </Heading>
        <Text style={{ color: '#525252' }}>
          Get started with InsightModAI
        </Text>
      </div>
    </View>
  );
};

// Loading component
const AuthLoading = () => (
  <Container component="main" maxWidth="xs">
    <CssBaseline />
    <Box
      sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e0f2fe',
          borderTop: '4px solid #0ea5e9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <Typography variant="h6" gutterBottom>
          Authenticating...
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Please wait while we verify your credentials
        </Typography>
      </Paper>
    </Box>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </Container>
);

// Component that handles authentication when Cognito is configured
const AuthenticatedWrapper = ({ children }) => {
  return (
    <ThemeProvider theme={authTheme}>
      <Authenticator
        components={{
          SignIn: {
            Header: CustomSignIn,
          },
          SignUp: {
            Header: CustomSignUp,
          },
        }}
        signUpAttributes={['email', 'name']}
        loginMechanisms={['email']}
        socialProviders={[]}
        variation="default"
      >
        <AuthenticatorContent>{children}</AuthenticatorContent>
      </Authenticator>
    </ThemeProvider>
  );
};

// Inner component that uses useAuthenticator hook
const AuthenticatorContent = ({ children }) => {
  const { authStatus, user, signOut } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
    context.signOut,
  ]);

  // Show loading while checking authentication status
  if (authStatus === 'configuring') {
    return <AuthLoading />;
  }

  // If authenticated, render the protected content with auth context
  if (authStatus === 'authenticated') {
    return (
      <AuthContext.Provider value={{ user, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Default fallback - this shouldn't be reached since Authenticator handles unauthenticated state
  return <AuthLoading />;
};

// Development mode component (when Cognito is not configured)
const DevelopmentModeBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      backgroundColor: '#fef3c7',
      borderBottom: '1px solid #f59e0b',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg style={{ width: '20px', height: '20px', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#92400e', margin: '0' }}>
              Development Mode Active
            </p>
            <p style={{ fontSize: '14px', color: '#a16207', margin: '0' }}>
              Authentication is disabled. Deploy to production for full security features.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            color: '#92400e',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          onMouseOver={(e) => e.target.style.color = '#78350f'}
          onMouseOut={(e) => e.target.style.color = '#92400e'}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Main wrapper component
const AuthWrapper = ({ children }) => {
  // Skip authentication entirely in local development if Cognito is not configured
  if (!hasValidCognitoConfig) {
    // Provide a development auth context with mock user data
    const devAuthContext = {
      user: {
        username: 'dev-user',
        attributes: {
          email: 'dev@example.com',
          name: 'Development User'
        }
      },
      signOut: () => {
        console.log('Sign out clicked (development mode - no action taken)');
      }
    };

    return (
      <>
        <DevelopmentModeBanner />
        <AuthContext.Provider value={devAuthContext}>
          {children}
        </AuthContext.Provider>
      </>
    );
  }

  // Use authenticated wrapper when Cognito is configured
  return <AuthenticatedWrapper>{children}</AuthenticatedWrapper>;
};

export default AuthWrapper;
