'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useGatewayProject } from './gateway-project-context';

/**
 * Printable report chrome — Tally-style header for statements.
 */
export function GatewayReportHeader({
  title,
  dateFrom,
  dateTo,
  subtitle,
  asOf,
}) {
  const { project } = useGatewayProject();
  const period =
    asOf
      ? `As of ${asOf}`
      : dateFrom && dateTo
        ? `${dateFrom} to ${dateTo}`
        : dateFrom || dateTo || '';

  return (
    <Box
      className="print-only-block"
      sx={{
        mb: 2,
        display: { xs: 'none', print: 'block' },
        '@media print': { display: 'block' },
      }}
    >
      <Stack spacing={0.5} alignItems="center" sx={{ textAlign: 'center', py: 1 }}>
        <Typography variant="overline" color="text.secondary">
          LEDARS · Shyamnagar, Satkhira
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {project && (
          <Typography variant="subtitle2">
            {project.code ? `${project.code} — ` : ''}
            {project.short_name || project.title || 'Project'}
          </Typography>
        )}
        {period && (
          <Typography variant="body2" color="text.secondary">
            {period}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />
    </Box>
  );
}

/** Visible on screen as well (lighter chrome). */
export function GatewayReportBanner({ title, dateFrom, dateTo, asOf, extra }) {
  const { project } = useGatewayProject();
  const period =
    asOf
      ? `As of ${asOf}`
      : dateFrom && dateTo
        ? `${dateFrom} → ${dateTo}`
        : '';

  return (
    <Box
      sx={{
        mb: 2,
        px: 2,
        py: 1.5,
        borderRadius: 1.5,
        bgcolor: 'background.neutral',
        border: (theme) => `1px solid ${theme.vars.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {project
              ? `${project.code || ''} ${project.title || ''}`.trim()
              : 'All projects (no project selected)'}
            {period ? ` · ${period}` : ''}
          </Typography>
        </Box>
        {extra}
      </Stack>
    </Box>
  );
}
