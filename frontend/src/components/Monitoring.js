import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAPI } from '../services/api';

const Monitoring = () => {
  const { api } = useAPI();
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch monitoring metrics from API
        const response = await api.get('/monitoring');
        setMonitoringData(response.data);
      } catch (err) {
        console.error('Error fetching monitoring data:', err);
        setError('Failed to load monitoring data');
        // For now, use mock data
        setMonitoringData(getMockMonitoringData());
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringData();
  }, [api]);

  const getMockMonitoringData = () => ({
    sentimentTrends: [
      { time: '00:00', positive: 65, neutral: 25, negative: 10 },
      { time: '04:00', positive: 70, neutral: 20, negative: 10 },
      { time: '08:00', positive: 75, neutral: 15, negative: 10 },
      { time: '12:00', positive: 80, neutral: 12, negative: 8 },
      { time: '16:00', positive: 78, neutral: 14, negative: 8 },
      { time: '20:00', positive: 82, neutral: 10, negative: 8 },
    ],
    processingLatency: [
      { time: '00:00', latency: 120 },
      { time: '04:00', latency: 115 },
      { time: '08:00', latency: 130 },
      { time: '12:00', latency: 125 },
      { time: '16:00', latency: 140 },
      { time: '20:00', latency: 135 },
    ],
    feedbackVolume: [
      { channel: 'Email', count: 45, percentage: 45 },
      { channel: 'Web', count: 30, percentage: 30 },
      { channel: 'API', count: 15, percentage: 15 },
      { channel: 'Mobile', count: 10, percentage: 10 },
    ],
    systemHealth: {
      apiGateway: 'healthy',
      lambda: 'healthy',
      dynamodb: 'healthy',
      bedrock: 'healthy',
    }
  });

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !monitoringData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const data = monitoringData || {};

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monitoring Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Real-time sentiment trends, feedback volume metrics, and processing latency monitoring.
      </Alert>

      <Grid container spacing={3}>
        {/* Sentiment Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Trends (Last 24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.sentimentTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="positive" stroke="#00C49F" name="Positive" />
                  <Line type="monotone" dataKey="neutral" stroke="#FFBB28" name="Neutral" />
                  <Line type="monotone" dataKey="negative" stroke="#FF8042" name="Negative" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Feedback Volume by Channel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feedback Volume by Channel
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.feedbackVolume || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(data.feedbackVolume || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Latency */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Latency (ms)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.processingLatency || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="latency" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(data.systemHealth || {}).map(([service, status]) => (
                  <Box key={service} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </Typography>
                    <Alert
                      severity={status === 'healthy' ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ py: 0, px: 1, minHeight: 'auto' }}
                    >
                      {status}
                    </Alert>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Monitoring;
