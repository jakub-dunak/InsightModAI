import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Storage,
  Speed,
  Memory,
  CheckCircle,
} from '@mui/icons-material';
import { useAPI } from '../services/api';

const Dashboard = () => {
  const { api } = useAPI();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard metrics from API
        const response = await api.get('/insights?summary=true');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const data = dashboardData || {};

  const StatCard = ({ title, value, icon, color = 'primary', trend }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value || 'N/A'}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        InsightModAI Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                icon={<CheckCircle />}
                label="Agent Runtime"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<CheckCircle />}
                label="API Gateway"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<CheckCircle />}
                label="Database"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<CheckCircle />}
                label="Storage"
                color="success"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label="View Logs"
                color="primary"
                variant="outlined"
                clickable
              />
              <Chip
                label="Generate Report"
                color="primary"
                variant="outlined"
                clickable
              />
              <Chip
                label="Configure Modules"
                color="primary"
                variant="outlined"
                clickable
              />
            </Box>
          </Paper>
        </Grid>

        {/* Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Feedback"
            value={data.totalFeedback || 0}
            icon={<Storage color="primary" sx={{ fontSize: 40 }} />}
            trend={data.feedbackTrend}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Sentiment"
            value={`${data.avgSentiment ? (data.avgSentiment * 100).toFixed(1) : '0'}%`}
            icon={<TrendingUp color="success" sx={{ fontSize: 40 }} />}
            color="success"
            trend={data.sentimentTrend}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processing Time"
            value={`${data.avgProcessingTime || '0'}ms`}
            icon={<Speed color="info" sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={data.activeSessions || 0}
            icon={<Memory color="warning" sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <Box>
                {data.recentActivity.slice(0, 5).map((activity, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" py={1}>
                    <Typography variant="body2">
                      {activity.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recent activity
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alerts
            </Typography>
            {data.alerts && data.alerts.length > 0 ? (
              <Box>
                {data.alerts.map((alert, index) => (
                  <Alert key={index} severity={alert.severity} sx={{ mb: 1 }}>
                    {alert.message}
                  </Alert>
                ))}
              </Box>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={100}>
                <CheckCircle color="success" />
                <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                  All systems normal
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
