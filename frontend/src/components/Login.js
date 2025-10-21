import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  CssBaseline,
  Tabs,
  Tab,
  Link,
} from '@mui/material';
import { useAuth } from '../services/auth';

const Login = () => {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, confirmSignUp, resendConfirmationCode, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);

      // Handle different types of authentication errors
      let errorMessage = 'Failed to sign in';

      if (err.name === 'UserNotFoundException') {
        errorMessage = 'User does not exist. Please sign up first or contact your administrator.';
      } else if (err.name === 'NotAuthorizedException') {
        errorMessage = 'Incorrect username or password.';
      } else if (err.name === 'UserNotConfirmedException') {
        errorMessage = 'Please check your email and confirm your account before signing in.';
        setMode('confirm');
      } else if (err.name === 'TooManyRequestsException') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, name);
      setMode('confirm');
      setError('');
    } catch (err) {
      // Error handling is done in the auth service
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp(email, confirmationCode);
      setMode('signin');
      setConfirmationCode('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error handling is done in the auth service
      console.error('Confirm sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    try {
      await resendConfirmationCode(email);
    } catch (err) {
      // Error handling is done in the auth service
      console.error('Resend code error:', err);
    }
  };


  // Show loading while checking authentication state
  if (authLoading) {
    return (
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
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            InsightModAI
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
            Admin Dashboard
          </Typography>

          {mode !== 'confirm' && (
            <Tabs
              value={mode}
              onChange={(e, newValue) => {
                setMode(newValue);
                setError('');
              }}
              sx={{ mb: 3 }}
              variant="fullWidth"
            >
              <Tab label="Sign In" value="signin" />
              <Tab label="Sign Up" value="signup" />
            </Tabs>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          {mode === 'signin' && (
            <Box component="form" onSubmit={handleSignIn} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="signin-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="signin-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !email || !password}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          )}

          {mode === 'signup' && (
            <Box component="form" onSubmit={handleSignUp} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="signup-name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="signup-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="signup-password"
                autoComplete="new-password"
                helperText="At least 8 characters with numbers and symbols"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="signup-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !email || !password || !confirmPassword || !name}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </Box>
          )}

          {mode === 'confirm' && (
            <Box component="form" onSubmit={handleConfirmSignUp} sx={{ mt: 1 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Confirm Your Account
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
                We've sent a confirmation code to {email}
              </Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmation-code"
                label="Confirmation Code"
                name="confirmationCode"
                autoComplete="one-time-code"
                autoFocus
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                disabled={loading}
                helperText={
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Didn't receive code? Resend
                  </Link>
                }
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !confirmationCode}
              >
                {loading ? 'Confirming...' : 'Confirm Account'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setMode('signin')}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                Back to Sign In
              </Button>
            </Box>
          )}

          {mode !== 'confirm' && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {mode === 'signin'
                  ? "Don't have an account? Switch to Sign Up tab."
                  : "Already have an account? Switch to Sign In tab."
                }
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
