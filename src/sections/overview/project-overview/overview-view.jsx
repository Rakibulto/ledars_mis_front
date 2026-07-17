'use client';

import { useMemo } from 'react';
import { m } from 'framer-motion';

import { Box, Grid, Card, Stack, alpha, Container, Typography, CardContent } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { varFade } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';
import useProjectContext from 'src/auth/hooks/use-project-context';

import { ModuleCard } from './module-card';

// ----------------------------------------------------------------------

const MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    header: 'Overview',
    description: 'Analytics and insights at a glance',
    icon: <Iconify icon="solar:chart-square-bold-duotone" />,
    category: 'Core',
    color: '#00A76F',
  },
  {
    id: 'employee',
    title: 'Employee Management',
    header: '(HR Module)',
    description: 'Manage employee records and profiles',
    icon: <Iconify icon="solar:user-bold-duotone" />,
    category: 'HR',
    color: '#1877F2',
  },
  {
    id: 'attendance',
    title: 'Attendance Management',
    header: '(HR Module)',
    description: 'Track employee attendance and shifts',
    icon: <Iconify icon="solar:calendar-mark-bold-duotone" />,
    category: 'HR',
    color: '#7635DC',
  },
  {
    id: 'leave',
    title: 'Leave Management',
    header: '(HR Module)',
    description: 'Handle leave requests and approvals',
    icon: <Iconify icon="solar:logout-2-bold-duotone" />,
    category: 'HR',
    color: '#0E9F6E',
  },
  {
    id: 'holiday',
    title: 'Holiday Management',
    header: '(HR Module)',
    description: 'Configure organizational holidays',
    icon: <Iconify icon="solar:calendar-search-bold-duotone" />,
    category: 'HR',
    color: '#F59E0B',
  },
  {
    id: 'payroll',
    title: 'Payroll',
    header: '(HR Module)',
    description: 'Process salaries and payroll records',
    icon: <Iconify icon="solar:wallet-money-bold-duotone" />,
    category: 'HR',
    color: '#10B981',
  },
  {
    id: 'settings',
    title: 'Settings',
    header: '(HR Module)',
    description: 'System configuration and preferences',
    icon: <Iconify icon="solar:settings-bold-duotone" />,
    category: 'Core',
    color: '#6366F1',
  },
  {
    id: 'store-inventory',
    title: 'Store & Inventory',
    header: 'Ledars Management Module',
    description: 'Inventory tracking and management',
    icon: <Iconify icon="solar:box-bold-duotone" />,
    category: 'Management',
    color: '#EC4899',
  },
  {
    id: 'procurement',
    title: 'Procurement',
    header: 'Ledars Management Module',
    description: 'Purchase orders and procurement',
    icon: <Iconify icon="solar:cart-large-4-bold-duotone" />,
    category: 'Management',
    color: '#F97316',
  },
];

const QUICK_STATS = [
  {
    title: 'Total Modules',
    value: '9',
    icon: 'solar:widget-5-bold-duotone',
    color: 'primary',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    title: 'Active Systems',
    value: '100%',
    icon: 'solar:shield-check-bold-duotone',
    color: 'success',
    gradient: 'linear-gradient(135deg, #0cebeb 0%, #20e3b2 100%)',
  },
  {
    title: 'Quick Access',
    value: 'Ready',
    icon: 'solar:bolt-bold-duotone',
    color: 'warning',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
];

// ----------------------------------------------------------------------

export function ProjectOverviewView() {
  const { user } = useAuthContext();
  const { setModuleHeader, setShowModuleName } = useProjectContext();

  const handleModuleSelect = (moduleId, moduleHeader) => {
    setShowModuleName(moduleId);
    setModuleHeader(moduleHeader);
  };

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const modulesByCategory = useMemo(
    () =>
      MODULES.reduce((acc, module) => {
        if (!acc[module.category]) {
          acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
      }, {}),
    []
  );

  return (
    <Container maxWidth="xl">
      {/* Hero Section with Welcome Message */}
      <Box
        component={m.div}
        variants={varFade().inUp}
        sx={{
          mb: 5,
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
              theme.palette.primary.dark,
              0.16
            )} 100%)`,
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          boxShadow: (theme) =>
            `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}, 0 0 0 1px ${alpha(
              theme.palette.primary.main,
              0.04
            )}`,
        }}
      >
        {/* Background Decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: (theme) =>
              `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Iconify icon="solar:sun-2-bold-duotone" width={24} />
              {greetingTime}, {user?.username || 'User'}!
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
              }}
            >
              Welcome to HRM & Management System
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', maxWidth: 700, lineHeight: 1.8 }}
            >
              Streamline your organization&apos;s operations with our comprehensive management
              platform. Access all modules from this central hub to manage HR, inventory,
              procurement, and more.
            </Typography>
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={2}>
            {QUICK_STATS.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.title}>
                <Card
                  component={m.div}
                  variants={varFade().inUp}
                  transition={{ delay: index * 0.1 }}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: (theme) => alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                    boxShadow: (theme) => theme.customShadows.card,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.customShadows.z16,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: stat.gradient,
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        <Iconify icon={stat.icon} width={28} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {stat.title}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>

      {/* Modules Section by Category */}
      <Stack spacing={5}>
        {Object.entries(modulesByCategory).map(([category, modules], categoryIndex) => (
          <Box
            key={category}
            component={m.div}
            variants={varFade().inUp}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 32,
                    borderRadius: 1,
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  }}
                />
                {category} Modules
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {modules.length}
                </Box>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', pl: 3.5 }}>
                {category === 'Core' && 'Essential system features and configurations'}
                {category === 'HR' && 'Human resources and employee management tools'}
                {category === 'Management' && 'Inventory and procurement management systems'}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {modules.map((module, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={module?.title || index}>
                  <ModuleCard module={module} onSelect={handleModuleSelect} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Stack>

      {/* Footer Info Section */}
      <Box
        component={m.div}
        variants={varFade().inUp}
        sx={{
          mt: 6,
          mb: 3,
          p: 4,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(
              theme.palette.info.main,
              0.08
            )} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.16)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            right: -30,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: (theme) =>
              `radial-gradient(circle, ${alpha(theme.palette.info.main, 0.08)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Need Help Getting Started?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 500 }}>
              Explore our comprehensive documentation or contact support for assistance with any
              module.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => theme.customShadows.primary,
                },
              }}
            >
              <Iconify icon="solar:book-2-bold-duotone" width={20} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Documentation
              </Typography>
            </Box>

            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Iconify icon="solar:chat-round-dots-bold-duotone" width={20} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Get Support
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
