import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const Monitoring = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monitoring Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Real-time sentiment trends, feedback volume metrics, and processing latency monitoring.
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Metrics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            CloudWatch integration showing key performance indicators and alerts.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Monitoring;
