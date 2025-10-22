import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import '@aws-amplify/ui-react/styles.css';

// Components
import AuthWrapper from './components/AuthWrapper';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ModuleControl from './components/ModuleControl';
import Observability from './components/Observability';
import Monitoring from './components/Monitoring';
import MemoryViewer from './components/MemoryViewer';

// Services
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

// Main App Component
function AppContent() {
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="modules" element={<ModuleControl />} />
            <Route path="observability" element={<Observability />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="memory" element={<MemoryViewer />} />
          </Route>
        </Routes>
      </AuthWrapper>
    </Router>
  );
}

// Main App
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <APIProvider>
        <AppContent />
        <Toaster position="top-right" />
      </APIProvider>
    </ThemeProvider>
  );
}

export default App;
