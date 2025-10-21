import React, { createContext, useContext, useEffect, useState } from 'react';
import { Auth, Hub } from 'aws-amplify';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Listen for authentication events
    const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          checkAuthState();
          break;
        case 'signOut':
          setUser(null);
          setSession(null);
          break;
        case 'tokenRefresh':
          checkAuthState();
          break;
        case 'tokenRefresh_failure':
          console.error('Token refresh failed:', data);
          // Optionally sign out user if token refresh fails
          handleSignOut();
          break;
        default:
          break;
      }
    });

    // Initial check
    checkAuthState();

    return unsubscribe;
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      // Use getCurrentUser for better error handling in Amplify v5
      const currentUser = await Auth.getCurrentUser();
      const currentSession = await Auth.currentSession();
      setUser(currentUser);
      setSession(currentSession);
    } catch (error) {
      console.log('No authenticated user:', error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username, password) => {
    try {
      setLoading(true);
      const result = await Auth.signIn(username, password);
      setUser(result);
      const currentSession = await Auth.currentSession();
      setSession(currentSession);
      toast.success('Successfully signed in!');
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signUp = async (email, password, name = '') => {
    try {
      setLoading(true);
      const result = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          ...(name && { name }),
        },
      });
      toast.success('Account created successfully! Please check your email to confirm your account.');
      return result;
    } catch (error) {
      console.error('Sign up error:', error);

      let errorMessage = 'Failed to create account';

      if (error.name === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.name === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet requirements. Please use at least 8 characters with numbers and symbols.';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Invalid email format. Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      setLoading(true);
      const result = await Auth.confirmSignUp(email, code);
      toast.success('Account confirmed successfully! You can now sign in.');
      return result;
    } catch (error) {
      console.error('Confirm sign up error:', error);

      let errorMessage = 'Failed to confirm account';

      if (error.name === 'CodeMismatchException') {
        errorMessage = 'Invalid confirmation code. Please check and try again.';
      } else if (error.name === 'ExpiredCodeException') {
        errorMessage = 'Confirmation code has expired. Please request a new one.';
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Account is already confirmed.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async (email) => {
    try {
      setLoading(true);
      await Auth.resendSignUp(email);
      toast.success('Confirmation code sent to your email.');
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast.error('Failed to resend confirmation code.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await handleSignOut();
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async () => {
    try {
      const currentSession = await Auth.currentSession();
      return currentSession.getAccessToken().getJwtToken();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  const getIdToken = async () => {
    try {
      const currentSession = await Auth.currentSession();
      return currentSession.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    getAccessToken,
    getIdToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
