import React, { createContext, useContext, useMemo } from 'react';
import axios from 'axios';
import { Auth } from 'aws-amplify';

const APIContext = createContext();

export const useAPI = () => {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};

export const APIProvider = ({ children }) => {
  const api = useMemo(() => {
    // Create axios instance
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API_ENDPOINT,
      timeout: 30000, // 30 seconds
    });

    // Request interceptor to add auth token
    instance.interceptors.request.use(
      async (config) => {
        try {
          // Use Amplify Auth directly instead of custom auth hook
          const session = await Auth.currentSession();
          const token = session.getAccessToken().getJwtToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        } catch (error) {
          console.error('Error getting access token:', error);
          // Don't fail the request if we can't get the token - let it proceed without auth
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - sign out user using Amplify Auth
          console.error('Unauthorized - token may be expired');
          try {
            await Auth.signOut();
          } catch (signOutError) {
            console.error('Error during sign out:', signOutError);
          }
        } else if (error.response?.status >= 500) {
          console.error('Server error:', error.response.data);
        } else if (error.code === 'ECONNABORTED') {
          console.error('Request timeout');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []); // No dependencies needed since we're using Auth directly

  const value = {
    api,
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};
