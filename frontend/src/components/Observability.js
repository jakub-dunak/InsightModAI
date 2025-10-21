import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  CallMade,
  Psychology,
  Timeline,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { useAPI } from '../services/api';

const Observability = () => {
  const { api } = useAPI();
  const [observabilityData, setObservabilityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchObservabilityData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch observability data from API
        const response = await api.get('/observability');
        setObservabilityData(response.data);
      } catch (err) {
        console.error('Error fetching observability data:', err);
        setError('Failed to load observability data');
        // For now, use mock data
        setObservabilityData(getMockObservabilityData());
      } finally {
        setLoading(false);
      }
    };

    fetchObservabilityData();
  }, [api]);

  const getMockObservabilityData = () => ({
    recentTraces: [
      {
        sessionId: 'sess_12345',
        timestamp: '2024-01-15T10:30:00Z',
        duration: 2500,
        status: 'completed',
        steps: [
          {
            step: 1,
            type: 'reasoning',
            description: 'Analyzing customer feedback sentiment',
            duration: 500,
            status: 'completed'
          },
          {
            step: 2,
            type: 'tool_call',
            description: 'Calling sentiment_analysis tool',
            tool: 'sentiment_analyzer',
            parameters: { text: 'Great product, very satisfied!' },
            duration: 1200,
            status: 'completed'
          },
          {
            step: 3,
            type: 'response',
            description: 'Generating final response',
            duration: 800,
            status: 'completed'
          }
        ],
        toolsUsed: ['sentiment_analyzer'],
        finalResponse: 'Customer feedback analyzed successfully.'
      },
      {
        sessionId: 'sess_12346',
        timestamp: '2024-01-15T10:25:00Z',
        duration: 1800,
        status: 'completed',
        steps: [
          {
            step: 1,
            type: 'reasoning',
            description: 'Processing feedback classification',
            duration: 400,
            status: 'completed'
          },
          {
            step: 2,
            type: 'tool_call',
            description: 'Calling feedback_classifier tool',
            tool: 'feedback_classifier',
            parameters: { feedback: 'Product arrived damaged' },
            duration: 1000,
            status: 'completed'
          }
        ],
        toolsUsed: ['feedback_classifier'],
        finalResponse: 'Feedback classified as product issue.'
      }
    ],
    activeSessions: 3,
    totalSessionsToday: 47,
    averageSessionDuration: 2200
  });

  const getStepIcon = (type) => {
    switch (type) {
      case 'reasoning':
        return <Psychology color="primary" />;
      case 'tool_call':
        return <CallMade color="secondary" />;
      case 'response':
        return <Info color="success" />;
      default:
        return <Timeline />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <Error color="error" fontSize="small" />;
      default:
        return <Info color="info" fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !observabilityData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const data = observabilityData || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Observability Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Real-time monitoring of agent execution traces, tool invocations, and session tracking.
      </Alert>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.activeSessions || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.totalSessionsToday || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sessions Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.averageSessionDuration ? `${(data.averageSessionDuration / 1000).toFixed(1)}s` : '0s'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Session Duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Execution Traces */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Agent Execution Traces
          </Typography>

          {(data.recentTraces || []).map((trace, index) => (
            <Accordion key={trace.sessionId} sx={{ mb: index < (data.recentTraces || []).length - 1 ? 2 : 0 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  {getStatusIcon(trace.status)}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">
                      Session {trace.sessionId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(trace.timestamp).toLocaleString()} • {(trace.duration / 1000).toFixed(1)}s
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(trace.toolsUsed || []).map(tool => (
                      <Chip key={tool} label={tool} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {trace.steps.map((step) => (
                    <ListItem key={step.step}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStepIcon(step.type)}
                            <Typography variant="body1">{step.description}</Typography>
                            {getStatusIcon(step.status)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Step {step.step} • {(step.duration / 1000).toFixed(1)}s
                            </Typography>
                            {step.tool && (
                              <Typography variant="body2" color="textSecondary">
                                Tool: {step.tool}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Final Response: {trace.finalResponse}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Observability;
