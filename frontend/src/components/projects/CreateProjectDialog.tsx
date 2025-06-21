import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { projectsApi } from '../../services/api';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await projectsApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      
      // Reset form
      setFormData({ name: '', description: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', description: '' });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Project</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="name"
              label="Project Name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              placeholder="e.g., Downtown Store Analysis"
            />
            
            <TextField
              name="description"
              label="Description (Optional)"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
              placeholder="Brief description of your project..."
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProjectDialog;