import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const MemoryViewer = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agent Memory Viewer
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        View agent conversation history, memory namespaces, and session summaries.
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Conversation History
          </Typography>
          <Typography variant="body2" color="textSecondary">
            AgentCore Memory integration showing conversation context and learning.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MemoryViewer;
