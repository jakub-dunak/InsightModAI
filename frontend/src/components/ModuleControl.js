import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import { useAPI } from '../services/api';

const ModuleControl = () => {
  const { api } = useAPI();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      // Fetch current configuration from API
      const response = await api.get('/config');
      setConfig(response.data || {});
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.put('/config', config);
      // Show success message
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Module Control Panel
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Modules
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.crm_enabled || false}
                      onChange={(e) => handleConfigChange('crm_enabled', e.target.checked)}
                    />
                  }
                  label="CRM Integration"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.auto_process_feedback || false}
                      onChange={(e) => handleConfigChange('auto_process_feedback', e.target.checked)}
                    />
                  }
                  label="Auto Process Feedback"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enable_memory || false}
                      onChange={(e) => handleConfigChange('enable_memory', e.target.checked)}
                    />
                  }
                  label="Agent Memory"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Thresholds
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Negative Threshold"
                  type="number"
                  value={config.negative_threshold || 0.3}
                  onChange={(e) => handleConfigChange('negative_threshold', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                />

                <TextField
                  label="Positive Threshold"
                  type="number"
                  value={config.positive_threshold || 0.7}
                  onChange={(e) => handleConfigChange('positive_threshold', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Settings
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Max Processing Time (seconds)"
                  type="number"
                  value={config.max_processing_time || 300}
                  onChange={(e) => handleConfigChange('max_processing_time', parseInt(e.target.value))}
                />

                <TextField
                  label="Batch Size"
                  type="number"
                  value={config.batch_size || 10}
                  onChange={(e) => handleConfigChange('batch_size', parseInt(e.target.value))}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={fetchConfig} disabled={loading || saving}>
              Reset
            </Button>
            <Button variant="contained" onClick={saveConfig} disabled={loading || saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModuleControl;
