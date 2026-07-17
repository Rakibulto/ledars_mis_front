'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

/**
 * Shared card shell used across every dashboard section so spacing,
 * radius, and header layout stay consistent (MUI v7, no Tailwind).
 */
export function SectionCard({ title, description, action, children, sx, contentSx, dense }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: dense ? 2.5 : 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {(title || action) && (
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
      )}
      <Box sx={{ flexGrow: 1, ...contentSx }}>{children}</Box>
    </Card>
  );
}

/** Generic empty state used inside cards when a list/collection is empty. */
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 6,
        px: 2,
        color: 'text.secondary',
      }}
    >
      {Icon && (
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            mb: 2,
          }}
        >
          <Icon size={24} />
        </Box>
      )}
      <Typography variant="subtitle2" color="text.primary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
}

const STATUS_COLOR_KEY = {
  active: 'success',
  completed: 'success',
  approved: 'success',
  won: 'success',
  pending: 'warning',
  rejected: 'error',
  overdue: 'error',
  lost: 'error',
  new: 'info',
  open: 'info',
};

/** Soft-colored status chip (mirrors a "soft" MUI variant without relying on theme overrides). */
export function StatusChip({ status }) {
  const theme = useTheme();
  const normalized = (status || '').toLowerCase();
  const key = STATUS_COLOR_KEY[normalized] || 'default';

  const color = key === 'default' ? theme.palette.text.secondary : theme.palette[key].main;
  const bgcolor =
    key === 'default' ? theme.palette.action.hover : alpha(theme.palette[key].main, 0.12);

  return (
    <Chip
      size="small"
      label={status || '—'}
      sx={{
        bgcolor,
        color,
        fontWeight: 600,
        textTransform: 'capitalize',
        border: 'none',
      }}
    />
  );
}
