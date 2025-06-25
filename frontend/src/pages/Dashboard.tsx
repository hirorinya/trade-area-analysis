import React from 'react';
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
} from '@mui/material';
import { Add, Map, Analytics, Business } from '@mui/icons-material';
import Layout from '../components/layout/Layout';

const Dashboard: React.FC = () => {
  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
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
                  Recent Projects
                </Typography>
                <Paper variant="outlined">
                  <List>
                    <ListItem disablePadding>
                      <ListItemButton>
                        <ListItemText
                          primary="Downtown Store Analysis"
                          secondary="Created 2 days ago"
                        />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton>
                        <ListItemText
                          primary="Mall Location Study"
                          secondary="Created 1 week ago"
                        />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton>
                        <ListItemText
                          primary="Competitor Analysis - West Side"
                          secondary="Created 2 weeks ago"
                        />
                      </ListItemButton>
                    </ListItem>
                  </List>
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
                    <Typography variant="h4">12</Typography>
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
                    <Typography variant="h4">48</Typography>
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
                    <Typography variant="h4">156</Typography>
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
                    <Typography variant="h4">89</Typography>
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
    </Layout>
  );
};

export default Dashboard;