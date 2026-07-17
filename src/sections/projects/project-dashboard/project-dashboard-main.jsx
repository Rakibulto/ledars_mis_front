'use client';

/* eslint-disable perfectionist/sort-named-imports */
import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import MuiAutocomplete from 'src/components/hook-form/mui-autocomplete';

const EP = endpoints.pm;

export default function ProjectDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');

  // Dialog states
  const notificationsDialog = useBoolean();
  const uploadPlanDialog = useBoolean();
  const projectDetailsDialog = useBoolean();
  const activitiesDialog = useBoolean();

  // Fetch real data from API
  const { data: projectsData, loading: projectsLoading } = useGetRequest(EP.projects);
  const { data: activitiesData, loading: activitiesLoading } = useGetRequest(EP.project_activities);

  const activeProjectsData = useMemo(() => {
    const projects = projectsData?.results || projectsData || [];
    const activities = activitiesData?.results || activitiesData || [];

    return projects.map((p) => {
      const projectActivities = activities.filter((a) => a.project === p.id);
      const completedActivities = projectActivities.filter((a) => a.status === 'Completed');
      return {
        ...p,
        activities: `${completedActivities.length}/${projectActivities.length}`,
        progress: projectActivities.length
          ? Math.round(
              projectActivities.reduce((sum, a) => sum + (a.progress || 0), 0) /
                projectActivities.length
            )
          : 0,
        activitiesList: projectActivities.map((a) => ({
          id: a.id,
          name: a.title,
          status: a.status,
          completion: a.progress || 0,
        })),
        manager: p.manager_name || p.manager || '',
        budget: p.budget ?? '',
        spent: p.spent ?? '',
        endDate: p.end_date,
        startDate: p.start_date,
      };
    });
  }, [projectsData, activitiesData]);

  const summaryData = useMemo(() => {
    const projects = projectsData?.results || projectsData || [];
    const activities = activitiesData?.results || activitiesData || [];
    const active = projects.filter((p) => p.status === 'Active').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const overdue = activities.filter((a) => {
      if (!a.due_date) return false;
      return new Date(a.due_date) < new Date() && a.status !== 'Completed';
    }).length;
    const pending = activities.filter((a) => a.status === 'Pending').length;

    return [
      {
        title: 'Total Projects',
        value: String(projects.length),
        icon: 'solar:chart-2-bold-duotone',
        iconColor: '#ffffff',
        iconBg: '#2563eb',
      },
      {
        title: 'Active',
        value: String(active),
        icon: 'solar:play-circle-bold-duotone',
        iconColor: '#ffffff',
        iconBg: '#10b981',
      },
      {
        title: 'Activities',
        value: String(activities.length),
        icon: 'solar:graph-up-bold-duotone',
        iconColor: '#ffffff',
        iconBg: '#8b5cf6',
      },
      {
        title: 'Completed',
        value: String(completed),
        icon: 'solar:check-circle-bold-duotone',
        iconColor: '#10b981',
        iconBg: '#ffffff',
      },
      {
        title: 'Overdue',
        value: String(overdue),
        icon: 'solar:danger-circle-bold-duotone',
        iconColor: '#ef4444',
        iconBg: '#ffffff',
      },
      {
        title: 'Pending',
        value: String(pending),
        icon: 'solar:clock-circle-bold-duotone',
        iconColor: '#2563eb',
        iconBg: '#ffffff',
      },
    ];
  }, [projectsData, activitiesData]);

  const notificationsData = useMemo(() => {
    const activities = activitiesData?.results || activitiesData || [];
    return activities
      .filter((a) => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'Completed')
      .slice(0, 5)
      .map((a, i) => ({
        id: a.id,
        type: 'Activity Overdue',
        project: a.project_name || `Project #${a.project}`,
        message: `"${a.title}" is overdue`,
        time: a.due_date,
        priority: 'high',
      }));
  }, [activitiesData]);

  const urgentAlertsData = useMemo(
    () => notificationsData.filter((n) => n.priority === 'high').slice(0, 3),
    [notificationsData]
  );

  const upcomingDeadlinesData = useMemo(() => {
    const activities = activitiesData?.results || activitiesData || [];
    const now = new Date();
    return activities
      .filter((a) => a.due_date && new Date(a.due_date) > now && a.status !== 'Completed')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        assignee: a.responsible_person || '',
        daysLeft: Math.ceil((new Date(a.due_date) - now) / (1000 * 60 * 60 * 24)),
        date: a.due_date,
      }));
  }, [activitiesData]);

  // Filtered projects based on search and status
  const filteredProjects = useMemo(() => {
    let filtered = activeProjectsData;

    if (statusFilter && statusFilter !== 'All Status') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.manager.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [searchQuery, statusFilter, activeProjectsData]);

  // Handlers
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    projectDetailsDialog.onTrue();
  };

  const handleViewActivities = (project) => {
    setSelectedProject(project);
    activitiesDialog.onTrue();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      // Here you would typically upload the file to your server
      // console.log('Uploading file:', file.name);
    }
  };

  const handleExport = () => {
    // Export functionality
    // console.log('Exporting data...', { searchQuery, statusFilter });
    // You can implement Excel or CSV export here
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
      {/* Header Section */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Iconify icon="solar:chart-2-bold-duotone" width={28} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Project Management & Planning
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Real-time project tracking with automated notifications and progress monitoring
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Badge badgeContent={notificationsData.length} color="error">
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:bell-bold" />}
                  onClick={notificationsDialog.onTrue}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  Notifications
                </Button>
              </Badge>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:upload-bold" />}
                onClick={uploadPlanDialog.onTrue}
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': { bgcolor: '#f0f0f0' },
                }}
              >
                Upload Plan
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryData.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 2 }} key={index}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow:
                  item.iconBg === '#ffffff'
                    ? '0 2px 8px rgba(0,0,0,0.08)'
                    : '0 4px 12px rgba(0,0,0,0.1)',
                border: item.iconBg === '#ffffff' ? '1px solid #e5e7eb' : 'none',
                background: item.iconBg !== '#ffffff' ? item.iconBg : 'white',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor:
                      item.iconBg === '#ffffff' ? `${item.iconColor}15` : 'rgba(255,255,255,0.2)',
                    mb: 1.5,
                  }}
                >
                  <Iconify icon={item.icon} width={28} sx={{ color: item.iconColor }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    color: item.iconBg === '#ffffff' ? '#1a1a1a' : 'white',
                  }}
                >
                  {item.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: item.iconBg === '#ffffff' ? '#6b7280' : 'rgba(255,255,255,0.9)',
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs and Search Section */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Dashboard" />
            <Tab label="Projects" />
            <Tab label="All Activities" />
          </Tabs>
        </Box>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search projects or activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-linear" />
                    </InputAdornment>
                  ),
                }}
                sx={{ bgcolor: '#f9fafb', borderRadius: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <MuiAutocomplete
                value={statusFilter}
                onChange={(e, newValue) => setStatusFilter(newValue)}
                options={['All Status', 'Active', 'Pending', 'Completed', 'Overdue']}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={handleExport}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content - Two Columns */}
      <Grid container spacing={3}>
        {/* Left Column - Active Projects Progress */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Active Projects Progress
              </Typography>
              <Stack spacing={3}>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <Card
                      key={project.id}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid #e5e7eb',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {project.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.code} • {project.manager}
                            </Typography>
                          </Box>
                          <Chip
                            label={project.status}
                            size="small"
                            sx={{
                              bgcolor: '#d1fae5',
                              color: '#065f46',
                              fontWeight: 600,
                              height: 24,
                            }}
                          />
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Budget
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {project.budget}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Activities
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {project.activities}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              End Date
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {project.endDate}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Overall Progress
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {project.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              bgcolor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#2563eb',
                                borderRadius: 1,
                              },
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<Iconify icon="solar:eye-bold" width={16} />}
                            onClick={() => handleViewDetails(project)}
                            sx={{ textTransform: 'none', color: '#2563eb' }}
                          >
                            View Details
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Iconify icon="solar:widget-4-bold" width={16} />}
                            onClick={() => handleViewActivities(project)}
                            sx={{ textTransform: 'none', color: '#6b7280' }}
                          >
                            Activities
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      bgcolor: '#f9fafb',
                      borderRadius: 2,
                    }}
                  >
                    <Iconify
                      icon="solar:folder-open-bold-duotone"
                      width={48}
                      sx={{ color: '#9ca3af', mb: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No projects found matching your filters
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Alerts and Deadlines */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Urgent Alerts */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Iconify icon="solar:danger-circle-bold" width={20} sx={{ color: '#ef4444' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Urgent Alerts
                  </Typography>
                </Box>
                {urgentAlertsData.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity="error"
                    icon={<Iconify icon="solar:info-circle-bold" />}
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {alert.type}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                      {alert.project}
                    </Typography>
                    <Chip
                      label={alert.status}
                      size="small"
                      sx={{
                        bgcolor: '#fee2e2',
                        color: '#991b1b',
                        height: 20,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Alert>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Iconify icon="solar:clock-circle-bold" width={20} sx={{ color: '#2563eb' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Upcoming Deadlines
                  </Typography>
                </Box>
                {upcomingDeadlinesData.map((deadline) => (
                  <Box
                    key={deadline.id}
                    sx={{
                      p: 2,
                      bgcolor: '#f9fafb',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {deadline.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 1 }}
                    >
                      {deadline.assignee}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Chip
                        label={`${deadline.daysLeft} days left`}
                        size="small"
                        sx={{
                          bgcolor: '#dbeafe',
                          color: '#1e40af',
                          height: 20,
                          fontSize: '0.7rem',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {deadline.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationsDialog.value}
        onClose={notificationsDialog.onFalse}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:bell-bold-duotone" width={24} sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Chip
              label={notificationsData.length}
              size="small"
              sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}
            />
          </Box>
          <IconButton onClick={notificationsDialog.onFalse} size="small">
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          <Stack>
            {notificationsData.map((notification, index) => (
              <Box
                key={notification.id}
                sx={{
                  p: 2.5,
                  borderBottom: index < notificationsData.length - 1 ? '1px solid #e5e7eb' : 'none',
                  '&:hover': { bgcolor: '#f9fafb' },
                  cursor: 'pointer',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: notification.priority === 'high' ? '#fee2e2' : '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify
                      icon={
                        notification.priority === 'high'
                          ? 'solar:danger-circle-bold'
                          : 'solar:info-circle-bold'
                      }
                      width={20}
                      sx={{ color: notification.priority === 'high' ? '#ef4444' : '#2563eb' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {notification.type}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.5 }}
                    >
                      {notification.project}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <Iconify icon="solar:clock-circle-line-duotone" width={14} sx={{ mr: 0.5 }} />
                      {notification.time}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={notificationsDialog.onFalse}>
            Close
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
          >
            Mark All as Read
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Plan Dialog */}
      <Dialog
        open={uploadPlanDialog.value}
        onClose={uploadPlanDialog.onFalse}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:upload-bold-duotone" width={24} sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Upload Project Plan
            </Typography>
          </Box>
          <IconButton onClick={uploadPlanDialog.onFalse} size="small">
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              select
              fullWidth
              label="Select Project"
              defaultValue=""
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">Select a project</MenuItem>
              {activeProjectsData.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField fullWidth label="Plan Title" placeholder="e.g., Q1 2025 Work Plan" />

            <Box
              sx={{
                border: '2px dashed #d1d5db',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: '#f9fafb',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f3f4f6' },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
              />
              <Iconify
                icon="solar:cloud-upload-bold-duotone"
                width={48}
                sx={{ color: '#667eea', mb: 2 }}
              />
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDF, DOC, DOCX, XLS, XLSX (max. 10MB)
              </Typography>
              {uploadFileName && (
                <Chip
                  label={uploadFileName}
                  onDelete={() => setUploadFileName('')}
                  sx={{ mt: 2 }}
                  color="primary"
                />
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (Optional)"
              placeholder="Add any notes or description about this plan..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={uploadPlanDialog.onFalse}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:upload-bold" />}
            disabled={!uploadFileName}
            sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
          >
            Upload Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog
        open={projectDetailsDialog.value}
        onClose={projectDetailsDialog.onFalse}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
        }}
      >
        {selectedProject && (
          <>
            <DialogTitle
              sx={{
                bgcolor: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {selectedProject.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedProject.code}
                </Typography>
              </Box>
              <IconButton onClick={projectDetailsDialog.onFalse} sx={{ color: 'white' }}>
                <Iconify icon="solar:close-circle-bold" width={24} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Project Manager
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedProject.manager}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Status
                      </Typography>
                      <Chip
                        label={selectedProject.status}
                        size="small"
                        sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Budget
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {selectedProject.budget}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Spent: {selectedProject.spent}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedProject.startDate} - {selectedProject.endDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Location
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedProject.location}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Beneficiaries
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedProject.beneficiaries?.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ bgcolor: '#f9fafb', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Donor
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedProject.donor}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Project Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={selectedProject.progress}
                    sx={{
                      height: 10,
                      borderRadius: 1,
                      bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10b981',
                        borderRadius: 1,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {selectedProject.progress}% Complete
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={projectDetailsDialog.onFalse}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:widget-4-bold" />}
                onClick={() => {
                  projectDetailsDialog.onFalse();
                  handleViewActivities(selectedProject);
                }}
                sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
              >
                View Activities
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Activities Dialog */}
      <Dialog
        open={activitiesDialog.value}
        onClose={activitiesDialog.onFalse}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
        }}
      >
        {selectedProject && (
          <>
            <DialogTitle
              sx={{
                bgcolor: '#8b5cf6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Project Activities
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedProject.name}
                </Typography>
              </Box>
              <IconButton onClick={activitiesDialog.onFalse} sx={{ color: 'white' }}>
                <Iconify icon="solar:close-circle-bold" width={24} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Activity Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedProject.activitiesList?.map((activity, index) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.status}
                            size="small"
                            sx={{
                              bgcolor:
                                activity.status === 'Completed'
                                  ? '#d1fae5'
                                  : activity.status === 'In Progress'
                                    ? '#dbeafe'
                                    : '#f3f4f6',
                              color:
                                activity.status === 'Completed'
                                  ? '#065f46'
                                  : activity.status === 'In Progress'
                                    ? '#1e40af'
                                    : '#6b7280',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={activity.completion}
                              sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 1,
                                bgcolor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor:
                                    activity.completion === 100
                                      ? '#10b981'
                                      : activity.completion > 0
                                        ? '#2563eb'
                                        : '#9ca3af',
                                  borderRadius: 1,
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 40 }}>
                              {activity.completion}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={activitiesDialog.onFalse}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
              >
                Add Activity
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
