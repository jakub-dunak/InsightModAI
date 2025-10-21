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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Person,
  SmartToy,
  Memory,
  Folder,
} from '@mui/icons-material';
import { useAPI } from '../services/api';

const MemoryViewer = () => {
  const { api } = useAPI();
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch memory data from API
        const response = await api.get('/memory');
        setMemoryData(response.data);
      } catch (err) {
        console.error('Error fetching memory data:', err);
        setError('Failed to load memory data');
        // For now, use mock data
        setMemoryData(getMockMemoryData());
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryData();
  }, [api]);

  const getMockMemoryData = () => ({
    namespaces: [
      {
        name: 'customer_support',
        description: 'Customer support conversations and resolutions',
        conversationCount: 156,
        lastUpdated: '2024-01-15T10:30:00Z',
        size: '2.4 MB'
      },
      {
        name: 'product_feedback',
        description: 'Product feedback and improvement suggestions',
        conversationCount: 89,
        lastUpdated: '2024-01-15T09:45:00Z',
        size: '1.8 MB'
      },
      {
        name: 'technical_issues',
        description: 'Technical problem resolution and troubleshooting',
        conversationCount: 67,
        lastUpdated: '2024-01-15T08:20:00Z',
        size: '1.2 MB'
      }
    ],
    recentConversations: [
      {
        sessionId: 'sess_12345',
        customerId: 'cust_001',
        timestamp: '2024-01-15T10:30:00Z',
        duration: 450,
        messageCount: 8,
        summary: 'Customer reported billing discrepancy, resolved by adjusting invoice',
        sentiment: 'neutral',
        namespace: 'customer_support',
        messages: [
          {
            role: 'user',
            content: 'I was charged twice for my subscription this month',
            timestamp: '2024-01-15T10:25:00Z'
          },
          {
            role: 'assistant',
            content: 'I apologize for the inconvenience. Let me check your account and resolve this billing issue.',
            timestamp: '2024-01-15T10:25:30Z'
          },
          {
            role: 'assistant',
            content: 'I can see there was a duplicate charge. I\'ve processed a refund for the extra amount.',
            timestamp: '2024-01-15T10:28:00Z'
          },
          {
            role: 'user',
            content: 'Thank you for fixing that quickly!',
            timestamp: '2024-01-15T10:30:00Z'
          }
        ]
      },
      {
        sessionId: 'sess_12344',
        customerId: 'cust_002',
        timestamp: '2024-01-15T10:15:00Z',
        duration: 320,
        messageCount: 6,
        summary: 'Customer inquired about product features, provided detailed information',
        sentiment: 'positive',
        namespace: 'product_feedback',
        messages: [
          {
            role: 'user',
            content: 'Can you tell me more about the advanced analytics features?',
            timestamp: '2024-01-15T10:10:00Z'
          },
          {
            role: 'assistant',
            content: 'I\'d be happy to explain our advanced analytics capabilities...',
            timestamp: '2024-01-15T10:12:00Z'
          }
        ]
      }
    ],
    memoryStats: {
      totalConversations: 312,
      totalNamespaces: 3,
      averageSessionLength: 385,
      memoryUtilization: '45%'
    }
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredConversations = (memoryData?.recentConversations || []).filter(conv =>
    conv.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !memoryData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const data = memoryData || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agent Memory Viewer
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        View agent conversation history, memory namespaces, and session summaries.
      </Alert>

      {/* Memory Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.memoryStats?.totalConversations || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Conversations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.memoryStats?.totalNamespaces || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Memory Namespaces
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.memoryStats?.averageSessionLength ? `${(data.memoryStats.averageSessionLength / 1000).toFixed(1)}s` : '0s'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Session Length
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {data.memoryStats?.memoryUtilization || '0%'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Memory Utilization
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Recent Conversations" />
            <Tab label="Memory Namespaces" />
          </Tabs>

          {/* Recent Conversations Tab */}
          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {filteredConversations.map((conversation, index) => (
                <Accordion key={conversation.sessionId} sx={{ mb: index < filteredConversations.length - 1 ? 2 : 0 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                      <Memory color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          Session {conversation.sessionId}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Customer {conversation.customerId} • {new Date(conversation.timestamp).toLocaleString()} • {(conversation.duration / 1000).toFixed(1)}s
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={conversation.sentiment}
                          size="small"
                          color={conversation.sentiment === 'positive' ? 'success' : conversation.sentiment === 'negative' ? 'error' : 'default'}
                          variant="outlined"
                        />
                        <Chip label={conversation.namespace} size="small" variant="outlined" />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Summary: {conversation.summary}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Conversation ({conversation.messageCount} messages):
                    </Typography>

                    <List dense>
                      {conversation.messages.map((message, msgIndex) => (
                        <ListItem key={msgIndex} sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {message.role === 'user' ? <Person color="primary" /> : <SmartToy color="secondary" />}
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {message.role === 'user' ? 'Customer' : 'Agent'}:
                                </Typography>
                                <Typography variant="body2">
                                  {message.content}
                                </Typography>
                              </Box>
                            }
                            secondary={new Date(message.timestamp).toLocaleTimeString()}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Memory Namespaces Tab */}
          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {(data.namespaces || []).map((namespace) => (
                  <Grid item xs={12} md={6} key={namespace.name}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Folder color="primary" />
                          <Typography variant="h6">{namespace.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {namespace.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2">
                              <strong>{namespace.conversationCount}</strong> conversations
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Updated {new Date(namespace.lastUpdated).toLocaleString()}
                            </Typography>
                          </Box>
                          <Chip label={namespace.size} size="small" variant="outlined" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MemoryViewer;
