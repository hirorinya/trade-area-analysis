import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Map, Analytics, Business } from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import CreateProjectDialog from '../components/projects/CreateProjectDialog';
import { RootState, AppDispatch } from '../store';
import { projectsApi } from '../services/api';
import { Project } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectsApi.getAll();
        setProjects(response.projects);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateSuccess = () => {
    // Refresh projects list
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll();
        setProjects(response.projects);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Created today';
    if (diffDays === 2) return 'Created yesterday';
    if (diffDays < 7) return `Created ${diffDays} days ago`;
    if (diffDays < 14) return 'Created 1 week ago';
    if (diffDays < 21) return 'Created 2 weeks ago';
    return `Created ${Math.floor(diffDays / 7)} weeks ago`;
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.first_name || 'User'}!
        </Typography>
        
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    fullWidth
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    New Project
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Map />}
                    fullWidth
                  >
                    View Map
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Analytics />}
                    fullWidth
                  >
                    Analytics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Projects */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Projects
                </Typography>
                <Paper variant="outlined">
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>
                      {error}
                    </Alert>
                  ) : projects.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No projects yet. Create your first project to get started!
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {projects.map((project) => (
                        <ListItem key={project.id} disablePadding>
                          <ListItemButton>
                            <ListItemText
                              primary={project.name}
                              secondary={
                                <>
                                  {project.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {project.description}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(project.created_at)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Business color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">{projects.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Projects
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Map color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">0</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trade Areas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Analytics color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">0</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyses Run
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Business color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4">0</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Competitors Tracked
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Layout>
  );
};

export default Dashboard;