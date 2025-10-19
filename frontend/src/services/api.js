import React, { createContext, useContext, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './auth';

const APIContext = createContext();

export const useAPI = () => {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};

export const APIProvider = ({ children }) => {
  const { getAccessToken } = useAuth();

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
          const token = await getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        } catch (error) {
          console.error('Error getting access token:', error);
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
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.error('Unauthorized - token may be expired');
          // You might want to trigger a logout here
        } else if (error.response?.status >= 500) {
          console.error('Server error:', error.response.data);
        } else if (error.code === 'ECONNABORTED') {
          console.error('Request timeout');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [getAccessToken]);

  const value = {
    api,
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};
