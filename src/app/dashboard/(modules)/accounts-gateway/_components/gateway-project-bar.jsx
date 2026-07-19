'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { useGatewayProject } from './gateway-project-context';

export function GatewayProjectBar({ compact = false }) {
  const { project } = useGatewayProject();

  const projectLabel = project
    ? `${project.code ? `${project.code} — ` : ''}${project.short_name || project.title || `Project #${project.id}`}`
    : 'No project selected';

  return (
    <Box
      sx={{
        mb: compact ? 2 : 3,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.vars.palette.divider}`,
        boxShadow: (theme) => theme.customShadows?.z1 || 'none',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:folder-with-files-bold-duotone" width={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">Working project</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {project
                ? projectLabel
                : 'No project selected — pick one from Accounts → Projects in the sidebar'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {project && (
            <Chip
              size="small"
              color="success"
              variant="soft"
              label={project.status || 'Active'}
              icon={<Iconify icon="solar:check-circle-bold" width={16} />}
            />
          )}
          <Chip
            size="medium"
            variant="outlined"
            color={project ? 'default' : 'warning'}
            icon={<Iconify icon="solar:folder-with-files-bold-duotone" width={18} />}
            label={projectLabel}
            sx={{
              maxWidth: { xs: '100%', sm: 360 },
              height: 36,
              borderRadius: 1,
              '& .MuiChip-label': { fontWeight: 600 },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
