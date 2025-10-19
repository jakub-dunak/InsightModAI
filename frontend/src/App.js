import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ModuleControl from './components/ModuleControl';
import Observability from './components/Observability';
import Monitoring from './components/Monitoring';
import MemoryViewer from './components/MemoryViewer';

// Services
import { AuthProvider, useAuth } from './services/auth';
import { APIProvider } from './services/api';

// Configuration
import awsconfig from './aws-exports';

// Initialize Amplify
Amplify.configure(awsconfig);

// Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </Layout>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Main App Component
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="modules" element={<ModuleControl />} />
          <Route path="observability" element={<Observability />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="memory" element={<MemoryViewer />} />
        </Route>
      </Routes>
    </Router>
  );
}

// Main App
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <APIProvider>
          <AppContent />
          <Toaster position="top-right" />
        </APIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
