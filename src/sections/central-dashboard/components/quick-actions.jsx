'use client';

import Link from 'next/link';
import {
  FolderPlus,
  FilePlus,
  UserPlus,
  Heart,
  Package,
  Calendar,
  ClipboardList,
  Target,
} from 'lucide-react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { SectionCard } from './common';

const actions = [
  {
    label: 'Create Project',
    icon: FolderPlus,
    href: paths.dashboard.projectManagements?.root || '/dashboard/project-managements/',
    color: 'info',
  },
  {
    label: 'Create Procurement',
    icon: FilePlus,
    href: paths.dashboard.procurement?.root || '/dashboard/procurement/',
    color: 'warning',
  },
  {
    label: 'Add Employee',
    icon: UserPlus,
    href: paths.dashboard.user?.account || '/dashboard/user/',
    color: 'secondary',
  },
  {
    label: 'Add Beneficiary',
    icon: Heart,
    href: paths.dashboard.beneficiaries?.add_database || '/dashboard/beneficiaries/database/add-database/',
    color: 'error',
  },
  {
    label: 'Add Inventory',
    icon: Package,
    href: paths.dashboard.storeInventory?.root || '/dashboard/store&inventory/',
    color: 'success',
  },
  {
    label: 'Create Meeting',
    icon: Calendar,
    href: paths.dashboard.meetingManagement?.create || '/dashboard/meeting-management/create/',
    color: 'info',
  },
  {
    label: 'Create Task',
    icon: ClipboardList,
    href: paths.dashboard.todo?.create || '/dashboard/todo/create/',
    color: 'warning',
  },
  {
    label: 'Create Lead',
    icon: Target,
    href: paths.dashboard.crm?.leads || '/dashboard/crm/leads/',
    color: 'error',
  },
];

function ActionButton({ action }) {
  const theme = useTheme();
  const Icon = action.icon;
  const paletteColor = theme.palette[action.color]?.main || theme.palette.primary.main;

  return (
    <ButtonBase
      component={Link}
      href={action.href}
      sx={{
        width: '100%',
        p: 2,
        borderRadius: 2,
        border: `1.5px dashed ${alpha(theme.palette.text.primary, 0.15)}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        transition: (t) => t.transitions.create(['border-color', 'background-color']),
        '&:hover': {
          borderColor: paletteColor,
          bgcolor: alpha(paletteColor, 0.06),
        },
      }}
    >
      <Box sx={{ color: paletteColor, display: 'flex' }}>
        <Icon size={22} />
      </Box>
      <Typography variant="caption" fontWeight={600} textAlign="center">
        {action.label}
      </Typography>
    </ButtonBase>
  );
}

export default function QuickActions() {
  return (
    <SectionCard title="Quick Actions" description="Navigate to create new items">
      <Grid container spacing={1.5}>
        {actions.map((action) => (
          <Grid key={action.label} size={{ xs: 6, sm: 4, md: 3 }}>
            <ActionButton action={action} />
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  );
}
